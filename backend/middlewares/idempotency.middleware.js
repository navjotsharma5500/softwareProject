import { getCache, setCache } from "../utils/redisClient.js";

/**
 * Idempotency middleware to prevent duplicate requests
 * Clients should send an `Idempotency-Key` header with a unique UUID
 * If the same key is used within the TTL window, returns the cached response
 * 
 * @param {number} ttlSeconds - Time to live for the cached response (default: 86400 = 24 hours)
 * @param {boolean} strict - If true, requires Idempotency-Key header (default: false)
 */
export const idempotencyMiddleware = (ttlSeconds = 86400, strict = false) => {
  return async (req, res, next) => {
    // Only apply to POST, PUT, PATCH, DELETE requests
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers["idempotency-key"];

    // If strict mode is enabled and no idempotency key is provided, reject the request
    if (strict && !idempotencyKey) {
      return res.status(400).json({ 
        message: "Idempotency-Key header is required for this operation",
        hint: "Include a unique UUID in the 'Idempotency-Key' header to prevent duplicate requests"
      });
    }

    // If no idempotency key provided (and not strict), continue without caching
    if (!idempotencyKey) {
      return next();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;

    try {
      // Check if this request was already processed
      const cachedResponse = await getCache(cacheKey);

      if (cachedResponse) {
        // Return cached response with a header indicating it was from cache
        res.setHeader("X-Idempotency-Replay", "true");
        return res.status(cachedResponse.status).json(cachedResponse.data);
      }

      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);

      res.json = function (data) {
        // Cache the response with the idempotency key
        const responseData = {
          status: res.statusCode,
          data: data,
        };

        setCache(cacheKey, responseData, ttlSeconds).catch((err) => {
          console.error("Failed to cache idempotent response:", err);
        });

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Idempotency middleware error:", error);
      // Don't block the request if there's an error
      next();
    }
  };
};
