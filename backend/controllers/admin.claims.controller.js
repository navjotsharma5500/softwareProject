/**
 * Admin — Claim management.
 * Handles listing, approving, and rejecting user claims.
 */

import Joi from "joi";
import Claim from "../models/claim.model.js";
import Item from "../models/item.model.js";
import User from "../models/user.model.js";
import { sendEmail, getClaimStatusEmailBody } from "../utils/email.utils.js";
import { clearCachePattern } from "../utils/redisClient.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";
import { paginationMeta } from "../utils/helpers.js";

// Shared Joi schema — both approve and reject accept only an optional remarks field
const remarksSchema = Joi.object({ remarks: Joi.string().allow("", null) });

/**
 * List claims with optional status and search filters, paginated.
 * Defaults to status=pending when no status filter is provided.
 * Search pre-queries User and Item collections to avoid in-memory scans.
 *
 * @route GET /admin/claims
 * @access Protected — admins only
 */
export const listPendingClaims = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    query.status = req.query.status || "pending";

    let claims, total;

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");

      const [matchingUsers, matchingItems] = await withQueryTimeout(
        Promise.all([
          User.find({
            $or: [
              { name: searchRegex },
              { email: searchRegex },
              { rollNo: searchRegex },
            ],
          })
            .select("_id")
            .lean(),
          Item.find({ $or: [{ name: searchRegex }, { itemId: searchRegex }] })
            .select("_id")
            .lean(),
        ]),
      );

      query.$or = [
        { claimId: searchRegex },
        { claimant: { $in: matchingUsers.map((u) => u._id) } },
        { item: { $in: matchingItems.map((i) => i._id) } },
      ];
    }

    [claims, total] = await withQueryTimeout(
      Promise.all([
        Claim.find(query)
          .populate("claimant", "name email rollNo")
          .populate("item")
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        Claim.countDocuments(query),
      ]),
    );

    return res
      .status(200)
      .json({ claims, pagination: paginationMeta(page, limit, total) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Approve a pending claim.
 * Sets item.isClaimed = true and item.owner = claimant.
 * Auto-rejects all other pending claims for the same item.
 * Sends approval email notification. Clears relevant caches.
 *
 * @route PATCH /admin/claims/:id/approve
 * @access Protected — admins only
 */
export const approveClaim = async (req, res) => {
  const { error } = remarksSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const claim = await withQueryTimeout(
      Claim.findById(id).populate("claimant").populate("item"),
    );
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = "approved";
    if (remarks) claim.remarks = remarks;
    await claim.save();

    const item = await withQueryTimeout(Item.findById(claim.item._id));
    if (item) {
      item.isClaimed = true;
      item.owner = claim.claimant._id;
      await item.save();
    }

    // Get other pending claims before auto-rejecting (for cache cleanup)
    const otherPendingClaims = await withQueryTimeout(
      Claim.find({ item: claim.item._id, _id: { $ne: id }, status: "pending" })
        .select("claimant")
        .lean(),
    );

    await Claim.updateMany(
      { item: claim.item._id, _id: { $ne: id }, status: "pending" },
      { status: "rejected", remarks: "Another claim was approved" },
    );

    for (const other of otherPendingClaims) {
      await clearCachePattern(`user:${other.claimant}:claims:*`);
      await clearCachePattern(
        `user:${other.claimant}:item-claim:${claim.item._id}`,
      );
    }

    if (claim.claimant?.email) {
      sendEmail(
        claim.claimant.email,
        "Your claim has been approved",
        getClaimStatusEmailBody(claim, "approved"),
      ).catch(console.error);
    }

    await clearCachePattern("items:list:*");
    await clearCachePattern(`item:${claim.item._id}`);
    await clearCachePattern(`user:${claim.claimant._id}:claims:*`);
    await clearCachePattern(
      `user:${claim.claimant._id}:item-claim:${claim.item._id}`,
    );

    return res.status(200).json({ message: "Claim approved", claim });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Reject a pending claim.
 * Sends rejection email notification. Clears claimant's claims cache.
 *
 * @route PATCH /admin/claims/:id/reject
 * @access Protected — admins only
 */
export const rejectClaim = async (req, res) => {
  const { error } = remarksSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const claim = await withQueryTimeout(
      Claim.findById(id).populate("claimant").populate("item"),
    );
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = "rejected";
    if (remarks) claim.remarks = remarks;
    await claim.save();

    if (claim.claimant?.email) {
      sendEmail(
        claim.claimant.email,
        "Your claim has been rejected",
        getClaimStatusEmailBody(claim, "rejected"),
      ).catch(console.error);
    }

    await clearCachePattern(`user:${claim.claimant._id}:claims:*`);
    await clearCachePattern(
      `user:${claim.claimant._id}:item-claim:${claim.item._id || claim.item}`,
    );

    return res.status(200).json({ message: "Claim rejected", claim });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
