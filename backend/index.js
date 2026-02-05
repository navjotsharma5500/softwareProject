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

// ✅ CRITICAL: Trust proxy - MUST be at the top for Cloudflare + Nginx
// Fixes HTTPS redirect loops and ensures req.secure, req.protocol work correctly
app.set("trust proxy", 1);

// CORS configuration - works with Nginx reverse proxy
// In production, Nginx handles CORS headers to avoid duplication
const allowedOrigins = [
  "https://lost-and-found-portal-six.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Production: Behind Nginx reverse proxy
      // Nginx adds CORS headers, but Express needs to allow the request
      if (process.env.NODE_ENV === "production") {
        // When behind Nginx, origin might be undefined (proxied request)
        // Trust Nginx to handle CORS validation
        return callback(null, true);
      }

      // Development: Direct browser access
      if (!origin) return callback(null, true); // Allow tools like Postman

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Idempotency-Key",
    ],
    exposedHeaders: ["set-cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

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

if (
  process.env.NODE_ENV === "development" ||
  process.env.JEST_WORKER_ID !== undefined
) {
  app.use(morgan("dev"));
}

// Session configuration for passport
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000, // 2 weeks (14 days)
    },
  }),
);

// Initialize passport
app.use(passportConfig.initialize());
app.use(passportConfig.session());

// Enable ETag for conditional requests (browser caching)
app.set("etag", "strong");

connectDB();

// Apply rate limiters to routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);
app.use("/api/user", apiLimiter, userRoutes);
app.use("/api/reports", apiLimiter, reportRoutes);
app.use("/api/feedback", apiLimiter, feedbackRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/", (req, res) => {
  res.status(200).json({ message: "Lost & Found API", version: "1.0.0" });
});

// Start server (skip only during tests)
if (process.env.JEST_WORKER_ID === undefined) {
  app.listen(port, "127.0.0.1", () => {
    console.log(`✅ Server running on http://127.0.0.1:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}
// Listen on localhost only - Nginx handles external traffic
export default app;
1;
