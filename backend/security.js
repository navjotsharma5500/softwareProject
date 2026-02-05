// Complete production-ready security middleware for Express.js
// Comprehensive security implementation for Lost & Found Portal

import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";
import slowDown from "express-slow-down";

/**
 * Security Middleware Configuration
 *
 * This module implements multiple layers of security:
 * 1. HTTP Headers protection (Helmet)
 * 2. HSTS for HTTPS enforcement
 * 3. Parameter pollution prevention
 * 4. Response compression
 * 5. Request size limits
 * 6. Rate limiting and slow-down
 *
 * Note: mongoSanitize and xss-clean are disabled due to Express v5 incompatibility
 * Input sanitization is handled at the route/controller level using validation
 */

export default function securityMiddleware(app) {
  // 1. Advanced Helmet policies for HTTP security headers
  // Note: CORS must be configured BEFORE helmet to avoid conflicts
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for development
        objectSrc: ["'none'"],
        imgSrc: ["'self'", "data:", "https:", "http:"], // Allow external images (GitHub, S3, etc.)
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
        connectSrc: ["'self'", "https://api.github.com"], // Allow GitHub API
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    }),
  );
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    }),
  );

  // 2. Additional Helmet security headers
  app.use(helmet.noSniff()); // Prevent MIME type sniffing
  app.use(helmet.frameguard({ action: "deny" })); // Prevent clickjacking
  app.use(helmet.xssFilter()); // Enable XSS filter
  app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));

  // 3. Prevent HTTP Parameter Pollution attacks
  app.use(
    hpp({
      whitelist: ["category", "status"], // Allow duplicate query params for filtering
    }),
  );

  // 4. Response compression for better performance
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6, // Compression level (0-9, 6 is default)
    }),
  );

  // 5. Request size limits to prevent DoS attacks
  app.use((req, res, next) => {
    // Only set limits if not already set in main app
    if (!req._body) {
      app.use(express.json({ limit: "10kb" }));
      app.use(express.urlencoded({ limit: "10kb", extended: true }));
    }
    next();
  });

  // 6. Slow-down middleware - Introduces delay after 50 requests in a minute to mitigate brute-force attacks
  app.use(
    slowDown({
      windowMs: 60 * 1000, // 1 minute window
      delayAfter: 50, // Allow 50 requests per minute at full speed
      delayMs: () => 500, // Add 500ms delay per request after limit
      maxDelayMs: 20000, // Maximum delay of 20 seconds
    }),
  );

  // 7. Security headers for additional protection
  app.use((req, res, next) => {
    // Prevent browsers from caching sensitive data
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    next();
  });

  // 8. Request logging for security monitoring (production)
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        // Log suspicious activity
        if (
          res.statusCode === 401 ||
          res.statusCode === 403 ||
          res.statusCode === 429
        ) {
          console.warn(
            `[SECURITY] ${req.method} ${req.url} - Status: ${res.statusCode} - IP: ${req.ip} - Duration: ${duration}ms`,
          );
        }
      });
      next();
    });
  }
}
