import Report from "../models/report.model.js";
import { getNextSequence } from "../models/counter.model.js";
import {
  generateUploadUrl, // Now returns ImageKit auth params instead of S3 presigned URLs
  deleteFile,
  extractKeyFromUrl,
} from "../utils/s3.utils.js"; // Keeping filename for backwards compatibility
import { getCache, setCache, clearCachePattern } from "../utils/redisClient.js";

import {
  sendEmail,
  getReportSubmissionEmailBody,
} from "../utils/email.utils.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

// Generate ImageKit authentication parameters for photo uploads
export const getUploadUrls = async (req, res) => {
  try {
    const { count = 1, fileTypes = [] } = req.body;

    // Validate count
    if (!count || count < 1) {
      return res.status(400).json({ message: "Invalid count parameter" });
    }

    if (count > 3) {
      return res.status(400).json({ message: "Maximum 3 photos allowed" });
    }

    // Validate file types if provided
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (fileTypes.length > 0) {
      const invalidTypes = fileTypes.filter(
        (type) => !allowedTypes.includes(type),
      );
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          message: `Invalid file types. Allowed: ${allowedTypes.join(", ")}`,
        });
      }
    }

    // Set timeout for upload URL generation
    const uploadTimeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Upload URL generation timeout")),
        5000,
      ),
    );

    // Generate ImageKit auth params for each file with timeout
    const uploadParamsPromise = Promise.all(
      Array.from({ length: count }).map((_, index) =>
        generateUploadUrl("reports", fileTypes[index] || "image/jpeg"),
      ),
    );

    const uploadParams = await Promise.race([
      uploadParamsPromise,
      uploadTimeout,
    ]);

    // Return authentication parameters for client-side upload
    res.status(200).json({ uploadParams });
  } catch (error) {
    console.error("Upload URL generation error:", error);
    if (error.message === "Upload URL generation timeout") {
      return res
        .status(504)
        .json({ message: "Upload service timeout, please try again" });
    }
    res.status(500).json({ message: "Failed to generate upload URLs" });
  }
};

// Valid categories (must match frontend constants.js and report.model.js)
const VALID_CATEGORIES = [
  "bottle",
  "earpods",
  "watch",
  "phone",
  "wallet",
  "id_card",
  "keys",
  "bag",
  "laptop",
  "charger",
  "books",
  "stationery",
  "glasses",
  "jewelry",
  "clothing",
  "electronics",
  "other",
];

// Display name mapping (optional - for better error messages)
const CATEGORY_DISPLAY_NAMES = {
  bottle: "Water Bottle",
  earpods: "Earpods",
  watch: "Watch",
  phone: "Phone",
  wallet: "Wallet",
  id_card: "ID Card",
  keys: "Keys",
  bag: "Bag",
  laptop: "Laptop",
  charger: "Charger",
  books: "Books",
  stationery: "Stationery",
  glasses: "Glasses",
  jewelry: "Jewelry",
  clothing: "Clothing",
  electronics: "Electronics",
  other: "Other",
};

