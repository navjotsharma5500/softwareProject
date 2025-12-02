import { getCache, setCache } from "../utils/redisClient.js";

/**
 * Idempotency middleware to prevent duplicate requests
 * Clients should send an `Idempotency-Key` header with a unique UUID
 * If the same key is used within the TTL window, returns the cached response
 */
export const idempotencyMiddleware = (ttlSeconds = 86400) => {
  return async (req, res, next) => {
    // Only apply to POST, PUT, PATCH requests
    if (!["POST", "PUT", "PATCH"].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers["idempotency-key"];

    // If no idempotency key provided, continue without caching
    if (!idempotencyKey) {
      return next();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;

    try {
      // Check if this request was already processed
      const cachedResponse = await getCache(cacheKey);

      if (cachedResponse) {
        // Return cached response
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
