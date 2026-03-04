import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

// Verify user is authenticated
export const isAuthenticated = (req, res, next) => {
  const token =
    req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalize user object: support both 'id' and '_id' for backward compatibility
    req.user = {
      ...decoded,
      _id: decoded._id || decoded.id, // Ensure _id exists
      id: decoded.id || decoded._id, // Ensure id exists for compatibility
    };
    next();
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    return res.status(400).json({ message: "Invalid token." });
  }
};

// Verify user is admin
export const adminOnly = (req, res, next) => {
  if (req.user?.isAdmin !== true) {
    return res.status(403).json({ message: "Access Denied. Admins only." });
  }
  next();
};

// Block blacklisted users from performing actions
// Must run AFTER isAuthenticated (needs req.user._id)
export const notBlacklisted = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("isBlacklisted")
      .lean();
    if (user?.isBlacklisted) {
      return res.status(403).json({
        message:
          "Your account has been restricted. Please contact the admin to regain access.",
      });
    }
    next();
  } catch (error) {
    console.error("notBlacklisted middleware error:", error);
    next(); // Fail open — don't block on DB error
  }
};