// Create a new report
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

    // Strict input size validation (must match frontend)
    if (
      typeof itemDescription !== "string" ||
      itemDescription.trim().length === 0
    ) {
      return res.status(400).json({ message: "Item description is required" });
    }
    if (itemDescription.length > 100) {
      return res
        .status(400)
        .json({ message: "Item description must not exceed 100 characters" });
    }

    let sanitizedCategory = category;
    if (
      typeof sanitizedCategory !== "string" ||
      sanitizedCategory.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Category must be a non-empty string" });
    }
    sanitizedCategory = sanitizedCategory.trim();
    // If numeric (string or number), treat as index into VALID_CATEGORIES (backward compatibility)
    if (/^\d+$/.test(sanitizedCategory)) {
      const idx = parseInt(sanitizedCategory, 10);
      if (!isNaN(idx) && VALID_CATEGORIES[idx]) {
        sanitizedCategory = VALID_CATEGORIES[idx];
      }
    }
    // If a display name (e.g., "Electronics"), map back to the key (backward compatibility)
    const foundKey = Object.keys(CATEGORY_DISPLAY_NAMES).find(
      (k) =>
        CATEGORY_DISPLAY_NAMES[k].toLowerCase() ===
        sanitizedCategory.toLowerCase(),
    );
    if (foundKey) {
      sanitizedCategory = foundKey;
    }
    if (sanitizedCategory.length > 50) {
      return res
        .status(400)
        .json({ message: "Category must not exceed 50 characters" });
    }

    if (typeof location !== "string" || location.trim().length === 0) {
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

    // Trim and validate location
    location = location.trim();
    if (!location) {
      return res.status(400).json({ message: "Location cannot be empty" });
    }

    if (photos && photos.length > 3) {
      return res.status(400).json({ message: "Maximum 3 photos allowed" });
    }

    // Enforce character limits for itemDescription and additionalDetails
    if (itemDescription.length > 100) {
      return res
        .status(400)
        .json({ message: "Item description must not exceed 100 characters" });
    }

    if (additionalDetails && additionalDetails.length > 500) {
      return res
        .status(400)
        .json({ message: "Additional details must not exceed 500 characters" });
    }

    // Auto-generate Report ID using atomic counter
    const sequence = await getNextSequence("reportId");
    const reportId = `REPORT${String(sequence).padStart(6, "0")}`;

    const report = await Report.create({
      reportId,
      user: req.user.id,
      itemDescription,
      category: sanitizedCategory,
      location,
      dateLost,
      additionalDetails,
      photos: photos || [],
    });

    await report.populate("user", "name email rollNo");

    // NOTE: We do not send an email when a report is submitted.
    // Users are responsible for checking the portal for matching items and
    // submitting claims; admin will handle in-person verification.

    res.status(201).json({ report, message: "Report created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all reports (admin only)
export const getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50
    const skip = (page - 1) * limit;
    const { status, category } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    // Add timeout protection
    const timeout = 10000; // 10 seconds
    const queryTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeout),
    );

    const queryPromise = Promise.all([
      Report.find(query)
        .populate("user", "name email rollNo")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Report.countDocuments(query),
    ]);

    const [reports, count] = await withQueryTimeout(
      Promise.all([
        Report.find(query)
          .populate("user", "name email rollNo")
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Report.countDocuments(query),
      ]),
    );

    res.status(200).json({
      reports,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all reports error:", error.message);
    if (error.message === "Query timeout") {
      return res
        .status(504)
        .json({ message: "Request timeout, please try again" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get my reports (user)
export const getMyReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50
    const skip = (page - 1) * limit;
    const { status } = req.query;

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

    res.status(200).json({
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single report by ID
export const getReportById = async (req, res) => {
  try {
    const report = await withQueryTimeout(
      Report.findById(req.params.id).populate("user", "name email rollNo"),
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Only owner or admin can view
    if (report.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a report
export const updateReport = async (req, res) => {
  // Joi validation
  const Joi = (await import("joi")).default;
  const schema = Joi.object({
    itemDescription: Joi.string().min(2).max(200),
    category: Joi.string().min(2).max(50),
    location: Joi.string().min(2).max(100),
    dateLost: Joi.date().iso(),
    additionalDetails: Joi.string().allow("", null),
    photos: Joi.array().items(Joi.string().uri()).max(3),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    // Only owner can update
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
    // ...existing code for updating fields...
    if (itemDescription) report.itemDescription = itemDescription;
    if (category) {
      // Sanitize category on update too
      let sanitizedCategory = category;

      if (!sanitizedCategory || typeof sanitizedCategory !== "string") {
        return res
          .status(400)
          .json({ message: "Category must be a non-empty string" });
      }

      sanitizedCategory = sanitizedCategory.trim();

      if (sanitizedCategory.length === 0) {
        return res.status(400).json({ message: "Category cannot be empty" });
      }

      // If numeric (string or number), treat as index into VALID_CATEGORIES (backward compatibility)
      if (/^\d+$/.test(sanitizedCategory)) {
        const idx = parseInt(sanitizedCategory, 10);
        if (!isNaN(idx) && VALID_CATEGORIES[idx]) {
          sanitizedCategory = VALID_CATEGORIES[idx];
        }
      }

      // If a display name, map back to the key (backward compatibility)
      const foundKey = Object.keys(CATEGORY_DISPLAY_NAMES).find(
        (k) =>
          CATEGORY_DISPLAY_NAMES[k].toLowerCase() ===
          sanitizedCategory.toLowerCase(),
      );
      if (foundKey) sanitizedCategory = foundKey;

      // Accept any non-empty string (no strict validation)
      report.category = sanitizedCategory;
    }
    if (location) {
      location = location.trim();
      if (!location) {
        return res.status(400).json({ message: "Location cannot be empty" });
      }
      report.location = location;
    }
    if (dateLost) report.dateLost = dateLost;
    if (additionalDetails !== undefined)
      report.additionalDetails = additionalDetails;
    if (photos) report.photos = photos;
    await report.save();
    await report.populate("user", "name email rollNo");
    res.status(200).json({ report, message: "Report updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a report
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Only owner or admin can delete
    if (report.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete photos from ImageKit (cascading delete)
    for (const photo of report.photos) {
      if (photo.fileId) {
        // ✅ use stored fileId directly
        try {
          await deleteFile(photo.fileId);
        } catch (err) {
          console.error("Error deleting photo from ImageKit:", err);
        }
      }
    }

    await Report.findByIdAndDelete(req.params.id);

    // Clear relevant caches (cascading cache cleanup)
    await clearCachePattern(`user:${report.user}:reports:*`);

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update report status (admin only)
export const updateReportStatus = async (req, res) => {
  // Joi validation
  const Joi = (await import("joi")).default;
  const schema = Joi.object({
    status: Joi.string().valid("active", "resolved", "closed").required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).populate("user", "name email rollNo");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res
      .status(200)
      .json({ report, message: "Report status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reports by user ID (admin only - for viewing user's history)
export const getReportsByUserId = async (req, res) => {
  try {
    const reports = await Report.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
