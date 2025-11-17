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

// Google OAuth routes
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
    session: false,
  }),
  googleCallback
);

// Active routes
router.post("/logout", logout);
router.get("/profile", isAuthenticated, getProfile);

export default router;
