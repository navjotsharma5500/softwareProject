import express from "express";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
import { claimLimiter } from "../middlewares/rateLimiter.middleware.js";
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware.js";
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

// Public routes (no authentication required)
router.get("/items", listItems);
router.get("/items/:id", getItemById);

// Protected routes (authentication required)
router.post(
  "/items/:id/claim",
  isAuthenticated,
  claimLimiter,
  idempotencyMiddleware(86400),
  claimItem,
);
router.get("/my-claims", isAuthenticated, myClaims);
router.delete("/my-claims/:claimId", isAuthenticated, idempotencyMiddleware(3600), deleteClaim);
router.get("/profile", isAuthenticated, getProfile);
router.patch(
  "/profile",
  isAuthenticated,
  idempotencyMiddleware(3600),
  updateProfile,
);

// Admin only routes
router.get("/history/:userId", isAuthenticated, adminOnly, getUserHistory);

export default router;
