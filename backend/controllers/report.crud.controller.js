/**
 * Report — User-facing CRUD operations.
 * Handles creating, reading, updating, deleting, and resolving reports.
 */

import Joi from "joi";
import Report from "../models/report.model.js";
import { getNextSequence } from "../models/counter.model.js";
import { deleteFile } from "../utils/s3.utils.js";
import { getCache, setCache, clearCachePattern } from "../utils/redisClient.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";
import { sanitizeCategory } from "../utils/helpers.js";

// ─── Joi schema for report updates ───────────────────────────────────────────

const updateReportSchema = Joi.object({
  itemDescription: Joi.string().min(2).max(100),
  category: Joi.string().min(1).max(50),
  location: Joi.string().min(2).max(100),
  dateLost: Joi.date().iso(),
  additionalDetails: Joi.string().allow("", null).max(500),
  photos: Joi.array().items(Joi.object()).max(3),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * Create a new lost-item report for the authenticated user.
 * Validates all fields, sanitizes category, limits photos to 3.
 * Generates a sequential reportId (REPORT000001…).
 *
 * @route POST /reports
 * @access Protected — authenticated, non-blacklisted users only
 */
export const createReport = async (req, res) => {
  try {
    let {
      itemDescription,
      category,
      location,
      dateLost,
      additionalDetails,
      photos,
    } = req.body;

    if (!itemDescription || !category || !location || !dateLost) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (typeof itemDescription !== "string" || !itemDescription.trim()) {
      return res.status(400).json({ message: "Item description is required" });
    }
    itemDescription = itemDescription.trim();
    if (itemDescription.length > 100) {
      return res
        .status(400)
        .json({ message: "Item description must not exceed 100 characters" });
    }

    const categoryResult = sanitizeCategory(category);
    if (!categoryResult.valid) {
      return res.status(400).json({ message: categoryResult.error });
    }

    if (typeof location !== "string" || !location.trim()) {
      return res.status(400).json({ message: "Location is required" });
    }
    location = location.trim();
    if (location.length > 100) {
      return res
        .status(400)
        .json({ message: "Location must not exceed 100 characters" });
    }

    if (typeof dateLost !== "string" && !(dateLost instanceof Date)) {
      return res.status(400).json({ message: "Date lost is required" });
    }

    if (photos && Array.isArray(photos) && photos.length > 3) {
      return res.status(400).json({ message: "Maximum 3 photos allowed" });
    }

    if (
      additionalDetails &&
      typeof additionalDetails === "string" &&
      additionalDetails.length > 500
    ) {
      return res
        .status(400)
        .json({ message: "Additional details must not exceed 500 characters" });
    }

    const sequence = await getNextSequence("reportId");
    const reportId = `REPORT${String(sequence).padStart(6, "0")}`;

    const report = await Report.create({
      reportId,
      user: req.user.id,
      itemDescription,
      category: categoryResult.category,
      location,
      dateLost,
      additionalDetails,
      photos: photos || [],
    });

    await report.populate("user", "name email rollNo");

    // Bust the user's reports list cache so getMyReports reflects the new entry.
    await clearCachePattern(`user:${req.user.id}:reports:*`);

    res.status(201).json({ report, message: "Report created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * List the authenticated user's own reports, paginated.
 * Optionally filter by status.
 *
 * @route GET /reports/my-reports
 * @access Protected — authenticated users only
 */
export const getMyReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const cacheKey = `user:${req.user.id}:reports:page=${page}:limit=${limit}:status=${status || "all"}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const query = { user: req.user.id };
    if (status) query.status = status;

    const [reports, count] = await withQueryTimeout(
      Promise.all([
        Report.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Report.countDocuments(query),
      ]),
    );

    const responseData = {
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    };

    // 3 min TTL — matches myClaims; invalidated by deleteReport / resolveOwnReport.
    setCache(cacheKey, responseData, 180).catch((err) =>
      console.error("[Cache set error]", err.message),
    );

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a single report by ID.
 * Only the report owner or an admin may view it.
 *
 * @route GET /reports/:id
 * @access Protected — owner or admin
 */
export const getReportById = async (req, res) => {
  try {
    const report = await withQueryTimeout(
      Report.findById(req.params.id).populate("user", "name email rollNo"),
    );

    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an editable report (owner only).
 * Validates body with Joi. Sanitizes category. Limits photos to 3.
 *
 * @route PATCH /reports/:id
 * @access Protected — report owner only
 */
export const updateReport = async (req, res) => {
  const { error } = updateReportSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      itemDescription,
      category,
      location,
      dateLost,
      additionalDetails,
      photos,
    } = req.body;

    if (photos && photos.length > 3) {
      return res.status(400).json({ message: "Maximum 3 photos allowed" });
    }

    if (itemDescription) report.itemDescription = itemDescription;

    if (category) {
      const categoryResult = sanitizeCategory(category);
      if (!categoryResult.valid) {
        return res.status(400).json({ message: categoryResult.error });
      }
      report.category = categoryResult.category;
    }

    if (location) {
      const trimmed = location.trim();
      if (!trimmed)
        return res.status(400).json({ message: "Location cannot be empty" });
      report.location = trimmed;
    }

    if (dateLost) report.dateLost = dateLost;
    if (additionalDetails !== undefined)
      report.additionalDetails = additionalDetails;
    if (photos) report.photos = photos;

    await report.save();
    await report.populate("user", "name email rollNo");

    // Bust the user's reports list cache so getMyReports reflects the changes.
    await clearCachePattern(`user:${req.user.id}:reports:*`);

    res.status(200).json({ report, message: "Report updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a report (owner or admin).
 * Resolved reports cannot be deleted.
 * Best-effort deletion of associated ImageKit photos.
 * Clears user reports cache on success.
 *
 * @route DELETE /reports/:id
 * @access Protected — owner or admin
 */
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (report.status === "resolved") {
      return res
        .status(400)
        .json({ message: "Resolved reports cannot be deleted" });
    }

    for (const photo of report.photos) {
      if (photo.fileId) {
        try {
          await deleteFile(photo.fileId);
        } catch (err) {
          console.error("Error deleting photo from ImageKit:", err);
        }
      }
    }

    await Report.findByIdAndDelete(req.params.id);
    await clearCachePattern(`user:${report.user}:reports:*`);

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark the authenticated user's own report as resolved.
 * Cannot be undone once resolved.
 *
 * @route PATCH /reports/:id/resolve
 * @access Protected — report owner only
 */
export const resolveOwnReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to resolve this report" });
    }

    if (report.status === "resolved") {
      return res.status(400).json({ message: "Report is already resolved" });
    }

    report.status = "resolved";
    await report.save();
    await clearCachePattern(`user:${report.user}:reports:*`);

    res.status(200).json({ report, message: "Report marked as resolved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
