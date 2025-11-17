import Item from "../models/item.model.js";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Report from "../models/report.model.js";

// User claims an item: creates a new claim record
export const claimItem = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params; // item id
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.isClaimed) {
      return res
        .status(400)
        .json({ message: "Item already claimed and approved" });
    }

    // Check if user already has a pending claim for this item
    const existingClaim = await Claim.findOne({
      item: id,
      claimant: userId,
      status: "pending",
    });

    if (existingClaim) {
      return res
        .status(400)
        .json({ message: "You already have a pending claim for this item" });
    }

    // Create new claim
    const newClaim = new Claim({
      item: id,
      claimant: userId,
      status: "pending",
    });

    await newClaim.save();

    const populatedClaim = await Claim.findById(newClaim._id)
      .populate("claimant", "name email rollNo")
      .populate("item");

    return res
      .status(200)
      .json({ message: "Claim requested successfully", claim: populatedClaim });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's claims
export const myClaims = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { claimant: userId };

    const [claims, total] = await Promise.all([
      Claim.find(query)
        .populate(
          "item",
          "itemId name category foundLocation dateFound isClaimed"
        )
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

// List all items with filters (PUBLIC - no auth required)
export const listItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const query = {};

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by location
    if (req.query.location) {
      query.foundLocation = req.query.location;
    }

    // Filter by claimed status (support both 'claimed' and 'isClaimed' params)
    if (req.query.claimed !== undefined) {
      query.isClaimed = req.query.claimed === "true";
    } else if (req.query.isClaimed !== undefined) {
      query.isClaimed =
        req.query.isClaimed === "true" || req.query.isClaimed === true;
    }

    // Filter by time period
    if (req.query.timePeriod) {
      const now = new Date();
      let startDate;

      switch (req.query.timePeriod) {
        case "yesterday":
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          break;
        case "day_before_yesterday":
          startDate = new Date(now.setDate(now.getDate() - 2));
          startDate.setHours(0, 0, 0, 0);
          break;
        case "last_week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "last_month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "last_3_months":
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
      }

      if (startDate) {
        query.dateFound = { $gte: startDate };
      }
    }

    // Search by name only (minimal info)
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    const items = await Item.find(query)
      .populate("owner", "name rollNo") // Don't show email to public
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Item.countDocuments(query);
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

// Get item by ID (PUBLIC - no auth required)
// Shows minimal info only
export const getItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Item.findById(id).populate("owner", "name rollNo"); // Don't show email to public

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    return res.status(200).json({ item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's history (claims and reports) - Admin only
export const getUserHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const [user, claims, reports] = await Promise.all([
      User.findById(userId).select("name email rollNo createdAt"),
      Claim.find({ claimant: userId })
        .populate("item", "itemId name category foundLocation dateFound")
        .sort({ createdAt: -1 })
        .limit(20),
      Report.find({ user: userId }).sort({ createdAt: -1 }).limit(20),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user,
      claims,
      reports,
      totalClaims: claims.length,
      totalReports: reports.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get and update user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, rollNo, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (rollNo) user.rollNo = rollNo;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const updatedUser = await User.findById(req.user.id);

    return res.status(200).json({
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
