/**
 * @module controllers/claim
 * @description User-facing claim controllers: submit, delete, and list claims.
 *
 * Business rules enforced here:
 *  - A user cannot have more than one non-rejected claim per item.
 *  - Only **pending** claims may be deleted by the claimant.
 *  - Caches are invalidated on every write to ensure UI consistency.
 */
import Item from "../models/item.model.js";
import Claim from "../models/claim.model.js";
import { getNextSequence } from "../models/counter.model.js";
import { getCache, setCache, clearCachePattern } from "../utils/redisClient.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

/**
 * Creates a pending claim for a found item on behalf of the authenticated user.
 *
 * Guards:
 *  - Returns 400 if the item is already claimed.
 *  - Returns 409 if the user already has a pending claim for this item.
 *  - Returns 400 if the user has been previously rejected and has not had
 *    the rejection cleared.
 *
 * On success generates a `CLAIM000001`-style sequential ID, persists the
 * document, and clears relevant Redis caches.
 *
 * @async
 * @param {import('express').Request}  req - `req.params.id` is the Item `_id`.
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @route POST /user/items/:id/claim
 * @access Protected (authenticated + notBlacklisted)
 */
export const claimItem = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const item = await withQueryTimeout(Item.findById(id));
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.isClaimed) {
      return res
        .status(400)
        .json({ message: "Item already claimed and approved" });
    }

    const existingClaim = await withQueryTimeout(
      Claim.findOne({ item: id, claimant: userId, status: "pending" }),
    );

    if (existingClaim) {
      return res.status(400).json({
        message:
          "You have already claimed this item. Please wait for admin approval.",
      });
    }

    const rejectedClaim = await withQueryTimeout(
      Claim.findOne({ item: id, claimant: userId, status: "rejected" }),
    );

    if (rejectedClaim) {
      return res.status(403).json({
        message:
          "You cannot claim this item as your previous claim was rejected",
      });
    }

    const sequence = await getNextSequence("claimId");
    const claimId = `CLAIM${String(sequence).padStart(6, "0")}`;

    const newClaim = new Claim({
      claimId,
      item: id,
      claimant: userId,
      status: "pending",
    });

    await newClaim.save();

    await clearCachePattern(`user:${userId}:claims:*`);
    await clearCachePattern(`user:${userId}:item-claim:${id}`);
    await clearCachePattern(`item:${id}`);
    await clearCachePattern("items:list:*");

    const populatedClaim = await withQueryTimeout(
      Claim.findById(newClaim._id)
        .populate("claimant", "name email rollNo")
        .populate("item"),
    );

    return res
      .status(200)
      .json({ message: "Claim requested successfully", claim: populatedClaim });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete the authenticated user's own pending claim.
 * Only pending claims may be deleted; approved/rejected claims are immutable.
 * Clears item and user claims cache on success.
 *
 * @route DELETE /user/my-claims/:claimId
 * @access Protected — authenticated users only
 */
export const deleteClaim = async (req, res) => {
  const userId = req.user?.id;
  const { claimId } = req.params;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const claim = await withQueryTimeout(Claim.findById(claimId));

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.claimant.toString() !== userId) {
      return res.status(403).json({
        message: "Access denied. You can only delete your own claims.",
      });
    }

    if (claim.status !== "pending") {
      return res
        .status(400)
        .json({ message: "You can only delete pending claims" });
    }

    await Claim.findByIdAndDelete(claimId);

    await clearCachePattern(`user:${userId}:claims:*`);
    await clearCachePattern(`user:${userId}:item-claim:${claim.item}`);
    await clearCachePattern(`item:${claim.item}`);
    await clearCachePattern("items:list:*");

    res.status(200).json({ message: "Claim deleted successfully" });
  } catch (error) {
    console.error("Delete claim error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get the current user's claim for a single item.
 * Returns the claim document if one exists (status: pending or approved),
 * plus a separate flag if a rejected claim exists.
 * This is the preferred way to check claim status on ItemDetail — it avoids
 * fetching all user claims and then filtering client-side, which was fragile
 * (pagination limits, stale Redis cache with a different page/limit key, etc.)
 *
 * @route GET /user/items/:id/my-claim
 * @access Protected — authenticated users only
 */
export const getMyClaimForItem = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const cacheKey = `user:${userId}:item-claim:${id}`;

  try {
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const [activeClaim, rejectedClaim] = await withQueryTimeout(
      Promise.all([
        Claim.findOne({
          item: id,
          claimant: userId,
          status: { $in: ["pending", "approved"] },
        })
          .select("claimId item claimant status remarks createdAt")
          .lean(),
        Claim.findOne({ item: id, claimant: userId, status: "rejected" })
          .select("_id")
          .lean(),
      ]),
    );

    const responseData = {
      hasClaim: !!activeClaim,
      hasRejectedClaim: !!rejectedClaim,
      claim: activeClaim || null,
    };

    // 60 s TTL — short enough to stay fresh, long enough to absorb repeated
    // visits to the same ItemDetail page within a browsing session.
    setCache(cacheKey, responseData, 60).catch((err) =>
      console.error("[Cache set error]", err.message),
    );

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * List all claims submitted by the authenticated user, paginated.
 * Includes item details (id, name, category, location, date, claimed status).
 * Results are cached per user/page/limit for 3 minutes.
 *
 * @route GET /user/my-claims
 * @access Protected — authenticated users only
 */
export const myClaims = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const cacheKey = `user:${userId}:claims:page=${page}:limit=${limit}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = { claimant: userId };

    const [claims, total] = await withQueryTimeout(
      Promise.all([
        Claim.find(query)
          .select("claimId item claimant status remarks createdAt")
          .populate(
            "item",
            "itemId name category foundLocation dateFound isClaimed",
          )
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        Claim.countDocuments(query),
      ]),
    );

    const totalPages = Math.ceil(total / limit);

    const responseData = {
      claims,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    setCache(cacheKey, responseData, 180).catch((err) => {
      console.error("[Cache set error]", err.message);
    });

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
