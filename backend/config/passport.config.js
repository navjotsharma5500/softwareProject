import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
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
    }
  )
);

export default passport;
