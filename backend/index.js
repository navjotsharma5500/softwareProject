/**
 * Express application entry point for the Lost & Found API.
 *
 * Bootstraps the Express server: loads environment variables, registers global
 * middleware (CORS, body parsers, sessions, Passport, rate-limiters, security
 * headers, request timeout), mounts all route groups, and starts the HTTP
 * listener.  The module also exports the configured `app` instance.
 *
 * @module backend/index
 * @exports {import('express').Application} app - Configured Express application instance.
 */

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
import statsRoutes from "./routes/stats.routes.js";
import makeAdminRoutes from "./routes/makeadmin.routes.js";

import {
  apiLimiter,
  authLimiter,
  adminLimiter,
} from "./middlewares/rateLimiter.middleware.js";
import { requestTimeout } from "./middlewares/queryTimeout.middleware.js";
import securityMiddleware from "./security.js";

// Load .env values into process.env before any other module reads them.
dotenv.config();

const app = express();

// CRITICAL: Trust proxy - MUST be at the top for Cloudflare + Nginx.
// Fixes HTTPS redirect loops and ensures req.secure, req.protocol work correctly.
// Value `1` means trust the first hop (Nginx / Cloudflare).
app.set("trust proxy", 1);

/**
 * Whitelist of origins that are permitted to call the API directly (i.e. not
 * via the Nginx reverse proxy).  The optional `FRONTEND_URL` env var allows
 * additional origins to be injected at run-time without code changes.
 *
 * Env vars consumed:
 *   - `FRONTEND_URL` – optional extra allowed origin (e.g. a preview deployment URL).
 *
 * @type {string[]}
 */
// CORS configuration - works with Nginx reverse proxy.
// In production, Nginx handles CORS headers to avoid duplication.
const allowedOrigins = [
  "https://lost-and-found-portal-six.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

/**
 * Conditional CORS middleware.
 *
 * When the request arrives through the Nginx reverse proxy (indicated by the
 * presence of `x-forwarded-for` or `x-real-ip` headers), CORS headers are
 * already set by Nginx, so this middleware skips to avoid duplicate headers.
 * For direct requests (local development, Postman, test runners) it applies
 * the standard `cors` package with the `allowedOrigins` whitelist.
 *
 * @param {import('express').Request}  req  - Incoming HTTP request.
 * @param {import('express').Response} res  - Outgoing HTTP response.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {void}
 */
app.use((req, res, next) => {
  // Skip CORS middleware if behind Nginx (production) - Nginx sets these headers.
  if (req.headers["x-forwarded-for"] || req.headers["x-real-ip"]) {
    return next();
  }

  // Apply CORS for direct access (development/localhost).
  return cors({
    /**
     * Dynamic origin validator.  Allows requests with no `Origin` header
     * (e.g. server-to-server calls, Postman) and any origin present in
     * `allowedOrigins`.  Rejects all other origins with an Error so the
     * `cors` package can respond with a 403.
     *
     * @param {string|undefined} origin   - The `Origin` header value from the request.
     * @param {Function}         callback - Node-style callback: `callback(err, allow)`.
     * @returns {void}
     */
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow tools like Postman

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    /** Allow cookies and `Authorization` headers to be sent cross-origin. */
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Idempotency-Key",
    ],
    /** Expose `set-cookie` so browser clients can read cookies on cross-origin responses. */
    exposedHeaders: ["set-cookie"],
    preflightContinue: false,
    /** Return 204 for successful preflight (OPTIONS) requests. */
    optionsSuccessStatus: 204,
  })(req, res, next);
});

// Request body parsers with size limits for abuse protection.
// 10 MB cap prevents excessively large payloads from exhausting memory.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Parse Cookie header and populate `req.cookies` for JWT / session handling.
app.use(cookieParser());

// Abort any request that has not completed within 30 seconds to free resources.
app.use(requestTimeout(30000));

// Apply Helmet-based security headers (CSP, HSTS, etc.).
securityMiddleware(app);

/**
 * TCP port the server listens on.
 * Reads from `PORT` env var; defaults to 3000 for local development.
 *
 * @type {number|string}
 */
const port = process.env.PORT || 3000;

/**
 * Morgan HTTP request logger.
 *
 * Enabled in `development` mode only.  Uses the `dev` format which colours
 * each request line by status code for quick scanning.  Intentionally
 * disabled in production to avoid leaking request details to stdout
 * (which PM2 captures in log files).
 */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/**
 * Express-session configuration used by Passport.js for OAuth flows.
 *
 * Env vars consumed:
 *   - `JWT_SECRET` – signs the session cookie to prevent tampering.
 *   - `NODE_ENV`   – when `"production"`, the `secure` flag is set so the
 *                    cookie is only transmitted over HTTPS.
 *
 * `resave: false`            – do not persist the session on every request.
 * `saveUninitialized: false` – do not create a session until data is written.
 * `maxAge`                   – 30-day sliding window keeps OAuth sessions alive.
 */
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

// Initialize Passport and restore authentication state from the session.
app.use(passportConfig.initialize());
app.use(passportConfig.session());

// Enable strong ETag generation so browsers can perform conditional GET
// requests and receive 304 Not Modified responses when content is unchanged.
app.set("etag", "strong");

// Establish the MongoDB connection.  Logs success/failure internally.
connectDB();

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

// Authentication routes (register, login, OAuth callbacks).
// `authLimiter` restricts brute-force attempts on login/register endpoints.
app.use("/api/auth", authLimiter, authRoutes);

// Admin-only management routes.
// `adminLimiter` applies a stricter rate limit to protect admin operations.
app.use("/api/admin", adminLimiter, adminRoutes);

// Authenticated user routes (profile, items, claims).
app.use("/api/user", apiLimiter, userRoutes);

// Lost & Found report routes.
app.use("/api/reports", apiLimiter, reportRoutes);

// Public statistics endpoints — rate limited inside the router itself.
app.use("/api/stats", statsRoutes);

// Health-check endpoint used by Nginx / Docker / uptime monitors.
// No rate limiting so monitoring systems are never blocked.
app.use("/health", healthRoutes);

// Route to make a user admin (not protected by adminOnly, but requires special code)
app.use("/api", makeAdminRoutes);

/**
 * Root endpoint — returns a simple API identification payload.
 *
 * @route   GET /
 * @access  Public
 * @returns {Object} 200 JSON `{ message: string, version: string }`.
 */
app.get("/", (req, res) => {
  res.status(200).json({ message: "Lost & Found API", version: "1.0.0" });
});

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------

/**
 * Start the HTTP server.
 *
 * Binding to `127.0.0.1` (loopback) intentionally restricts direct TCP
 * access; Nginx listens on the public interface and proxies to this address,
 * preventing accidental exposure of the Node process.
 *
 * Env vars consumed:
 *   - `PORT`     – port to bind (default: 3000).
 *   - `NODE_ENV` – logged at startup for quick environment verification.
 */
// Listen on localhost only - Nginx handles external traffic.
app.listen(port, "127.0.0.1", () => {
  console.log(`✅ Server running on http://127.0.0.1:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
