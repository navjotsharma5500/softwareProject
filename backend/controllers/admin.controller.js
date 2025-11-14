import Item from "../models/item.model.js";
import Claim from "../models/claim.model.js";

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

// Helper to sanitize category input
const sanitizeCategory = (category) => {
  let sanitized = category;

  // Handle numeric indices
  if (typeof sanitized === "number" || /^\d+$/.test(String(sanitized))) {
    const idx = parseInt(String(sanitized), 10);
    if (!isNaN(idx) && VALID_CATEGORIES[idx]) {
      sanitized = VALID_CATEGORIES[idx];
    } else {
      return { valid: false, error: `Invalid category index: ${category}` };
    }
  }

  // Handle display names
  if (typeof sanitized === "string") {
    const foundKey = Object.keys(CATEGORY_DISPLAY_NAMES).find(
      (k) => CATEGORY_DISPLAY_NAMES[k].toLowerCase() === sanitized.toLowerCase()
    );
    if (foundKey) {
      sanitized = foundKey;
    }
  }

  // Final validation
  if (!VALID_CATEGORIES.includes(sanitized)) {
    return {
      valid: false,
      error: `Invalid category: "${category}". Must be one of: ${VALID_CATEGORIES.join(
        ", "
      )}`,
    };
  }

  return { valid: true, category: sanitized };
};

// Create a new item
export const createItem = async (req, res) => {
  let { name, category, foundLocation, dateFound } = req.body;

  if (!name || !category || !foundLocation || !dateFound) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Sanitize category
  const categoryResult = sanitizeCategory(category);
  if (!categoryResult.valid) {
    return res.status(400).json({ message: categoryResult.error });
  }
  category = categoryResult.category;

  try {
    // Auto-generate Item ID
    const itemCount = await Item.countDocuments();
    const itemId = `ITEM${String(itemCount + 1).padStart(6, "0")}`;

    const newItem = new Item({
      itemId,
      name,
      category,
      foundLocation,
      dateFound,
    });

    await newItem.save();
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

  try {
    const item = await Item.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
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
    const item = await Item.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    // Also delete all claims associated with this item
    await Claim.deleteMany({ item: id });
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
    const item = await Item.findById(id).populate("owner", "name email rollNo");
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
    const claims = await Claim.find({ item: id })
      .populate("claimant", "name email rollNo")
      .sort({ createdAt: -1 });
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
      const allClaims = await Claim.find(query)
        .populate("claimant", "name email rollNo")
        .populate("item")
        .sort({ createdAt: -1 });

      const searchLower = req.query.search.toLowerCase();
      const filteredClaims = allClaims.filter(
        (claim) =>
          claim.claimant?.name?.toLowerCase().includes(searchLower) ||
          claim.claimant?.email?.toLowerCase().includes(searchLower) ||
          claim.item?.name?.toLowerCase().includes(searchLower) ||
          claim.item?.itemId?.toLowerCase().includes(searchLower)
      );

      total = filteredClaims.length;
      claims = filteredClaims.slice(skip, skip + limit);
    } else {
      [claims, total] = await Promise.all([
        Claim.find(query)
          .populate("claimant", "name email rollNo")
          .populate("item")
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Claim.countDocuments(query),
      ]);
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
  const { id } = req.params; // claim ID
  const { remarks } = req.body;

  try {
    const claim = await Claim.findById(id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = "approved";
    if (remarks) claim.remarks = remarks;
    await claim.save();

    // Update the item to set isClaimed = true and owner
    const item = await Item.findById(claim.item);
    if (item) {
      item.isClaimed = true;
      item.owner = claim.claimant;
      await item.save();
    }

    // Reject all other pending claims for this item
    await Claim.updateMany(
      { item: claim.item, _id: { $ne: id }, status: "pending" },
      { status: "rejected", remarks: "Another claim was approved" }
    );

    return res.status(200).json({ message: "Claim approved", claim });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reject a claim
export const rejectClaim = async (req, res) => {
  const { id } = req.params; // claim ID
  const { remarks } = req.body;

  try {
    const claim = await Claim.findById(id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = "rejected";
    if (remarks) claim.remarks = remarks;
    await claim.save();

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
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

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

    const [items, total] = await Promise.all([
      Item.find(query)
        .populate("owner", "name email rollNo")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Item.countDocuments(query),
    ]);

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
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
