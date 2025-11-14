import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Google OAuth callback handler
export const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=authentication_failed`
      );
    }

    const isAdmin = req.user.isAdmin;
    const token = jwt.sign(
      { id: req.user._id, isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // 7 days for OAuth
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
      maxAge: 7 * 24 * 3600000, // 7 days
    });

    // Redirect to frontend login page with token
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
