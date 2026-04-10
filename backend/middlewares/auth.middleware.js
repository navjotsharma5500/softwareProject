/**
 * @module middlewares/auth
 * @description Authentication and authorisation middleware chain.
 *
 * Uses session-based authentication via Passport + express-session.
 * Checks req.user populated by passport.session() middleware.
 *
 * Typical usage order on protected routes:
 * ```
 * router.use(isAuthenticated, notBlacklisted)
 * router.use(isAuthenticated, adminOnly)
 * ```
 */
import User from "../models/user.model.js";

/**
 * Verifies user is authenticated via session (req.user populated by passport.session()).
 * Returns 401 if not authenticated.
 *
 * @param {import('express').Request}  req  - Express request.
 * @param {import('express').Response} res  - Express response.
 * @param {import('express').NextFunction} next - Next middleware.
 * @returns {void}
 */
export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Access Denied. Not authenticated." });
  }

  // Ensure _id is always available
  req.user._id = req.user._id || req.user.id;
  next();
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
