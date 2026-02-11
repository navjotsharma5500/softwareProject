import Item from "../models/item.model.js";
import Claim from "../models/claim.model.js";
import Report from "../models/report.model.js";
import { getNextSequence } from "../models/counter.model.js";

import { sendEmail, getClaimStatusEmailBody } from "../utils/email.utils.js";
import User from "../models/user.model.js";
import { clearCachePattern } from "../utils/redisClient.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

// Valid categories (must match frontend constants.js and models)
const VALID_CATEGORIES = [
  "bottle",
  "earpods",
  "watch",
  "phone",
  "wallet",
  "id_card",
  "keys",
  "bag",
  "laptop",
  "charger",
  "books",
  "stationery",
  "glasses",
  "jewelry",
  "clothing",
  "electronics",
  "other",
];

const CATEGORY_DISPLAY_NAMES = {
  bottle: "Water Bottle",
  earpods: "Earpods",
  watch: "Watch",
  phone: "Phone",
  wallet: "Wallet",
  id_card: "ID Card",
  keys: "Keys",
  bag: "Bag",
  laptop: "Laptop",
  charger: "Charger",
  books: "Books",
  stationery: "Stationery",
  glasses: "Glasses",
  jewelry: "Jewelry",
  clothing: "Clothing",
  electronics: "Electronics",
  other: "Other",
};

// Helper to sanitize category input (now accepts custom categories)
const sanitizeCategory = (category) => {
  if (!category || typeof category !== "string") {
    return { valid: false, error: "Category must be a non-empty string" };
  }

  let sanitized = category.trim();

  if (sanitized.length === 0) {
    return { valid: false, error: "Category cannot be empty" };
  }

  // Handle numeric indices (backward compatibility)
  if (/^\d+$/.test(sanitized)) {
    const idx = parseInt(sanitized, 10);
    if (!isNaN(idx) && VALID_CATEGORIES[idx]) {
      sanitized = VALID_CATEGORIES[idx];
    }
  }

  // Handle display names (backward compatibility)
  const foundKey = Object.keys(CATEGORY_DISPLAY_NAMES).find(
    (k) => CATEGORY_DISPLAY_NAMES[k].toLowerCase() === sanitized.toLowerCase(),
  );
  if (foundKey) {
    sanitized = foundKey;
  }

  // Accept any non-empty string (no strict validation)
  return { valid: true, category: sanitized };
};

