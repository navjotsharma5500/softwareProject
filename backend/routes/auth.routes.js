/**
 * @module routes/auth
 * @description Authentication routes mounted at `/api/auth`.
 *
 * | Method | Path                   | Auth  | Description                                      |
 * |--------|------------------------|-------|--------------------------------------------------|
 * | GET    | /google                | —     | Initiates Google OAuth; encodes `?redirect` in state |
 * | GET    | /google/callback       | —     | Google redirects here; sets session              |
 * | POST   | /logout                | —     | Clears the session                               |
 * | GET    | /profile               | ✔     | Returns the authenticated user's profile          |
 */
import express from "express";
import passport from "passport";
import {
  logout,
  getProfile,
  googleCallback,
} from "../controllers/auth.controllers.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/**
 * Initiates Google OAuth 2.0 flow.
 * Encodes an optional `?redirect` query param as base64 JSON state so the
 * callback can perform a deep-link redirect after login.
 *
 * @route GET /auth/google
 * @access Public
 */
router.get("/google", (req, res, next) => {
  // Store redirect parameter in session/state if provided
  const redirect = req.query.redirect;
  const state = redirect
    ? Buffer.from(JSON.stringify({ redirect })).toString("base64")
    : undefined;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=invalid_email`,
  }),
  googleCallback,
);

// Active routes
router.post("/logout", logout);
router.get("/profile", isAuthenticated, getProfile);

export default router;
