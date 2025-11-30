import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectDB = async () => {
  try {
    const res = await mongoose.connect(process.env.MONGODB_URI);
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
