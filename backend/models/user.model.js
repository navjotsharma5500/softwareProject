import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    rollNo: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    profilePicture: {
      type: String, // Google profile picture URL
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
