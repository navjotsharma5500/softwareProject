/**
 * @module routes/report
 * @description Lost-item report routes mounted at `/api/reports`.
 *
 * | Method | Path               | Auth             | Description                                  |
 * |--------|--------------------|------------------|----------------------------------------------|
 * | POST   | /upload-urls       | ✔               | Get ImageKit upload auth params (max 3)      |
 * | DELETE | /orphaned-images   | ✔               | Delete up to 3 orphaned ImageKit files       |
 * | POST   | /                  | ✔ + notBlacklisted | Submit a new report (idempotent, strict)  |
 * | GET    | /all               | ✔ + adminOnly   | Admin: list all reports                      |
 * | GET    | /my-reports        | ✔               | Paginated list of authenticated user's reports |
 * | GET    | /user/:userId      | ✔ + adminOnly   | Admin: list reports by user ID               |
 * | GET    | /:id               | ✔               | Get single report by ID                      |
 * | PATCH  | /:id               | ✔               | Update own report                            |
 * | DELETE | /:id               | ✔               | Delete own report (best-effort photo cleanup)|
 * | PATCH  | /:id/resolve       | ✔               | Mark own report as resolved                  |
 * | PATCH  | /:id/status        | ✔ + adminOnly   | Admin: update report status                  |
 */
import express from "express";
import {
  isAuthenticated,
  adminOnly,
  notBlacklisted,
} from "../middlewares/auth.middleware.js";
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
  deleteOrphanedImages,
} from "../controllers/report.upload.controller.js";
import {
  createReport,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport,
  resolveOwnReport,
} from "../controllers/report.crud.controller.js";
import {
  getAllReports,
  updateReportStatus,
  getReportsByUserId,
} from "../controllers/report.admin.controller.js";

const router = express.Router();

// Generate presigned URLs for photo uploads (with rate limiting and validation)
router.post(
  "/upload-urls",
  isAuthenticated,
  uploadLimiter,
  validateBodySize(50),
  getUploadUrls,
);

// Delete orphaned images uploaded during an aborted or failed report submission
router.delete(
  "/orphaned-images",
  isAuthenticated,
  uploadLimiter,
  validateBodySize(10),
  deleteOrphanedImages,
);

// Create a new report (with idempotency, rate limiting, and validation to prevent spam)
router.post(
  "/",
  isAuthenticated,
  notBlacklisted,
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
