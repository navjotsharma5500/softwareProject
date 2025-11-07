import Item from "../models/item.model.js";
import User from "../models/user.model.js";

// User claims an item: set owner to requesting user's id. Admin will later set isClaimed=true to approve.
export const claimItem = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params; // item id
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.owner && item.isClaimed) {
      return res
        .status(400)
        .json({ message: "Item already claimed and approved" });
    }
    // Attach claimant as owner (request), admin reviews and approves by setting isClaimed=true
    item.owner = userId;
    await item.save();
    const populated = await Item.findById(id).populate(
      "owner",
      "name email rollNo"
    );
    return res
      .status(200)
      .json({ message: "Claim requested", item: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const myClaims = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { owner: userId };

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

// List all available items (unclaimed or pending claims) for users to browse
export const listItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Show items that are not yet fully claimed (isClaimed=false)
    const query = { isClaimed: false };

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
