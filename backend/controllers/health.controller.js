import mongoose from "mongoose";
import redis from "../utils/redisClient.js";
import Item from "../models/item.model.js";

/**
 * Basic health check endpoint
 * Returns simple OK status for load balancers
 */
export const healthCheck = (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
};

/**
 * Detailed health monitoring endpoint
 * Checks all critical services and provides comprehensive status
 */
export const detailedHealth = async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
    performance: {},
    system: {},
  };

  // Check MongoDB connection
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus =
      dbState === 1
        ? "connected"
        : dbState === 2
        ? "connecting"
        : "disconnected";

    // Test query performance
    const queryStart = Date.now();
    await Item.countDocuments().limit(1);
    const queryTime = Date.now() - queryStart;

    health.services.database = {
      status: dbStatus,
      healthy: dbState === 1,
      responseTime: `${queryTime}ms`,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };

    if (dbState !== 1) {
      health.status = "degraded";
    }
  } catch (error) {
    health.services.database = {
      status: "error",
      healthy: false,
      error: error.message,
    };
    health.status = "unhealthy";
  }

  // Check Redis connection
  try {
    if (redis) {
      const pingStart = Date.now();
      const redisPing = await redis.ping();
      const pingTime = Date.now() - pingStart;

      // Get Redis info
      const redisInfo = await redis.info("memory");
      const usedMemory = redisInfo.match(/used_memory_human:(.+)/)?.[1]?.trim();

      health.services.redis = {
        status: redisPing === "PONG" ? "connected" : "error",
        healthy: redisPing === "PONG",
        responseTime: `${pingTime}ms`,
        memoryUsed: usedMemory || "unknown",
      };
    } else {
      health.services.redis = {
        status: "disabled",
        healthy: true,
        note: "Redis not configured (caching disabled)",
      };
    }
  } catch (error) {
    health.services.redis = {
      status: "error",
      healthy: false,
      error: error.message,
    };
    health.status = "degraded";
  }

  // Performance metrics
  health.performance = {
    responseTime: `${Date.now() - startTime}ms`,
    targetResponseTime: "<100ms",
    healthy: Date.now() - startTime < 100,
  };

  // System metrics
  const memUsage = process.memoryUsage();
  health.system = {
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    uptime: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
    environment: process.env.NODE_ENV || "development",
  };

  // Set HTTP status code based on overall health
  const statusCode =
    health.status === "ok" ? 200 : health.status === "degraded" ? 503 : 500;

  res.status(statusCode).json(health);
};

/**
 * Database connection test endpoint
 * Tests database query performance with actual query
 */
export const databaseHealth = async (req, res) => {
  try {
    const startTime = Date.now();

    // Test query with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timeout")), 5000)
    );

    const queryPromise = Item.countDocuments().limit(1);

    await Promise.race([queryPromise, timeoutPromise]);

    const queryTime = Date.now() - startTime;

    res.status(200).json({
      status: "ok",
      database: {
        connected: true,
        readyState: mongoose.connection.readyState,
        responseTime: `${queryTime}ms`,
        healthy: queryTime < 1000,
        warning: queryTime > 500 ? "Slow database response" : null,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: {
        connected: false,
        error: error.message,
      },
    });
  }
};

/**
 * Redis connection test endpoint
 */
export const redisHealth = async (req, res) => {
  if (!redis) {
    return res.status(200).json({
      status: "disabled",
      redis: {
        configured: false,
        message: "Redis caching is disabled",
      },
    });
  }

  try {
    const startTime = Date.now();
    const ping = await redis.ping();
    const pingTime = Date.now() - startTime;

    // Test set/get operation
    const testKey = `health:test:${Date.now()}`;
    await redis.setex(testKey, 10, "test");
    const testValue = await redis.get(testKey);
    await redis.del(testKey);

    res.status(200).json({
      status: "ok",
      redis: {
        connected: ping === "PONG",
        responseTime: `${pingTime}ms`,
        readWrite: testValue === "test",
        healthy: pingTime < 100,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      redis: {
        connected: false,
        error: error.message,
      },
    });
  }
};
