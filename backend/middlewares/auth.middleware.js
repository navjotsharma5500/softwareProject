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
    req.user = decoded;
    next();
  } catch (error) {
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
