import express from "express";
import {
  signUp,
  login,
  logout,
  getProfile,
} from "../controllers/auth.controllers.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", isAuthenticated, getProfile);

export default router;
