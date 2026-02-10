import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
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
    console.log(error);
    // Removed Jest-specific error handling for production

    process.exit(1);
  }
};

export default connectDB;