// Create a new item
export const createItem = async (req, res) => {
  let { name, category, foundLocation, dateFound } = req.body;

  if (!name || !category || !foundLocation || !dateFound) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Sanitize and trim category
  const categoryResult = sanitizeCategory(category);
  if (!categoryResult.valid) {
    return res.status(400).json({ message: categoryResult.error });
  }
  category = categoryResult.category;

  // Trim and validate location
  foundLocation = foundLocation.trim();
  if (!foundLocation) {
    return res.status(400).json({ message: "Location cannot be empty" });
  }

  try {
    // Auto-generate Item ID using atomic counter to prevent race conditions
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

    // Clear items cache after creating a new item
    await clearCachePattern("items:list:*");
    // Clear all item detail caches to be safe
    await clearCachePattern("item:*");

    return res
      .status(201)
      .json({ message: "Item created successfully", item: newItem });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update an existing item
export const updateItem = async (req, res) => {
  // Joi validation
  const Joi = (await import("joi")).default;
  const schema = Joi.object({
    name: Joi.string().min(2).max(100),
    category: Joi.string().min(1).max(100), // Allow longer custom categories
    foundLocation: Joi.string().min(1).max(100), // Allow longer custom locations
    dateFound: Joi.date().iso(),
    isClaimed: Joi.boolean(),
    owner: Joi.string().hex().length(24),
  }).unknown(true); // Allow unknown fields (they will be stripped)
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  const { id } = req.params;
  const updates = req.body;

  // Sanitize category if present in updates
  if (updates.category) {
    const categoryResult = sanitizeCategory(updates.category);
    if (!categoryResult.valid) {
      return res.status(400).json({ message: categoryResult.error });
    }
    updates.category = categoryResult.category;
  }

  // Trim and validate location if present
  if (updates.foundLocation) {
    updates.foundLocation = updates.foundLocation.trim();
    if (!updates.foundLocation) {
      return res.status(400).json({ message: "Location cannot be empty" });
    }
  }

  try {
    const item = await withQueryTimeout(
      Item.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }),
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Clear items cache after updating an item
    await clearCachePattern("items:list:*");
    // Clear this specific item's cache
    await clearCachePattern(`item:${id}`);

    return res.status(200).json({ message: "Item updated successfully", item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete an item
export const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await withQueryTimeout(Item.findByIdAndDelete(id));
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    // Also delete all claims associated with this item
    await Claim.deleteMany({ item: id });

    // Clear items cache after deleting an item
    await clearCachePattern("items:list:*");
    // Clear this specific item's cache
    await clearCachePattern(`item:${id}`);

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get item by ID
export const getItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await withQueryTimeout(
      Item.findById(id).populate("owner", "name email rollNo").lean(),
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    return res.status(200).json({ item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all claims for a specific item
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

// List pending claims: claims with status "pending"
// List claims with filters
export const listPendingClaims = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on filters
    const query = {};

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    } else {
      query.status = "pending"; // Default to pending
    }

    // Search filter (search in claimant name or item name)
    let claims, total;

    if (req.query.search) {
      // If search is provided, we need to populate first then filter
      // Limit to prevent memory issues
      const allClaims = await Claim.find(query)
        .populate("claimant", "name email rollNo")
        .populate("item")
        .limit(1000) // Prevent loading too many records
        .sort({ createdAt: -1 });

      const searchLower = req.query.search.toLowerCase();
      const filteredClaims = allClaims.filter(
        (claim) =>
          claim.claimant?.name?.toLowerCase().includes(searchLower) ||
          claim.claimant?.email?.toLowerCase().includes(searchLower) ||
          claim.item?.name?.toLowerCase().includes(searchLower) ||
          claim.item?.itemId?.toLowerCase().includes(searchLower),
      );

      total = filteredClaims.length;
      claims = filteredClaims.slice(skip, skip + limit);
    } else {
      [claims, total] = await withQueryTimeout(
        Promise.all([
          Claim.find(query)
            .populate("claimant", "name email rollNo")
            .populate("item")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Claim.countDocuments(query),
        ]),
      );
    }

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      claims,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Approve a claim
export const approveClaim = async (req, res) => {
  // Joi validation
  const Joi = (await import("joi")).default;
  const schema = Joi.object({
    remarks: Joi.string().allow("", null),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  const { id } = req.params; // claim ID
  const { remarks } = req.body;
  try {
    const claim = await withQueryTimeout(
      Claim.findById(id).populate("claimant").populate("item"),
    );
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    claim.status = "approved";
    if (remarks) claim.remarks = remarks;
    await claim.save();
    // Update the item to set isClaimed = true and owner
    const item = await withQueryTimeout(Item.findById(claim.item._id));
    if (item) {
      item.isClaimed = true;
      item.owner = claim.claimant._id;
      await item.save();
    }
    // Reject all other pending claims for this item
    await Claim.updateMany(
      { item: claim.item._id, _id: { $ne: id }, status: "pending" },
      { status: "rejected", remarks: "Another claim was approved" },
    );
    // Send email notification to claimant
    if (claim.claimant && claim.claimant.email) {
      const subject = "Your claim has been approved";
      const html = getClaimStatusEmailBody(claim, "approved");
      sendEmail(claim.claimant.email, subject, html).catch(console.error);
    }

    // Clear items cache since item claimed status changed
    await clearCachePattern("items:list:*");
    // Clear specific item cache
    await clearCachePattern(`item:${claim.item._id}`);
    // Clear claimant's claims cache
    await clearCachePattern(`user:${claim.claimant._id}:claims:*`);

    return res.status(200).json({ message: "Claim approved", claim });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reject a claim
export const rejectClaim = async (req, res) => {
  // Joi validation
  const Joi = (await import("joi")).default;
  const schema = Joi.object({
    remarks: Joi.string().allow("", null),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  const { id } = req.params; // claim ID
  const { remarks } = req.body;
  try {
    const claim = await withQueryTimeout(
      Claim.findById(id).populate("claimant").populate("item"),
    );
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    claim.status = "rejected";
    if (remarks) claim.remarks = remarks;
    await claim.save();
    // Send email notification to claimant
    if (claim.claimant && claim.claimant.email) {
      const subject = "Your claim has been rejected";
      const html = getClaimStatusEmailBody(claim, "rejected");
      sendEmail(claim.claimant.email, subject, html).catch(console.error);
    }

    // Clear claimant's claims cache
    await clearCachePattern(`user:${claim.claimant._id}:claims:*`);

    return res.status(200).json({ message: "Claim rejected", claim });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// List all items for admin oversight with pagination and filters
export const listAllItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 items per page
    const skip = (page - 1) * limit;

    // Set timeout for query to prevent long-running requests
    const timeout = 10000; // 10 seconds
    const queryTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeout),
    );

    // Build query object based on filters
    const query = {};

    // Search filter (search in name and itemId)
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { itemId: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Location filter
    if (req.query.location) {
      query.foundLocation = req.query.location;
    }

    // Status filter (claimed/available)
    if (req.query.isClaimed !== undefined) {
      query.isClaimed = req.query.isClaimed === "true";
    }

    const queryPromise = Promise.all([
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
    ]);

    const [items, total] = await Promise.race([queryPromise, queryTimeout]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("List all items error:", error.message);
    if (error.message === "Query timeout") {
      return res
        .status(504)
        .json({ message: "Request timeout, please try again" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Download all data as CSV
export const downloadDataAsCSV = async (req, res) => {
  try {
    // Set timeout for CSV generation to prevent long-running requests
    const timeout = 30000; // 30 seconds
    const csvTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("CSV generation timeout")), timeout),
    );

    // Get all data from the database with limits to prevent memory overload
    const dataPromise = Promise.all([
      Item.find({}).populate("owner", "name email rollNo").limit(10000).lean(),
      Claim.find({})
        .populate("claimant", "name email rollNo")
        .populate("item", "itemId name category foundLocation dateFound")
        .limit(10000)
        .lean(),
      User.find({}).limit(5000).lean(),
      Report.find({}).populate("user", "name email rollNo").limit(10000).lean(),
    ]);

    const [items, claims, users, reports] = await Promise.race([
      dataPromise,
      csvTimeout,
    ]);

    // Set response headers for CSV download
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="lost_found_data_${timestamp}.csv"`,
    );

    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Start with items data
    res.write("==== ITEMS ====\n");
    res.write(
      "Item ID,Name,Category,Found Location,Date Found,Is Claimed,Owner Name,Owner Email,Owner Roll No,Created At\n",
    );

    items.forEach((item) => {
      const row = [
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
      ].join(",");
      res.write(row + "\n");
    });

    res.write("\n==== CLAIMS ====\n");
    res.write(
      "Claim ID,Item ID,Item Name,Item Category,Claimant Name,Claimant Email,Claimant Roll No,Status,Remarks,Created At,Updated At\n",
    );

    claims.forEach((claim) => {
      const row = [
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
      ].join(",");
      res.write(row + "\n");
    });

    res.write("\n==== USERS ====\n");
    res.write(
      "User ID,Name,Email,Roll No,Phone,Is Admin,Google ID,Created At\n",
    );

    users.forEach((user) => {
      const row = [
        escapeCSV(user._id),
        escapeCSV(user.name),
        escapeCSV(user.email),
        escapeCSV(user.rollNo),
        escapeCSV(user.phone || ""),
        escapeCSV(user.isAdmin),
        escapeCSV(user.googleId),
        escapeCSV(new Date(user.createdAt).toLocaleString()),
      ].join(",");
      res.write(row + "\n");
    });

    res.write("\n==== REPORTS ====\n");
    res.write(
      "Report ID,Reporter Name,Reporter Email,Reporter Roll No,Item Description,Category,Location,Date Lost,Additional Details,Status,Created At\n",
    );

    reports.forEach((report) => {
      const row = [
        escapeCSV(report._id),
        escapeCSV(report.user?.name || ""),
        escapeCSV(report.user?.email || ""),
        escapeCSV(report.user?.rollNo || ""),
        escapeCSV(report.itemDescription),
        escapeCSV(report.category),
        escapeCSV(report.location),
        escapeCSV(
          report.dateLost ? new Date(report.dateLost).toLocaleDateString() : "",
        ),
        escapeCSV(report.additionalDetails || ""),
        escapeCSV(report.status),
        escapeCSV(new Date(report.createdAt).toLocaleString()),
      ].join(",");
      res.write(row + "\n");
    });

    res.end();
  } catch (error) {
    console.error("CSV download error:", error.message);
    if (error.message === "CSV generation timeout") {
      return res
        .status(504)
        .json({ message: "CSV generation timeout. Please contact admin." });
    }
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate CSV download" });
    }
  }
};
