/**
 * @module controllers/stats
 * @description Public statistics endpoint for the portal dashboard.
 *
 * Executes 8 Mongoose aggregation queries in parallel and caches the
 * combined result in Redis under `stats:dashboard` for 10 minutes.
 * The admin stats view shares the same cache key to avoid redundant
 * double-computation.
 */
import Item from "../models/item.model.js";
import Claim from "../models/claim.model.js";
import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import { getCache, setCache } from "../utils/redisClient.js";

/** Redis key shared with the admin stats endpoint. */
const CACHE_KEY = "stats:dashboard";

/**
 * Returns aggregate portal statistics.
 *
 * Response shape:
 * ```json
 * {
 *   "totalItems": 120,
 *   "foundItems": 95,
 *   "lostItems": 25,
 *   "totalClaims": 80,
 *   "totalReports": 30,
 *   "totalUsers": 200,
 *   "blacklistedUsers": 3,
 *   "recoveryRate": "79.17",
 *   "peopleHelped": 70
 * }
 * ```
 *
 * @async
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @route GET /stats
 * @access Public
 */
export const getPublicStats = async (req, res) => {
  try {
    const cached = await getCache(CACHE_KEY);
    if (cached) {
      return res.status(200).json(cached);
    }

    const [
      totalItems,
      totalClaims,
      totalReports,
      totalUsers,
      blacklistedUsers,
      foundItems,
      lostItems,
      helpedUserIds,
    ] = await Promise.all([
      Item.countDocuments(),
      Claim.countDocuments(),
      Report.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ isBlacklisted: true }),
      Item.countDocuments({ isClaimed: true }),
      Item.countDocuments({ isClaimed: false }),
      Claim.distinct("claimant", { status: "approved" }),
    ]);

    const stats = {
      totalItems,
      foundItems,
      lostItems,
      totalClaims,
      totalReports,
      totalUsers,
      blacklistedUsers,
      recoveryRate: totalItems
        ? ((foundItems / totalItems) * 100).toFixed(1)
        : "0.0",
      peopleHelped: helpedUserIds.length,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 10 minutes — aggregate queries are expensive but stats don't
    // need to be real-time; 10 min is a reasonable balance between freshness
    // and DB load. (Previously 24 h, which hid newly added items/claims.)
    await setCache(CACHE_KEY, stats, 600);

    return res.status(200).json(stats);
  } catch (err) {
    console.error("[Public Stats Error]", err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};
