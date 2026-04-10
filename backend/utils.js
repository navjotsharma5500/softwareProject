/**
 * @module utils
 * @description MongoDB connection helper for the Lost & Found Portal backend.
 *
 * Exposes {@link connectDB} which establishes a pooled Mongoose connection
 * using configuration from the `MONGODB_URI` environment variable.
 * Connection-level events (disconnected, reconnected, error) are logged to
 * stdout/stderr so the process monitor (PM2) can react accordingly.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

/**
 * Establishes a Mongoose connection to MongoDB using `MONGODB_URI`.
 *
 * Connection pool is configured for production workloads:
 * - `maxPoolSize`: 10 connections
 * - `minPoolSize`: 2 connections always kept warm
 * - Heartbeat every 10 s to prevent premature socket closure behind ALB/Nginx
 * - `retryWrites`/`retryReads` enabled for transient network errors
 *
 * Registers permanent event listeners for `disconnected`, `reconnected`,
 * and `error` events on the default Mongoose connection.
 *
 * @async
 * @returns {Promise<void>} Resolves once the connection is established.
 * @throws Calls `process.exit(1)` on connection failure so PM2 can restart the process.
 */
const connectDB = async () => {
  try {
    const res = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maximum connections in pool
      minPoolSize: 2, // Minimum connections to maintain
      socketTimeoutMS: 300000, // 5 minutes - prevents premature closure
      serverSelectionTimeoutMS: 10000, // 10s to find server after idle
      connectTimeoutMS: 10000, // 10s for initial connection
      heartbeatFrequencyMS: 10000, // Ping every 10s to keep connections alive
      retryWrites: true,
      retryReads: true,
    });

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });

    // console.log("mongoDB connected successfully", res.connection.host);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
