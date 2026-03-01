import express from "express";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware.js";
import {
  csvDownloadLimiter,
  adminLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import {
  validatePagination,
  validateObjectId,
  sanitizeSearchQuery,
} from "../middlewares/requestValidator.middleware.js";
import {
  listPendingClaims,
  approveClaim,
  rejectClaim,
  listAllItems,
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  getItemClaims,
  downloadDataAsCSV,
} from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes protected with rate limiting and validation
router.get(
  "/items",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validatePagination,
  sanitizeSearchQuery,
  listAllItems,
);
// Admin-only endpoint to list all reports with pagination and filtering
import { listAllReports } from "../controllers/admin.reports.controller.js";
import { getReportById } from "../controllers/admin.reports.controller.js";
router.get(
  "/reports",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validatePagination,
  sanitizeSearchQuery,
  listAllReports,
);

// Admin-only endpoint to get a single report by ID
router.get(
  "/reports/:id",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validateObjectId("id"),
  getReportById,
);
router.post(
  "/items",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  idempotencyMiddleware(86400, true), // Strict mode - require idempotency key
  createItem,
);
router.get(
  "/items/:id",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validateObjectId("id"),
  getItemById,
);
router.patch(
  "/items/:id",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validateObjectId("id"),
  idempotencyMiddleware(3600, true), // Strict mode
  updateItem,
);
router.delete(
  "/items/:id",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validateObjectId("id"),
  idempotencyMiddleware(3600, true), // Strict mode
  deleteItem,
);
router.get(
  "/items/:id/claims",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validateObjectId("id"),
  getItemClaims,
);

router.get(
  "/claims",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validatePagination,
  sanitizeSearchQuery,
  listPendingClaims,
);
router.patch(
  "/claims/:id/approve",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validateObjectId("id"),
  idempotencyMiddleware(86400, true), // Strict mode - critical operation
  approveClaim,
);
router.patch(
  "/claims/:id/reject",
  isAuthenticated,
  adminOnly,
  adminLimiter,
  validateObjectId("id"),
  idempotencyMiddleware(86400, true), // Strict mode - critical operation
  rejectClaim,
);

// CSV download route (with rate limiting to prevent abuse)
router.get(
  "/download-csv",
  isAuthenticated,
  adminOnly,
  csvDownloadLimiter,
  downloadDataAsCSV,
);

export default router;
