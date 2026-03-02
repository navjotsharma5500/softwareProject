import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

let redis = null;
let redisAvailable = true;
let consecutiveFailures = 0;
const MAX_FAILURES = 5;

function isRedisReady() {
  return (
    redis &&
    redis.status === "ready" &&
    redisAvailable &&
    consecutiveFailures < MAX_FAILURES
  );
}

const PREFIX = `myapp:${process.env.NODE_ENV}:`;
let hits = 0;
let misses = 0;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    connectTimeout: 5000, // 5 s to establish connection (was 10 s)
    commandTimeout: 1000, // 1 s max per command — fail fast, don't block requests
    keepAlive: 30000,

    retryStrategy(times) {
      if (times > 5) {
        console.error("❌ Redis retry limit reached");
        return null;
      }
      const delay = Math.min(times * 300, 2000); // faster reconnect (was 500ms/3000ms)
      console.log(
        `🔄 Retrying Redis connection in ${delay}ms (attempt ${times}/5)`,
      );
      return delay;
    },

    tls: {
      rejectUnauthorized: false,
    },

    family: 4,
    enableOfflineQueue: false, // reject queued commands immediately when offline
  });

  redis.on("connect", () => {
    console.log("✅ Redis connected");
    redisAvailable = true;
    consecutiveFailures = 0;
  });

  redis.on("ready", () => {
    console.log("✅ Redis ready");
    redisAvailable = true;
    consecutiveFailures = 0;
  });

  redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
    redisAvailable = false;
  });

  redis.on("close", () => {
    console.log("⚠️  Redis closed");
    redisAvailable = false;
  });

  redis.on("reconnecting", () => {
    console.log("🔄 Redis reconnecting...");
    redisAvailable = false;
  });
} else {
  console.log("⚠️  Redis not configured");
}

export const cacheStats = () => ({
  hits,
  misses,
  consecutiveFailures,
  isReady: isRedisReady(),
  status: redis ? redis.status : "not_initialized",
});

export const clearCachePattern = async (pattern) => {
  if (!isRedisReady()) return;

  try {
    let cursor = "0";
    const pipeline = redis.pipeline();

    // Add PREFIX to pattern so it matches the namespaced keys
    const namespacedPattern = PREFIX + pattern;

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        namespacedPattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      if (keys.length) {
        keys.forEach((key) => pipeline.unlink(key));
      }
    } while (cursor !== "0");

    await pipeline.exec();
    consecutiveFailures = 0;
  } catch (err) {
    consecutiveFailures++;
    console.error(
      `Cache clear error (${consecutiveFailures}/${MAX_FAILURES}):`,
      err.message,
    );

    if (consecutiveFailures >= MAX_FAILURES) {
      setTimeout(() => {
        consecutiveFailures = 0;
      }, 60000);
    }
  }
};

export const getCache = async (key) => {
  if (!isRedisReady()) return null;

  const namespacedKey = PREFIX + key;
  try {
    const data = await redis.get(namespacedKey);
    consecutiveFailures = 0;

    if (!data) {
      misses++;
      return null;
    }

    try {
      hits++;
      return JSON.parse(data);
    } catch (parseErr) {
      await redis.del(namespacedKey);
      return null;
    }
  } catch (err) {
    consecutiveFailures++;
    console.error(
      `Cache get error (${consecutiveFailures}/${MAX_FAILURES}):`,
      err.message,
    );

    if (consecutiveFailures >= MAX_FAILURES) {
      setTimeout(() => {
        consecutiveFailures = 0;
      }, 60000);
    }
    return null;
  }
};

export const setCache = async (key, data, expirationInSeconds = 600) => {
  if (!isRedisReady()) return;

  const namespacedKey = PREFIX + key;
  try {
    await redis.set(
      namespacedKey,
      JSON.stringify(data),
      "EX",
      expirationInSeconds,
    );
    consecutiveFailures = 0;
  } catch (err) {
    consecutiveFailures++;
    console.error(
      `Cache set error (${consecutiveFailures}/${MAX_FAILURES}):`,
      err.message,
    );

    if (consecutiveFailures >= MAX_FAILURES) {
      setTimeout(() => {
        consecutiveFailures = 0;
      }, 60000);
    }
  }
};

export const closeRedis = async () => {
  if (redis) {
    try {
      await redis.quit();
      console.log("👋 Redis closed");
    } catch (err) {
      redis.disconnect();
    }
  }
};

export default redis;
