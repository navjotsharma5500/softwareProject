import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectDB = async () => {
  try {
    const res = await mongoose.connect(process.env.MONGO_URI);
    console.log("mongoDB connected successfully", res.connection.host);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
export default connectDB;