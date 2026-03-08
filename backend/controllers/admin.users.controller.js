/**
 * @module controllers/admin.users
 * @description Admin controllers for user management.
 *
 * Provides paginated, searchable user listing and blacklist toggle.
 * Admins cannot blacklist other admins (returns 403).
 */

import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Report from "../models/report.model.js";
import { deleteFile } from "../utils/s3.utils.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";
import { clearCachePattern } from "../utils/redisClient.js";
import { paginationMeta } from "../utils/helpers.js";

/**
 * List all users with optional search by name, email, or rollNo. Paginated.
 *
 * @route GET /admin/users
 * @access Protected — admins only
 */
export const listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";

    // Filter by blacklist status: "active" | "blacklisted" | "" (all)
    const filter = req.query.filter || "";
    // Sort: "newest" (default) | "oldest" | "name_asc" | "name_desc"
    const sortBy = req.query.sortBy || "newest";

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };
    const sort = sortMap[sortBy] || { createdAt: -1 };

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } },
      ];
    }

    if (filter === "blacklisted") {
      query.isBlacklisted = true;
    } else if (filter === "active") {
      query.isBlacklisted = { $ne: true };
    }

    const [users, total] = await Promise.all([
      withQueryTimeout(
        User.find(query)
          .select("name email phone profilePicture isBlacklisted createdAt")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
      ),
      withQueryTimeout(User.countDocuments(query)),
    ]);

    return res.json({ users, pagination: paginationMeta(page, limit, total) });
  } catch (error) {
    console.error("listUsers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Toggle the blacklist status of a user account.
 * Admins cannot be blacklisted.
 *
 * @route PATCH /admin/users/:id/blacklist
 * @access Protected — admins only
 */
export const toggleBlacklist = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await withQueryTimeout(User.findById(id));
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Cannot blacklist an admin account" });
    }

    user.isBlacklisted = !user.isBlacklisted;
    await user.save();

    return res.json({
      message: user.isBlacklisted
        ? "User has been blacklisted"
        : "User blacklist has been lifted",
      isBlacklisted: user.isBlacklisted,
      userId: user._id,
    });
  } catch (error) {
    console.error("toggleBlacklist error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Permanently delete a user account and cascade-remove all their data.
 *
 * Cascade order:
 *  1. Delete all reports by the user (best-effort ImageKit photo cleanup per report).
 *  2. Delete all claims by the user.
 *  3. Clear per-user Redis caches.
 *  4. Delete the User document.
 *
 * Admins cannot delete other admin accounts.
 * An admin cannot delete their own account via this endpoint.
 *
 * @route DELETE /admin/users/:id
 * @access Protected — admins only
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res
        .status(403)
        .json({ message: "You cannot delete your own account." });
    }

    const user = await withQueryTimeout(User.findById(id));
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Cannot delete an admin account." });
    }

    // 1. Delete all reports owned by this user, cleaning up ImageKit photos.
    const reports = await withQueryTimeout(
      Report.find({ user: id }).select("photos").lean(),
    );
    for (const report of reports) {
      for (const photo of report.photos || []) {
        if (photo.fileId) {
          try {
            await deleteFile(photo.fileId);
          } catch (err) {
            console.error("ImageKit photo cleanup failed:", err.message);
          }
        }
      }
    }
    await Report.deleteMany({ user: id });

    // 2. Delete all claims made by this user.
    await Claim.deleteMany({ claimant: id });

    // 3. Clear caches.
    await clearCachePattern(`user:${id}:*`);
    await clearCachePattern(`user:profile:${id}`);

    // 4. Delete the user.
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      message: `User "${user.name}" and all associated data have been deleted.`,
    });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
