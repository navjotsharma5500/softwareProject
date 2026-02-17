import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth endpoints (login/signup) - stricter limits
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs (increased for development/testing)
  message:
    "Too many authentication attempts, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Claim endpoints - moderate limits
export const claimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 10 claim requests per hour
  message: "Too many claim requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin endpoints - more lenient
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: "Too many admin requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const feedbackLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // Limit each IP to 100 per day (increased for development)
  message: "Too many feedback submissions, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter - strict to prevent abuse
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 upload requests per hour
  message: "Too many file upload requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Search rate limiter - moderate protection
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 search requests per minute
  message: "Too many search requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

// CSV download rate limiter - strict to prevent abuse
export const csvDownloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Max 100 CSV downloads per hour
  message: "Too many download requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Report creation rate limiter - prevent spam
export const reportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 75 , // Max 10 reports per day per IP
  message: "Too many report submissions, please try again tomorrow.",
  standardHeaders: true,
  legacyHeaders: false,
});
