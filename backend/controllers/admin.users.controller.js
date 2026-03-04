/**
 * @module controllers/admin.users
 * @description Admin controllers for user management.
 *
 * Provides paginated, searchable user listing and blacklist toggle.
 * Admins cannot blacklist other admins (returns 403).
 */

import User from "../models/user.model.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";
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
