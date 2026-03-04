import Item from "../models/item.model.js";
import Claim from "../models/claim.model.js";
import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import { getCache, setCache } from "../utils/redisClient.js";

// Shared cache key with the admin stats endpoint — zero double-computation
const CACHE_KEY = "stats:dashboard";

/**
 * Public stats endpoint — no auth required.
 * Shares a Redis cache key so repeated visits don't hit the DB.
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
