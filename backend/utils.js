import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectDB = async () => {
  try {
    const res = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maximum connections in pool (good for Render)
      minPoolSize: 2, // Minimum connections to maintain
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if can't connect
    });
    // console.log("mongoDB connected successfully", res.connection.host);
  } catch (error) {
    console.log(error);
    if (process.env.JEST_WORKER_ID !== undefined) {
      throw error; // Let Jest handle DB errors in tests
    } else {
      process.exit(1);
    }
  }
};
export default connectDB;
