import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { claimLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  claimItem,
  myClaims,
  listItems,
  getItemById,
} from "../controllers/user.controller.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/items", listItems);
router.get("/items/:id", getItemById);

// Protected routes (authentication required)
router.post("/items/:id/claim", isAuthenticated, claimLimiter, claimItem);
router.get("/my-claims", isAuthenticated, myClaims);

export default router;
