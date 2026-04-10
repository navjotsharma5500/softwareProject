/**
 * @module controllers/item
 * @description Public read-only item controllers for the user-facing API.
 *
 * All responses are Redis-cached (5-minute TTL) keyed on the full filter
 * state to avoid redundant MongoDB queries under moderate traffic.
 */
import Item from "../models/item.model.js";
import { getCache, setCache } from "../utils/redisClient.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

/**
 * Returns a paginated, filterable list of found items.
 *
 * Supported query parameters:
 *  - `page` / `limit`    – pagination (limit capped at 100)
 *  - `category`          – slug filter (e.g. `phone`)
 *  - `location`          – exact `foundLocation` filter
 *  - `claimed`/`isClaimed` – boolean filter
 *  - `timePeriod`        – one of `yesterday | day_before_yesterday |
 *                          last_week | last_month | last_3_months`
 *  - `search`            – full-text search on `name` and `itemId`
 *
 * @async
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @route GET /user/items
 * @access Public
 */
export const listItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

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

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = {};

    if (req.query.category) {
      const escapedCategory = req.query.category.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      query.category = { $regex: escapedCategory, $options: "i" };
    }

    if (req.query.location) {
      const escapedLocation = req.query.location.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      query.foundLocation = { $regex: escapedLocation, $options: "i" };
    }

    if (req.query.claimed !== undefined) {
      query.isClaimed = req.query.claimed === "true";
    } else if (req.query.isClaimed !== undefined) {
      query.isClaimed =
        req.query.isClaimed === "true" || req.query.isClaimed === true;
    }

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

    if (req.query.search) {
      const searchValue = req.query.search.trim();
      query.$or = [
        { name: { $regex: searchValue, $options: "i" } },
        { itemId: { $regex: searchValue, $options: "i" } },
      ];
    }

    const [items, total] = await withQueryTimeout(
      Promise.all([
        Item.find(query)
          .select(
            "itemId name category foundLocation dateFound isClaimed owner",
          )
          .populate("owner", "name rollNo")
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        Item.countDocuments(query),
      ]),
    );

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

    setCache(cacheKey, responseData, 300).catch((err) => {
      console.error("[Cache set error]", err.message);
    });

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get a single found item by its MongoDB ID.
 * PUBLIC — no authentication required. Returns minimal fields only.
 * Cached for 5 minutes; cache is busted when a claim is made or approved.
 *
 * @route GET /user/items/:id
 */
export const getItemById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `item:${id}`;

  try {
    const cachedItem = await getCache(cacheKey);
    if (cachedItem) {
      return res.status(200).json(cachedItem);
    }

    const item = await withQueryTimeout(
      Item.findById(id)
        .select("itemId name category foundLocation dateFound isClaimed owner")
        .populate("owner", "name rollNo")
        .lean(),
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const responseData = { item };

    setCache(cacheKey, responseData, 300).catch((err) => {
      console.error("[Cache set error]", err.message);
    });

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
