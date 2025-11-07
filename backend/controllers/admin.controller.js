import Item from "../models/item.model.js";

// List pending claims: items that have an owner (someone claimed) but not yet approved (isClaimed=false)
export const listPendingClaims = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { owner: { $exists: true, $ne: null }, isClaimed: false };

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
}; // Approve a claim: set isClaimed = true for the item
export const approveClaim = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (!item.owner)
      return res.status(400).json({ message: "No claim exists for this item" });
    item.isClaimed = true;
    await item.save();
    return res.status(200).json({ message: "Claim approved", item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reject a claim: remove the owner and keep isClaimed false
export const rejectClaim = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    item.owner = undefined;
    item.isClaimed = false;
    await item.save();
    return res.status(200).json({ message: "Claim rejected", item });
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
