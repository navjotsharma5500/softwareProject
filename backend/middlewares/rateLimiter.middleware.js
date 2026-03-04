/**
 * @module middlewares/rateLimiter
 * @description Collection of `express-rate-limit` instances used across the
 * application to enforce per-IP request budgets.
 *
 * All limiters use RFC-standard `RateLimit-*` headers (`standardHeaders: true`)
 * and suppress the legacy `X-RateLimit-*` headers (`legacyHeaders: false`).
 *
 * | Export              | Window   | Max requests | Applied to               |
 * |---------------------|----------|-------------|---------------------------|
 * | `apiLimiter`        | 15 min   | 100         | Public stats / misc       |
 * | `authLimiter`       | 15 min   | 50          | Auth endpoints            |
 * | `claimLimiter`      | 1 hour   | 50          | Claim creation            |
 * | `adminLimiter`      | 15 min   | 200         | Admin dashboard routes    |
 * | `uploadLimiter`     | 1 hour   | 20          | Photo upload-URL requests |
 * | `searchLimiter`     | 1 min    | 30          | Item search               |
 * | `csvDownloadLimiter`| 1 hour   | 100         | CSV data export           |
 * | `reportLimiter`     | 24 hours | 75          | Report creation           |
 */
import rateLimit from "express-rate-limit";

/** General-purpose limiter for low-sensitivity public endpoints (100 req / 15 min). */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/** Stricter limiter for authentication routes (50 req / 15 min). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs (increased for development/testing)
  message:
    "Too many authentication attempts, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

/** Moderate limiter applied to claim-creation endpoints (50 req / 1 hour). */
export const claimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 10 claim requests per hour
  message: "Too many claim requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/** Relaxed limiter for authenticated admin dashboard routes (200 req / 15 min). */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: "Too many admin requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// feedbackLimiter — reserved for a future feedback/contact route
// export const feedbackLimiter = rateLimit({
//   windowMs: 24 * 60 * 60 * 1000,
//   max: 100,
//   message: "Too many feedback submissions, please try again later.",
//   standardHeaders: true,
//   legacyHeaders: false,
// });

/** Strict limiter for photo upload-URL generation endpoints (20 req / 1 hour). */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 upload requests per hour
  message: "Too many file upload requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/** Per-minute limiter for item search queries (30 req / 1 min). */
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 search requests per minute
  message: "Too many search requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

/** Limiter for the admin CSV data-export endpoint (100 req / 1 hour). */
export const csvDownloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Max 100 CSV downloads per hour
  message: "Too many download requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/** Daily limiter for lost-item report submissions to prevent spam (75 req / 24 hours). */
export const reportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 75, // Max 10 reports per day per IP
  message: "Too many report submissions, please try again tomorrow.",
  standardHeaders: true,
  legacyHeaders: false,
});
