import express from "express";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
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

// Create a new report
router.post("/", isAuthenticated, createReport);

// Get all reports (admin only)
router.get("/all", isAuthenticated, adminOnly, getAllReports);

// Get my reports
router.get("/my-reports", isAuthenticated, getMyReports);

// Get reports by user ID (admin only)
router.get("/user/:userId", isAuthenticated, adminOnly, getReportsByUserId);

// Get a single report by ID
router.get("/:id", isAuthenticated, getReportById);

// Update a report
router.patch("/:id", isAuthenticated, updateReport);

// Delete a report
router.delete("/:id", isAuthenticated, deleteReport);

// Update report status (admin only)
router.patch("/:id/status", isAuthenticated, adminOnly, updateReportStatus);

export default router;
