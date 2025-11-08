import Item from "../models/item.model.js";
import Claim from "../models/claim.model.js";

// Create a new item
export const createItem = async (req, res) => {
  const { itemId, name, category, foundLocation, dateFound } = req.body;

  if (!itemId || !name || !category || !foundLocation || !dateFound) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const existingItem = await Item.findOne({ itemId });
    if (existingItem) {
      return res.status(400).json({ message: "Item ID already exists" });
    }

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
export const listPendingClaims = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { status: "pending" };

    const [claims, total] = await Promise.all([
      Claim.find(query)
        .populate("claimant", "name email rollNo")
        .populate("item")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Claim.countDocuments(query),
    ]);

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

// List all items for admin oversight with pagination
export const listAllItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Item.find({})
        .populate("owner", "name email rollNo")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Item.countDocuments({}),
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
