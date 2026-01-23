import Report from "../models/report.model.js";
import {
  generateUploadUrl, // Now returns ImageKit auth params instead of S3 presigned URLs
  deleteFile,
  extractKeyFromUrl,
} from "../utils/s3.utils.js"; // Keeping filename for backwards compatibility

import {
  sendEmail,
  getReportSubmissionEmailBody,
} from "../utils/email.utils.js";

// Generate ImageKit authentication parameters for photo uploads
export const getUploadUrls = async (req, res) => {
  try {
    const { count = 1, fileTypes = [] } = req.body;

    if (count > 3) {
      return res.status(400).json({ message: "Maximum 3 photos allowed" });
    }

    // Generate ImageKit auth params for each file
    const uploadParams = await Promise.all(
      Array.from({ length: count }).map((_, index) =>
        generateUploadUrl("reports", fileTypes[index] || "image/jpeg"),
      ),
    );

    // Return authentication parameters for client-side upload
    res.status(200).json({ uploadParams });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Sanitize category: handle numeric indices or display names
    let sanitizedCategory = category;

    // If numeric (string or number), treat as index into VALID_CATEGORIES
    if (
      typeof sanitizedCategory === "number" ||
      /^\d+$/.test(String(sanitizedCategory))
    ) {
      const idx = parseInt(String(sanitizedCategory), 10);
      if (!isNaN(idx) && VALID_CATEGORIES[idx]) {
        sanitizedCategory = VALID_CATEGORIES[idx];
      } else {
        return res.status(400).json({
          message: `Invalid category index: ${category}. Expected 0-${
            VALID_CATEGORIES.length - 1
          }`,
        });
      }
    }

    // If a display name (e.g., "Electronics"), map back to the key
    if (typeof sanitizedCategory === "string") {
      const foundKey = Object.keys(CATEGORY_DISPLAY_NAMES).find(
        (k) =>
          CATEGORY_DISPLAY_NAMES[k].toLowerCase() ===
          sanitizedCategory.toLowerCase(),
      );
      if (foundKey) {
        sanitizedCategory = foundKey;
      }
    }

    // Final validation: ensure sanitizedCategory is valid
    if (!VALID_CATEGORIES.includes(sanitizedCategory)) {
      return res.status(400).json({
        message: `Invalid category: "${category}". Must be one of: ${VALID_CATEGORIES.join(
          ", ",
        )}`,
      });
    }

    if (photos && photos.length > 3) {
      return res.status(400).json({ message: "Maximum 3 photos allowed" });
    }

    const report = await Report.create({
      user: req.user.id,
      itemDescription,
      category: sanitizedCategory,
      location,
      dateLost,
      additionalDetails,
      photos: photos || [],
    });

    await report.populate("user", "name email rollNo");

    // Send email notification to user
    if (report.user && report.user.email) {
      const subject = "Your lost item report has been submitted";
      const html = getReportSubmissionEmailBody(report);
      sendEmail(report.user.email, subject, html).catch(console.error);
    }

    res.status(201).json({ report, message: "Report created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all reports (admin only)
export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const reports = await Report.find(query)
      .populate("user", "name email rollNo")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Report.countDocuments(query);

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

// Get my reports (user)
export const getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user.id };
    if (status) query.status = status;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Report.countDocuments(query);

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
    const report = await Report.findById(req.params.id).populate(
      "user",
      "name email rollNo",
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
      if (
        typeof sanitizedCategory === "number" ||
        /^\d+$/.test(String(sanitizedCategory))
      ) {
        const idx = parseInt(String(sanitizedCategory), 10);
        if (!isNaN(idx) && VALID_CATEGORIES[idx]) {
          sanitizedCategory = VALID_CATEGORIES[idx];
        } else {
          return res.status(400).json({
            message: `Invalid category index: ${category}`,
          });
        }
      }
      const foundKey = Object.keys(CATEGORY_DISPLAY_NAMES).find(
        (k) =>
          CATEGORY_DISPLAY_NAMES[k].toLowerCase() ===
          sanitizedCategory.toLowerCase(),
      );
      if (foundKey) sanitizedCategory = foundKey;
      if (!VALID_CATEGORIES.includes(sanitizedCategory)) {
        return res.status(400).json({
          message: `Invalid category: "${category}"`,
        });
      }
      report.category = sanitizedCategory;
    }
    if (location) report.location = location;
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

    // Delete photos from ImageKit
    for (const photo of report.photos) {
      const fileId = extractKeyFromUrl(photo);
      if (fileId) {
        try {
          await deleteFile(fileId);
        } catch (err) {
          console.error("Error deleting photo from ImageKit:", err);
        }
      }
    }

    await Report.findByIdAndDelete(req.params.id);

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
