import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

dotenv.config();

// Shared cookie config — single source of truth for both set and clear
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  domain: process.env.NODE_ENV === "production" ? ".guestapp.in" : undefined,
};

/**
 * Handle Google OAuth callback.
 * Signs a 7-day JWT, sets it as an httpOnly cookie, and redirects to frontend.
 * Supports optional base64-encoded state.redirect for deep-link redirects.
 *
 * @route GET /auth/google/callback
 */
export const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=authentication_failed`,
      );
    }

    const isAdmin = req.user.isAdmin;
    const token = jwt.sign(
      { _id: req.user._id, isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }, // 7 days for OAuth
    );

    // Set token as cookie
    res.cookie("token", token, { ...cookieOptions, maxAge: 7 * 24 * 3600000 });

    // Extract redirect from state parameter if present
    let redirectUrl = `${process.env.FRONTEND_URL}/login?token=${token}`;
    try {
      if (req.query.state) {
        const state = JSON.parse(
          Buffer.from(req.query.state, "base64").toString(),
        );
        if (state.redirect) {
          redirectUrl = `${
            process.env.FRONTEND_URL
          }/login?token=${token}&redirect=${encodeURIComponent(
            state.redirect,
          )}`;
        }
      }
    } catch (err) {
      // If state parsing fails, just use default redirect
      console.error("Failed to parse state:", err);
    }

    // Redirect to frontend login page with token and optional redirect
    res.redirect(redirectUrl);
  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

/**
 * Clear the auth cookie and end the session.
 *
 * @route POST /auth/logout
 * @access Protected — authenticated users only
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", cookieOptions);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Return the full user document for the currently authenticated user.
 * Used by the frontend to hydrate auth context on refresh.
 *
 * @route GET /auth/profile
 * @access Protected — authenticated users only
 */
export const getProfile = async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = await withQueryTimeout(
      User.findById(userId)
        .select(
          "name email rollNo phone profilePicture isAdmin isBlacklisted createdAt",
        )
        .lean(),
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
