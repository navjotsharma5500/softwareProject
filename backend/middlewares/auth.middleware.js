/**
 * @module middlewares/auth
 * @description Authentication and authorisation middleware chain.
 *
 * Typical usage order on protected routes:
 * ```
 * router.use(isAuthenticated, notBlacklisted)
 * router.use(isAuthenticated, adminOnly)
 * ```
 */
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

/**
 * Verifies the JWT present in the request and attaches the decoded payload
 * to `req.user`.
 *
 * Token is read from (in priority order):
 *  1. `req.cookies.token` (httpOnly cookie set after OAuth)
 *  2. `Authorization: Bearer <token>` header
 *
 * Normalises the decoded payload so that both `req.user.id` and
 * `req.user._id` are always available regardless of how the JWT was signed.
 *
 * @param {import('express').Request}  req  - Express request.
 * @param {import('express').Response} res  - Express response.
 * @param {import('express').NextFunction} next - Next middleware.
 * @returns {void}
 */
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

/**
 * Allows the request through only when `req.user.isAdmin === true`.
 * Must be used **after** {@link isAuthenticated} in the middleware chain.
 *
 * @param {import('express').Request}  req  - Express request (must have `req.user` populated).
 * @param {import('express').Response} res  - Express response.
 * @param {import('express').NextFunction} next - Next middleware.
 * @returns {void}
 */
export const adminOnly = (req, res, next) => {
  if (req.user?.isAdmin !== true) {
    return res.status(403).json({ message: "Access Denied. Admins only." });
  }
  next();
};

/**
 * Rejects requests from blacklisted users by performing a live DB lookup.
 * Must run **after** {@link isAuthenticated} (relies on `req.user._id`).
 *
 * Fails **open**: if the DB query itself throws, the request is allowed
 * through to avoid hard-blocking users during transient DB outages.
 *
 * @async
 * @param {import('express').Request}  req  - Express request.
 * @param {import('express').Response} res  - Express response.
 * @param {import('express').NextFunction} next - Next middleware.
 * @returns {Promise<void>}
 */
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
