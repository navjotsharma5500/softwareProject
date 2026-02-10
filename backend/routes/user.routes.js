import express from "express";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
import {
  claimLimiter,
  searchLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware.js";
import {
  validatePagination,
  validateObjectId,
  sanitizeSearchQuery,
} from "../middlewares/requestValidator.middleware.js";
import {
  claimItem,
  myClaims,
  listItems,
  getItemById,
  getUserHistory,
  getProfile,
  updateProfile,
  deleteClaim,
  deleteReport,
} from "../controllers/user.controller.js";

const router = express.Router();

// Public routes (with rate limiting for search and validation)
router.get(
  "/items",
  searchLimiter,
  validatePagination,
  sanitizeSearchQuery,
  listItems,
);
router.get("/items/:id", validateObjectId("id"), getItemById);

// Protected routes (authentication required)
router.post(
  "/items/:id/claim",
  isAuthenticated,
  claimLimiter,
  idempotencyMiddleware(86400, true), // Strict mode - prevent duplicate claims
  claimItem,
);
router.get("/my-claims", isAuthenticated, searchLimiter, myClaims);
router.delete(
  "/my-claims/:claimId",
  isAuthenticated,
  claimLimiter,
  idempotencyMiddleware(3600, true), // Strict mode
  deleteClaim,
);
router.get("/profile", isAuthenticated, getProfile);
router.patch(
  "/profile",
  isAuthenticated,
  idempotencyMiddleware(3600, true), // Strict mode
  updateProfile,
);

// Admin only routes
router.get(
  "/history/:userId",
  isAuthenticated,
  adminOnly,
  validateObjectId("userId"),
  getUserHistory,
);

export default router;
