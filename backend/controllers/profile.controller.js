/**
 * @module controllers/profile
 * @description User profile management controllers.
 *
 * Covers reading and updating the authenticated user's own profile,
 * deleting their own reports, and an admin helper to view a user's full
 * activity history (claims + reports).
 */
import Joi from "joi";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Report from "../models/report.model.js";
import { deleteFile } from "../utils/s3.utils.js";
import { getCache, setCache, clearCachePattern } from "../utils/redisClient.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

/**
 * Returns the authenticated user's public profile fields.
 *
 * Fields returned: `name`, `email`, `rollNo`, `phone`, `profilePicture`,
 * `isAdmin`, `createdAt`. Cached per user for 5 minutes; invalidated on
 * successful profile update.
 *
 * @async
 * @param {import('express').Request}  req - Requires `req.user.id`.
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @route GET /user/profile
 * @access Protected
 */
export const getProfile = async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `user:profile:${userId}`;

  try {
    const cachedProfile = await getCache(cacheKey);
    if (cachedProfile) {
      return res.status(200).json(cachedProfile);
    }

    const user = await withQueryTimeout(
      User.findById(userId)
        .select("name email rollNo phone profilePicture isAdmin createdAt")
        .lean(),
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const responseData = { user };

    setCache(cacheKey, responseData, 300).catch((err) => {
      console.error("[Cache set error]", err.message);
    });

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update allowed profile fields for the authenticated user.
 * Permitted fields: name, rollNo, phone. All other fields are rejected.
 * Validated with Joi. Clears profile cache on success.
 *
 * @route PATCH /user/profile
 * @access Protected — authenticated users only
 */
export const updateProfile = async (req, res) => {
  const allowedFields = ["name", "rollNo", "phone"];
  const disallowed = Object.keys(req.body).filter(
    (f) => !allowedFields.includes(f),
  );
  if (disallowed.length > 0) {
    return res
      .status(400)
      .json({ message: `Cannot update fields: ${disallowed.join(", ")}` });
  }

  const schema = Joi.object({
    name: Joi.string().min(2).max(100),
    rollNo: Joi.alternatives().try(
      Joi.number().integer().min(100000).max(999999999999999),
      Joi.string()
        .pattern(/^\d{6,15}$/)
        .message("Roll number must be 6-15 digits"),
    ),
    phone: Joi.string()
      .pattern(/^\d{10,15}$/)
      .allow(null, ""),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { name, rollNo, phone } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (rollNo !== undefined && rollNo !== null) user.rollNo = String(rollNo);
    if (phone !== undefined) user.phone = phone;
    await user.save();

    await clearCachePattern(`user:profile:${req.user.id}`);

    const updatedUser = await User.findById(req.user.id);
    return res
      .status(200)
      .json({ user: updatedUser, message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete the authenticated user's own lost-item report.
 * Resolved reports cannot be deleted.
 * Deletes associated ImageKit photos (best-effort, errors are logged).
 * Clears user reports cache on success.
 *
 * @route DELETE /user/my-reports/:reportId
 * @access Protected — authenticated users only
 */
export const deleteReport = async (req, res) => {
  const userId = req.user?.id;
  const { reportId } = req.params;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const report = await withQueryTimeout(Report.findById(reportId));

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.user.toString() !== userId) {
      return res.status(403).json({
        message: "Access denied. You can only delete your own reports.",
      });
    }

    if (report.status === "resolved") {
      return res
        .status(400)
        .json({ message: "Resolved reports cannot be deleted" });
    }

    if (report.photos && report.photos.length > 0) {
      for (const photo of report.photos) {
        if (photo?.fileId) {
          try {
            await deleteFile(photo.fileId);
          } catch (err) {
            console.error(`Failed to delete photo ${photo.fileId}:`, err);
          }
        }
      }
    }

    await Report.findByIdAndDelete(reportId);

    await clearCachePattern(`user:${userId}:reports:*`);

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete report error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Fetch full claim and report history for a specific user.
 * Returns up to 50 claims and 50 unresolved reports.
 * Admin-only endpoint.
 *
 * @route GET /user/history/:userId
 * @access Protected — admins only
 */
export const getUserHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const [user, claims, reports] = await withQueryTimeout(
      Promise.all([
        User.findById(userId)
          .select("name email rollNo isBlacklisted createdAt")
          .lean(),
        Claim.find({ claimant: userId })
          .populate("item", "itemId name category foundLocation dateFound")
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
        Report.find({ user: userId, status: { $ne: "resolved" } })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
      ]),
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user,
      claims,
      reports,
      totalClaims: claims.length,
      totalReports: reports.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
