/**
 * @module models/user
 * @description Mongoose model representing a registered portal user.
 *
 * Users authenticate exclusively via Google OAuth; there is no local
 * password field. `rollNo` is derived from the Gmail local-part on first
 * login and can be updated via the profile endpoint.
 */
import mongoose from "mongoose";

/**
 * @typedef {object} UserDocument
 * @property {string}  name            - Display name from Google profile.
 * @property {string}  email           - Unique institutional email (`@thapar.edu`).
 * @property {string}  googleId        - Unique Google profile ID.
 * @property {boolean} isAdmin         - Grants access to admin routes when `true`.
 * @property {string}  rollNo          - University roll number (e.g. `102117001`).
 * @property {string}  [phone]         - Optional contact phone number.
 * @property {string}  [profilePicture]- Google profile picture URL.
 * @property {boolean} isBlacklisted   - Prevents claiming items when `true`.
 * @property {Date}    createdAt       - Auto-managed by `timestamps`.
 * @property {Date}    updatedAt       - Auto-managed by `timestamps`.
 */
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
