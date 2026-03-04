/**
 * @module routes/stats
 * @description Public statistics routes mounted at `/api/stats`.
 *
 * | Method | Path | Auth | Description                          |
 * |--------|------|------|--------------------------------------|
 * | GET    | /    | —    | Returns aggregate dashboard metrics  |
 */
import express from "express";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";
import { getPublicStats } from "../controllers/stats.controller.js";

const router = express.Router();

/** @route GET /stats */
router.get("/", apiLimiter, getPublicStats);

export default router;
