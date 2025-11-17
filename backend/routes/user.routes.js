import express from "express";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
import { claimLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  claimItem,
  myClaims,
  listItems,
  getItemById,
  getUserHistory,
  getProfile,
  updateProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/items", listItems);
router.get("/items/:id", getItemById);

// Protected routes (authentication required)
router.post("/items/:id/claim", isAuthenticated, claimLimiter, claimItem);
router.get("/my-claims", isAuthenticated, myClaims);
router.get("/profile", isAuthenticated, getProfile);
router.patch("/profile", isAuthenticated, updateProfile);

// Admin only routes
router.get("/history/:userId", isAuthenticated, adminOnly, getUserHistory);

export default router;
