import Item from "../models/item.model.js";
import Claim from "../models/claim.model.js";
import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import { getCache, setCache } from "../utils/redisClient.js";

// Shared cache key with the admin stats endpoint — zero double-computation
const CACHE_KEY = "stats:dashboard";

/**
 * Public stats endpoint — no auth required.
 * Accessible to everyone — no auth required.
 * Shares a Redis cache key so repeated visits don't hit the DB.
 */
export const getPublicStats = async (req, res) => {
  try {
    // Try Redis cache first (uses namespaced key + hit/miss tracking)
    const cached = await getCache(CACHE_KEY);
    if (cached) {
      return res.status(200).json(cached);
    }

    // Build stats from DB
    const [
      totalItems,
      totalClaims,
      totalReports,
      totalUsers,
      foundItems,
      lostItems,
    ] = await Promise.all([
      Item.countDocuments(),
      Claim.countDocuments(),
      Report.countDocuments(),
      User.countDocuments(),
      Item.countDocuments({ isClaimed: true }),
      Item.countDocuments({ isClaimed: false }),
    ]);

    const recoveryRate = totalItems
      ? ((foundItems / totalItems) * 100).toFixed(1)
      : "0.0";

    const helpedUsers = await Claim.distinct("claimant", {
      status: "approved",
    });
    const peopleHelped = helpedUsers.length;

    const stats = {
      totalItems,
      foundItems,
      lostItems,
      totalClaims,
      totalReports,
      totalUsers,
      recoveryRate,
      peopleHelped,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 24 hours
    await setCache(CACHE_KEY, stats, 86400);

    return res.status(200).json(stats);
  } catch (err) {
    console.error("[Public Stats Error]", err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};
