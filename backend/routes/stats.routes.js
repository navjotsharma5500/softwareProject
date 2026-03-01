import express from "express";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";
import { getPublicStats } from "../controllers/stats.controller.js";

const router = express.Router();

// Public — no auth required
router.get("/", apiLimiter, getPublicStats);

export default router;
