import Redis from "ioredis";

let redis = null;

// Only initialize Redis if REDIS_URL is provided
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 5000, // 5s connection timeout
    commandTimeout: 3000, // 3s command timeout - prevents hanging
    retryStrategy(times) {
      if (times > 3) {
        console.error('Redis: Max retries reached, falling back to DB');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on("connect", () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Redis connected successfully");
    }
  });

  redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  redis.on("close", () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("⚠️  Redis connection closed");
    }
  });
} else {
  if (process.env.NODE_ENV !== "production") {
    console.log("⚠️  Redis not configured - caching disabled");
  }
}

// Helper function to safely clear cache patterns
export const clearCachePattern = async (pattern) => {
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      // Use UNLINK instead of DEL - non-blocking, faster for large deletes
      await redis.unlink(...keys);
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `🗑️  Cleared ${keys.length} cache keys matching: ${pattern}`
        );
      }
    }
  } catch (err) {
    console.error("Error clearing cache:", err.message);
  }
};

// Helper function to get cached data
export const getCache = async (key) => {
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    if (data) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`🎯 Cache HIT: ${key}`);
      }
      return JSON.parse(data);
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.log(`❌ Cache MISS: ${key}`);
      }
      return null;
    }
  } catch (err) {
    console.error("Error getting cache:", err.message);
    return null;
  }
};

// Helper function to set cached data
export const setCache = async (key, data, expirationInSeconds = 3600) => {
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(data), "EX", expirationInSeconds);
    if (process.env.NODE_ENV !== "production") {
      console.log(`💾 Cache SET: ${key} (expires in ${expirationInSeconds}s)`);
    }
  } catch (err) {
    console.error("Error setting cache:", err.message);
  }
};

export default redis;
