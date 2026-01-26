import Item from "../models/item.model.js";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Report from "../models/report.model.js";
import { getCache, setCache, clearCachePattern } from "../utils/redisClient.js";

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

    // Clear user's claims cache
    await clearCachePattern(`user:${userId}:claims:*`);
    // Clear item cache since claim count changed
    await clearCachePattern(`item:${id}`);
    // Clear items list cache
    await clearCachePattern("items:list:*");

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

// Delete a user's own claim (only if pending)
export const deleteClaim = async (req, res) => {
  const userId = req.user?.id;
  const { claimId } = req.params;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const claim = await Claim.findById(claimId);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Check if the claim belongs to the user
    if (claim.claimant.toString() !== userId) {
      return res.status(403).json({
        message: "Access denied. You can only delete your own claims.",
      });
    }

    // Only allow deletion of pending claims
    if (claim.status !== "pending") {
      return res
        .status(400)
        .json({ message: "You can only delete pending claims" });
    }

    await Claim.findByIdAndDelete(claimId);

    // Clear relevant caches
    await clearCachePattern(`user:${userId}:claims:*`);
    await clearCachePattern(`item:${claim.item}`);
    await clearCachePattern("items:list:*");

    res.status(200).json({ message: "Claim deleted successfully" });
  } catch (error) {
    console.error("Delete claim error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a user's own report
export const deleteReport = async (req, res) => {
  const userId = req.user?.id;
  const { reportId } = req.params;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if the report belongs to the user
    if (report.reporter.toString() !== userId) {
      return res.status(403).json({
        message: "Access denied. You can only delete your own reports.",
      });
    }

    await Report.findByIdAndDelete(reportId);

    // Clear relevant caches
    await clearCachePattern(`user:${userId}:reports:*`);

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete report error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's claims
export const myClaims = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100
    const skip = (page - 1) * limit;

    const cacheKey = `user:${userId}:claims:page=${page}:limit=${limit}`;

    // Try cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = { claimant: userId };

    const [claims, total] = await Promise.all([
      Claim.find(query)
        .select("item claimant status remarks createdAt")
        .populate(
          "item",
          "itemId name category foundLocation dateFound isClaimed",
        )
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(), // Faster read-only queries
      Claim.countDocuments(query),
    ]);

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

    // Cache for 10 minutes (600 seconds) - claims change less frequently
    await setCache(cacheKey, responseData, 600);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// List all items with filters (PUBLIC - no auth required)
export const listItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100
    const skip = (page - 1) * limit;

    // Build cache key based on all query parameters
    const cacheKey = `items:list:${JSON.stringify({
      page,
      limit,
      category: req.query.category,
      location: req.query.location,
      claimed: req.query.claimed,
      isClaimed: req.query.isClaimed,
      timePeriod: req.query.timePeriod,
      search: req.query.search,
    })}`;

    // Try to get from cache (1 hour = 3600 seconds)
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

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
      .select("itemId name category foundLocation dateFound isClaimed owner")
      .populate("owner", "name rollNo") // Don't show email to public
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(); // Faster read-only queries

    const total = await Item.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const responseData = {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    // Cache for 1 hour (3600 seconds)
    await setCache(cacheKey, responseData, 3600);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get item by ID (PUBLIC - no auth required)
// Shows minimal info only
export const getItemById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `item:${id}`;

  try {
    // Try cache first
    const cachedItem = await getCache(cacheKey);
    if (cachedItem) {
      return res.status(200).json(cachedItem);
    }

    const item = await Item.findById(id)
      .select("itemId name category foundLocation dateFound isClaimed owner")
      .populate("owner", "name rollNo") // Don't show email to public
      .lean(); // Faster read-only queries

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const responseData = { item };

    // Cache for 1 hour
    await setCache(cacheKey, responseData, 3600);

    return res.status(200).json(responseData);
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
  const userId = req.user.id;
  const cacheKey = `user:profile:${userId}`;

  try {
    // Try cache first
    const cachedProfile = await getCache(cacheKey);
    if (cachedProfile) {
      return res.status(200).json(cachedProfile);
    }

    const user = await User.findById(userId)
      .select("name email rollNo phone profilePicture isAdmin createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const responseData = { user };

    // Cache for 15 minutes
    await setCache(cacheKey, responseData, 900);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  // Joi validation
  const Joi = (await import("joi")).default;
  const schema = Joi.object({
    // Limit name length to reasonable size
    name: Joi.string().min(2).max(100),
    // Require numeric roll numbers (accept number or numeric string)
    rollNo: Joi.alternatives().try(
      Joi.number().integer().min(1),
      Joi.string().pattern(/^\d+$/),
    ),
    phone: Joi.string()
      .pattern(/^\d{10,15}$/)
      .allow(null, ""),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  try {
    const { name, rollNo, phone } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.name = name;
    if (rollNo !== undefined && rollNo !== null) user.rollNo = String(rollNo);
    if (phone !== undefined) user.phone = phone;
    await user.save();

    // Clear user profile cache after update
    await clearCachePattern(`user:profile:${req.user.id}`);

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
