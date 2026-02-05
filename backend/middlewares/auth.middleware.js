import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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
