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
      unique: true, // Creates index automatically
    },
    googleId: {
      type: String,
      required: true,
      unique: true, // Creates index automatically
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
    isBlacklisted: {
      type: Boolean,
      default: false, // Safe for existing docs — Mongoose returns false if field missing
    },
  },
  { timestamps: true },
);

// Indexes for performance optimization
// Note: email and googleId already indexed via unique: true

const User = mongoose.model("User", userSchema);
export default User;
