import express from "express";
import {
  healthCheck,
  detailedHealth,
  databaseHealth,
  redisHealth,
} from "../controllers/health.controller.js";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public health check (for load balancers / uptime monitors)
router.get("/", healthCheck);

// Detailed health status (admin only - shows sensitive system info)
router.get("/detailed", isAuthenticated, adminOnly, detailedHealth);

// Component-specific health checks (admin only)
router.get("/database", isAuthenticated, adminOnly, databaseHealth);
router.get("/redis", isAuthenticated, adminOnly, redisHealth);

export default router;
