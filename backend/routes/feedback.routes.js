import express from "express";
import {
  submitFeedback,
  getFeedbackFeed,
  getMyFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getAllFeedback,
  respondToFeedback,
  updateFeedbackStatus,
  approveFeedback,
} from "../controllers/feedback.controller.js";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
import { feedbackLimiter } from "../middlewares/rateLimiter.middleware.js";
const router = express.Router();

// Public routes (authentication required)
router.post("/", isAuthenticated, feedbackLimiter, submitFeedback); // Rate limiter: 5 requests per 15 minutes
router.get("/feed", getFeedbackFeed); // Public feed - no auth required
router.get("/my-feedback", isAuthenticated, getMyFeedback);
router.get("/:id", isAuthenticated, getFeedbackById);
router.put("/:id", isAuthenticated, updateFeedback);
router.delete("/:id", isAuthenticated, deleteFeedback);

// Admin routes
router.get("/admin/all", isAuthenticated, adminOnly, getAllFeedback);
router.post("/:id/respond", isAuthenticated, adminOnly, respondToFeedback);
router.patch("/:id/status", isAuthenticated, adminOnly, updateFeedbackStatus);
router.patch("/:id/approve", isAuthenticated, adminOnly, approveFeedback);

export default router;
