import express from "express";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware.js";
import {
  uploadLimiter,
  reportLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import {
  validatePagination,
  validateObjectId,
  validateBodySize,
} from "../middlewares/requestValidator.middleware.js";
import {
  getUploadUrls,
  createReport,
  getAllReports,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport,
  updateReportStatus,
  resolveOwnReport,
  getReportsByUserId,
} from "../controllers/report.controller.js";

const router = express.Router();

// Generate presigned URLs for photo uploads (with rate limiting and validation)
router.post(
  "/upload-urls",
  isAuthenticated,
  uploadLimiter,
  validateBodySize(50),
  getUploadUrls,
);

// Create a new report (with idempotency, rate limiting, and validation to prevent spam)
router.post(
  "/",
  isAuthenticated,
  reportLimiter,
  validateBodySize(200),
  idempotencyMiddleware(86400, true),
  createReport,
);

// Get all reports (admin only)
router.get(
  "/all",
  isAuthenticated,
  adminOnly,
  validatePagination,
  getAllReports,
);

// Get my reports
router.get("/my-reports", isAuthenticated, validatePagination, getMyReports);

// Get reports by user ID (admin only)
router.get(
  "/user/:userId",
  isAuthenticated,
  adminOnly,
  validateObjectId("userId"),
  getReportsByUserId,
);

// Get a single report by ID
router.get("/:id", isAuthenticated, validateObjectId("id"), getReportById);

// Update a report (with strict idempotency and validation)
router.patch(
  "/:id",
  isAuthenticated,
  uploadLimiter,
  validateObjectId("id"),
  validateBodySize(200),
  idempotencyMiddleware(3600, true), // Strict mode
  updateReport,
);

// Delete a report (with strict idempotency and validation)
router.delete(
  "/:id",
  isAuthenticated,
  validateObjectId("id"),
  idempotencyMiddleware(3600, true), // Strict mode
  deleteReport,
);

// Resolve own report (owner only)
router.patch(
  "/:id/resolve",
  isAuthenticated,
  validateObjectId("id"),
  idempotencyMiddleware(3600, true), // Strict mode
  resolveOwnReport,
);

// Update report status (admin only, with strict idempotency and validation)
router.patch(
  "/:id/status",
  isAuthenticated,
  adminOnly,
  validateObjectId("id"),
  idempotencyMiddleware(3600, true), // Strict mode
  updateReportStatus,
);

export default router;
