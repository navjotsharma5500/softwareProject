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
  },
  { timestamps: true }
);

// Indexes for performance optimization
// Note: email and googleId already indexed via unique: true

const User = mongoose.model("User", userSchema);
export default User;
