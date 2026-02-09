import express from "express";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware.js";
import {
  getUploadUrls,
  createReport,
  getAllReports,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport,
  updateReportStatus,
  getReportsByUserId,
} from "../controllers/report.controller.js";

const router = express.Router();

// Generate presigned URLs for photo uploads
router.post("/upload-urls", isAuthenticated, getUploadUrls);

// Create a new report (with idempotency to prevent duplicate submissions)
router.post("/", isAuthenticated, idempotencyMiddleware(86400), createReport);

// Get all reports (admin only)
router.get("/all", isAuthenticated, adminOnly, getAllReports);

// Get my reports
router.get("/my-reports", isAuthenticated, getMyReports);

// Get reports by user ID (admin only)
router.get("/user/:userId", isAuthenticated, adminOnly, getReportsByUserId);

// Get a single report by ID
router.get("/:id", isAuthenticated, getReportById);

// Update a report (with idempotency)
router.patch("/:id", isAuthenticated, idempotencyMiddleware(3600), updateReport);

// Delete a report (with idempotency)
router.delete("/:id", isAuthenticated, idempotencyMiddleware(3600), deleteReport);

// Update report status (admin only, with idempotency)
router.patch("/:id/status", isAuthenticated, adminOnly, idempotencyMiddleware(3600), updateReportStatus);

export default router;
