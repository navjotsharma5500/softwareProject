/**
 * @module controllers/admin.items
 * @description Admin controllers for found-item management.
 *
 * Full CRUD for `Item` documents plus a multi-section CSV export endpoint
 * that streams Items, Claims, Users, and Reports up to 10 000 rows each.
 * All writes cascade-clear per-user and global item list caches.
 */

import Joi from "joi";
import Item from "../models/item.model.js";
import Claim from "../models/claim.model.js";
import User from "../models/user.model.js";
import Report from "../models/report.model.js";
import { getNextSequence } from "../models/counter.model.js";
import { clearCachePattern } from "../utils/redisClient.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";
import { sanitizeCategory, paginationMeta } from "../utils/helpers.js";

// ─── Joi schema for partial item updates ─────────────────────────────────────

const updateItemSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  category: Joi.string().min(1).max(100),
  foundLocation: Joi.string().min(1).max(100),
  dateFound: Joi.date().iso(),
  isClaimed: Joi.boolean(),
  owner: Joi.string().hex().length(24),
}).unknown(true);

// ─── CSV helper ───────────────────────────────────────────────────────────────

const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * Create a new found item entry.
 * Auto-generates a sequential itemId (ITEM000001…). Clears items list cache on success.
 *
 * @route POST /admin/items
 * @access Protected — admins only
 */
