import express from "express";
import passport from "passport";
import {
  logout,
  getProfile,
  googleCallback,
} from "../controllers/auth.controllers.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  googleCallback
);

// Active routes
router.post("/logout", logout);
router.get("/profile", isAuthenticated, getProfile);

export default router;
