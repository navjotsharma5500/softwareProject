import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectDB from "./utils.js";
import passportConfig from "./config/passport.config.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import reportRoutes from "./routes/report.routes.js";
import healthRoutes from "./routes/health.routes.js";

import {
  apiLimiter,
  authLimiter,
  adminLimiter,
} from "./middlewares/rateLimiter.middleware.js";
import { requestTimeout } from "./middlewares/queryTimeout.middleware.js";
import securityMiddleware from "./security.js";

dotenv.config();

const app = express();

//  CRITICAL: Trust proxy - MUST be at the top for Cloudflare + Nginx
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

// Conditionally enable CORS - skip if behind Nginx proxy to avoid duplicate headers
app.use((req, res, next) => {
  // Skip CORS middleware if behind Nginx (production) - Nginx sets these headers
  if (req.headers["x-forwarded-for"] || req.headers["x-real-ip"]) {
    return next();
  }

  // Apply CORS for direct access (development/localhost)
  return cors({
    origin: function (origin, callback) {
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
  })(req, res, next);
});

// Request body parsers with size limits for abuse protection
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Apply global request timeout middleware (30 seconds)
app.use(requestTimeout(30000));

// Apply security middleware
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
      maxAge: 30 * 24 * 60 * 60 * 1000, // 1 month (30 days)
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
app.use("/health", healthRoutes); // No rate limiting on health checks

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
