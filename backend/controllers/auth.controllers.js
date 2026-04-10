/**
 * @module controllers/auth
 * @description Authentication controllers for the Google OAuth 2.0 flow.
 *
 * Exposes three endpoints consumed by {@link module:routes/auth}:
 *  - `googleCallback` – finalises OAuth, creates session, redirects to frontend
 *  - `logout`         – clears the session
 *  - `getProfile`     – returns the authenticated user's document
 */
import User from "../models/user.model.js";
import dotenv from "dotenv";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

dotenv.config();

/**
 * Finalises the Google OAuth 2.0 callback.
 * Establishes session and redirects to frontend.
 *
 * @route GET /auth/google/callback
 * @access Public
 */
export const googleCallback = async (req, res) => {
  try {
    console.log("googleCallback invoked. req.user:", req.user ? req.user.email : "null");

    if (!req.user) {
      console.error("googleCallback: req.user is null after passport.authenticate");
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=authentication_failed`,
      );
    }

    // Explicitly establish session after successful authentication
    // passport.authenticate() has already verified the user
    // Now we need to call req.login() to persist session
    req.login(req.user, (err) => {
      if (err) {
        console.error("Login error in googleCallback:", err);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=login_failed`,
        );
      }

      console.log("User session established for:", req.user.email);

      // Determine redirect destination from state parameter
      let redirectUrl = "/lostnfound"; // default to home

      try {
        if (req.query.state) {
          const state = JSON.parse(
            Buffer.from(req.query.state, "base64").toString(),
          );

          if (state.redirect) {
            redirectUrl = state.redirect;
          }
        }
      } catch (err) {
        console.error("Failed to parse state:", err);
      }

      // Build full redirect URL
      // For local dev: http://localhost:5173/lostnfound/...
      // For production: https://campusconnect.thapar.edu/lostnfound/...
      let fullRedirectUrl;
      if (redirectUrl.startsWith("http")) {
        fullRedirectUrl = redirectUrl;
      } else if (redirectUrl.startsWith("/lostnfound")) {
        // Already has /lostnfound prefix
        fullRedirectUrl = `${process.env.FRONTEND_URL}${redirectUrl}`;
      } else {
        // Add /lostnfound prefix if not present
        fullRedirectUrl = `${process.env.FRONTEND_URL}/lostnfound${redirectUrl}`;
      }

      console.log("Redirecting to:", fullRedirectUrl);
      return res.redirect(fullRedirectUrl);
    });
  } catch (error) {
    console.error("Unexpected error in googleCallback:", error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=server_error`,
    );
  }
};

/**
 * Logout user by destroying session.
 * MUST:
 * - Call req.logout() to invalidate Passport session
 * - Call req.session.destroy() to destroy session in session store
 * - Clear connect.sid cookie
 *
 * @route POST /auth/logout
 * @access Public
 */
export const logout = async (req, res) => {
  try {
    req.logout((logoutErr) => {
      if (logoutErr) {
        console.error("Logout error:", logoutErr);
        return res.status(500).json({ message: "Logout failed" });
      }

      // Destroy session in session store
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
          return res.status(500).json({ message: "Session destroy failed" });
        }

        // Clear the session cookie
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        return res.status(200).json({ message: "Logout successful" });
      });
    });
  } catch (error) {
    console.error("Logout exception:", error);
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
  // Check if user is authenticated via session
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user._id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await withQueryTimeout(
      User.findById(userId)
        .select(
          "name email rollNo phone profilePicture isAdmin isBlacklisted createdAt"
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
