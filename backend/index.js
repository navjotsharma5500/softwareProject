import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectDB from "./utils.js";
import passportConfig from "./config/passport.config.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import reportRoutes from "./routes/report.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";

import {
  apiLimiter,
  authLimiter,
  adminLimiter,
} from "./middlewares/rateLimiter.middleware.js";
import securityMiddleware from "./security.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
securityMiddleware(app);
const port = process.env.PORT || 3000;

// Log every request during Jest tests for debugging
if (process.env.JEST_WORKER_ID !== undefined) {
  app.use((req, res, next) => {
    console.log(`[TEST] ${req.method} ${req.url}`);
    next();
  });
}

// Trust proxy - required for Render and other cloud platforms
app.set("trust proxy", 1);
if (
  process.env.NODE_ENV === "development" ||
  process.env.JEST_WORKER_ID !== undefined
) {
  app.use(morgan("dev"));
}
app.use(
  cors({
    // Use FRONTEND_URL from environment, fallback to production/dev defaults
    origin:
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://lost-and-found-portal-six.vercel.app"
        : "http://localhost:5173"),
    credentials: true,
  })
);

// Session configuration for passport
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize passport
app.use(passportConfig.initialize());
app.use(passportConfig.session());

connectDB();

// Apply rate limiters to routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);
app.use("/api/user", apiLimiter, userRoutes);
app.use("/api/reports", apiLimiter, reportRoutes);
app.use("/api/feedback", apiLimiter, feedbackRoutes);

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});
app.get("/", (req, res) => {
  res.status(200).send("API root");
});

// Start server (skip only during tests)
if (process.env.JEST_WORKER_ID === undefined) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
