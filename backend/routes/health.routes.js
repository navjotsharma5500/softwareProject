/**
 * @module routes/health
 * @description Health-check routes mounted at `/api/health`.
 *
 * | Method | Path      | Auth          | Description                              |
 * |--------|-----------|---------------|------------------------------------------|
 * | GET    | /         | — (public)   | Liveness probe for load balancers        |
 * | GET    | /detailed | ✔ + adminOnly | Full readiness probe (services + system) |
 * | GET    | /database | ✔ + adminOnly | MongoDB round-trip latency check         |
 * | GET    | /redis    | ✔ + adminOnly | Redis PING + read/write round-trip check |
 */
import express from "express";
import {
  healthCheck,
  detailedHealth,
  databaseHealth,
  redisHealth,
} from "../controllers/health.controller.js";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

/** @route GET /health — public liveness probe */
router.get("/", healthCheck);

/** @route GET /health/detailed — full readiness probe (admin only) */
router.get("/detailed", isAuthenticated, adminOnly, detailedHealth);

/** @route GET /health/database — MongoDB connectivity check (admin only) */
router.get("/database", isAuthenticated, adminOnly, databaseHealth);

/** @route GET /health/redis — Redis connectivity check (admin only) */
router.get("/redis", isAuthenticated, adminOnly, redisHealth);

export default router;