export const createItem = async (req, res) => {
  let { name, category, foundLocation, dateFound } = req.body;

  if (!name || !category || !foundLocation || !dateFound) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const categoryResult = sanitizeCategory(category);
  if (!categoryResult.valid) {
    return res.status(400).json({ message: categoryResult.error });
  }
  category = categoryResult.category;

  foundLocation = foundLocation.trim();
  if (!foundLocation) {
    return res.status(400).json({ message: "Location cannot be empty" });
  }

  try {
    const sequence = await getNextSequence("itemId");
    const itemId = `ITEM${String(sequence).padStart(6, "0")}`;

    const newItem = new Item({
      itemId,
      name,
      category,
      foundLocation,
      dateFound,
    });
    await newItem.save();

    await clearCachePattern("items:list:*");
    await clearCachePattern("item:*");

    return res
      .status(201)
      .json({ message: "Item created successfully", item: newItem });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update an existing found item.
 * Accepts partial updates validated by Joi. Sanitizes category input.
 * Clears item-specific and list caches on success.
 *
 * @route PATCH /admin/items/:id
 * @access Protected — admins only
 */
export const updateItem = async (req, res) => {
  const { error } = updateItemSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { id } = req.params;
  const updates = req.body;

  if (updates.category) {
    const categoryResult = sanitizeCategory(updates.category);
    if (!categoryResult.valid) {
      return res.status(400).json({ message: categoryResult.error });
    }
    updates.category = categoryResult.category;
  }

  if (updates.foundLocation) {
    updates.foundLocation = updates.foundLocation.trim();
    if (!updates.foundLocation) {
      return res.status(400).json({ message: "Location cannot be empty" });
    }
  }

  try {
    const item = await withQueryTimeout(
      Item.findByIdAndUpdate(id, updates, { new: true, runValidators: true }),
    );
    if (!item) return res.status(404).json({ message: "Item not found" });

    await clearCachePattern("items:list:*");
    await clearCachePattern(`item:${id}`);

    return res.status(200).json({ message: "Item updated successfully", item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete a found item and cascade-delete all associated claims.
 * Clears per-user claim caches for affected claimants, item cache, and list cache.
 *
 * @route DELETE /admin/items/:id
 * @access Protected — admins only
 */
export const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await withQueryTimeout(Item.findById(id));
    if (!item) return res.status(404).json({ message: "Item not found" });

    const claims = await withQueryTimeout(
      Claim.find({ item: id }).select("claimant").lean(),
    );

    await Claim.deleteMany({ item: id });
    await Item.findByIdAndDelete(id);

    for (const claim of claims) {
      await clearCachePattern(`user:${claim.claimant}:claims:*`);
      await clearCachePattern(`user:${claim.claimant}:item-claim:${id}`);
    }

    await clearCachePattern("items:list:*");
    await clearCachePattern(`item:${id}`);

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get a single found item by ID with full owner details.
 *
 * @route GET /admin/items/:id
 * @access Protected — admins only
 */
export const getItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await withQueryTimeout(
      Item.findById(id).populate("owner", "name email rollNo").lean(),
    );
    if (!item) return res.status(404).json({ message: "Item not found" });

    return res.status(200).json({ item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all claims submitted for a specific item, sorted newest-first.
 *
 * @route GET /admin/items/:id/claims
 * @access Protected — admins only
 */
export const getItemClaims = async (req, res) => {
  const { id } = req.params;

  try {
    const claims = await withQueryTimeout(
      Claim.find({ item: id })
        .populate("claimant", "name email rollNo")
        .sort({ createdAt: -1 })
        .lean(),
    );
    return res.status(200).json({ claims });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * List all found items for admin oversight with pagination and filters.
 * Supports search by name/itemId, category, location, and claimed status.
 *
 * @route GET /admin/items
 * @access Protected — admins only
 */
export const listAllItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { itemId: { $regex: req.query.search, $options: "i" } },
      ];
    }

    if (req.query.category) {
      const esc = req.query.category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.category = { $regex: esc, $options: "i" };
    }

    if (req.query.location) {
      const esc = req.query.location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.foundLocation = { $regex: esc, $options: "i" };
    }

    if (req.query.isClaimed !== undefined) {
      query.isClaimed = req.query.isClaimed === "true";
    }

    const [items, total] = await withQueryTimeout(
      Promise.all([
        Item.find(query)
          .select(
            "itemId name category foundLocation dateFound isClaimed owner createdAt",
          )
          .populate("owner", "name email rollNo")
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        Item.countDocuments(query),
      ]),
    );

    return res
      .status(200)
      .json({ items, pagination: paginationMeta(page, limit, total) });
  } catch (error) {
    console.error("listAllItems error:", error.message);
    if (error.message === "Database query timeout") {
      return res
        .status(504)
        .json({ message: "Request timeout, please try again" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Stream a multi-section CSV containing all items, claims, users, and reports.
 * Capped at 10 000 items/claims/reports and 5 000 users. Uses a 30 s timeout.
 *
 * @route GET /admin/download-csv
 * @access Protected — admins only (rate-limited)
 */
export const downloadDataAsCSV = async (req, res) => {
  try {
    const [items, claims, users, reports] = await withQueryTimeout(
      Promise.all([
        Item.find({})
          .populate("owner", "name email rollNo")
          .limit(10000)
          .lean(),
        Claim.find({})
          .populate("claimant", "name email rollNo")
          .populate("item", "itemId name category foundLocation dateFound")
          .limit(10000)
          .lean(),
        User.find({}).limit(5000).lean(),
        Report.find({})
          .populate("user", "name email rollNo")
          .limit(10000)
          .lean(),
      ]),
      30000,
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="lost_found_data_${timestamp}.csv"`,
    );

    res.write("==== ITEMS ====\n");
    res.write(
      "Item ID,Name,Category,Found Location,Date Found,Is Claimed,Owner Name,Owner Email,Owner Roll No,Created At\n",
    );
    items.forEach((item) => {
      res.write(
        [
          escapeCSV(item.itemId),
          escapeCSV(item.name),
          escapeCSV(item.category),
          escapeCSV(item.foundLocation),
          escapeCSV(
            item.dateFound ? new Date(item.dateFound).toLocaleDateString() : "",
          ),
          escapeCSV(item.isClaimed),
          escapeCSV(item.owner?.name || ""),
          escapeCSV(item.owner?.email || ""),
          escapeCSV(item.owner?.rollNo || ""),
          escapeCSV(new Date(item.createdAt).toLocaleString()),
        ].join(",") + "\n",
      );
    });

    res.write("\n==== CLAIMS ====\n");
    res.write(
      "Claim ID,Item ID,Item Name,Item Category,Claimant Name,Claimant Email,Claimant Roll No,Status,Remarks,Created At,Updated At\n",
    );
    claims.forEach((claim) => {
      res.write(
        [
          escapeCSV(claim._id),
          escapeCSV(claim.item?.itemId || ""),
          escapeCSV(claim.item?.name || ""),
          escapeCSV(claim.item?.category || ""),
          escapeCSV(claim.claimant?.name || ""),
          escapeCSV(claim.claimant?.email || ""),
          escapeCSV(claim.claimant?.rollNo || ""),
          escapeCSV(claim.status),
          escapeCSV(claim.remarks || ""),
          escapeCSV(new Date(claim.createdAt).toLocaleString()),
          escapeCSV(new Date(claim.updatedAt).toLocaleString()),
        ].join(",") + "\n",
      );
    });

    res.write("\n==== USERS ====\n");
    res.write(
      "User ID,Name,Email,Roll No,Phone,Is Admin,Google ID,Created At\n",
    );
    users.forEach((user) => {
      res.write(
        [
          escapeCSV(user._id),
          escapeCSV(user.name),
          escapeCSV(user.email),
          escapeCSV(user.rollNo),
          escapeCSV(user.phone || ""),
          escapeCSV(user.isAdmin),
          escapeCSV(user.googleId),
          escapeCSV(new Date(user.createdAt).toLocaleString()),
        ].join(",") + "\n",
      );
    });

    res.write("\n==== REPORTS ====\n");
    res.write(
      "Report ID,Reporter Name,Reporter Email,Reporter Roll No,Item Description,Category,Location,Date Lost,Additional Details,Status,Created At\n",
    );
    reports.forEach((report) => {
      res.write(
        [
          escapeCSV(report._id),
          escapeCSV(report.user?.name || ""),
          escapeCSV(report.user?.email || ""),
          escapeCSV(report.user?.rollNo || ""),
          escapeCSV(report.itemDescription),
          escapeCSV(report.category),
          escapeCSV(report.location),
          escapeCSV(
            report.dateLost
              ? new Date(report.dateLost).toLocaleDateString()
              : "",
          ),
          escapeCSV(report.additionalDetails || ""),
          escapeCSV(report.status),
          escapeCSV(new Date(report.createdAt).toLocaleString()),
        ].join(",") + "\n",
      );
    });

    res.end();
  } catch (error) {
    console.error("downloadDataAsCSV error:", error.message);
    if (error.message === "Database query timeout") {
      return res
        .status(504)
        .json({ message: "Request timeout. Please try again." });
    }
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate CSV download" });
    }
  }
};
