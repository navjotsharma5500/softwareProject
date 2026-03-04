/**
 * @module config/passport
 * @description Passport.js configuration for Google OAuth 2.0 authentication.
 *
 * Restricts sign-in to `@thapar.edu` email addresses only.
 * On first login a new {@link module:models/user} document is created with the
 * roll number derived from the email local-part; subsequent logins update
 * any missing `googleId` / `profilePicture` fields.
 *
 * Required environment variables:
 *  - `GOOGLE_CLIENT_ID`
 *  - `GOOGLE_CLIENT_SECRET`
 *  - `GOOGLE_CALLBACK_URL` (defaults to `http://localhost:3000/api/auth/google/callback`)
 */
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES modules - get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory explicitly
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Serialises the authenticated user to the session store.
 * Only the MongoDB `_id` string is persisted, minimising session payload size.
 *
 * @param {import('../models/user.model.js').UserDocument} user - Mongoose user document.
 * @param {Function} done - Passport done callback.
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialises a user from the session by fetching the full document from MongoDB.
 *
 * @async
 * @param {string} id - MongoDB `_id` string stored in the session.
 * @param {Function} done - Passport done callback.
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Google OAuth 2.0 strategy verify callback.
 *
 * Workflow on every successful Google sign-in:
 *  1. Reject emails not ending in `@thapar.edu`.
 *  2. If a matching User document exists, backfill `googleId`/`profilePicture` if absent.
 *  3. If no matching document exists, create one—deriving `rollNo` from the email local-part.
 *
 * @async
 * @param {string} accessToken  - OAuth access token (not stored).
 * @param {string} refreshToken - OAuth refresh token (not stored).
 * @param {object} profile      - Google profile object returned by the strategy.
 * @param {Function} done       - Passport done callback `(err, user|false, info?)`.
 * @returns {Promise<void>}
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // Check if email is from @thapar.edu domain
        if (!email.endsWith("@thapar.edu")) {
          return done(null, false, {
            message: "Only @thapar.edu emails are allowed",
          });
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
          // Update existing user with Google ID if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            user.profilePicture = profile.photos[0]?.value;
            await user.save();
          }
          return done(null, user);
        }

        // Extract roll number from email (e.g., 102203XXX@thapar.edu)
        const rollNo = email.split("@")[0];

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email,
          googleId: profile.id,
          rollNo,
          profilePicture: profile.photos[0]?.value,
          isAdmin: false,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

export default passport;
