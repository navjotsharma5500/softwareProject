/**
 * Request validation middleware to prevent abuse
 * Validates pagination params, limits, and other common params
 */

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  // Validate page
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        message: "Invalid page parameter. Must be a positive integer.",
      });
    }
    if (pageNum > 10000) {
      return res.status(400).json({
        message: "Page number too large. Maximum is 10000.",
      });
    }
    req.query.page = pageNum;
  }

  // Validate limit
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        message: "Invalid limit parameter. Must be a positive integer.",
      });
    }
    if (limitNum > 100) {
      return res.status(400).json({
        message: "Limit too large. Maximum is 100 items per page.",
      });
    }
    req.query.limit = limitNum;
  }

  next();
};

/**
 * Validate MongoDB ObjectId format
 */
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({
        message: `Missing ${paramName} parameter`,
      });
    }

    // MongoDB ObjectId is 24 hex characters
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!objectIdRegex.test(id)) {
      return res.status(400).json({
        message: `Invalid ${paramName} format. Must be a valid ObjectId.`,
      });
    }

    next();
  };
};

/**
 * Sanitize search query to prevent injection
 */
export const sanitizeSearchQuery = (req, res, next) => {
  const { search } = req.query;

  if (search !== undefined) {
    // Limit search query length
    if (search.length > 100) {
      return res.status(400).json({
        message: "Search query too long. Maximum 100 characters.",
      });
    }

    // Remove special regex characters to prevent ReDoS attacks
    const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    req.query.search = sanitized;
  }

  next();
};

// validateDateParams — reserved; not currently wired to any route
// export const validateDateParams = (paramNames = []) => { ... };

/**
 * Rate limit body size to prevent memory abuse
 */
export const validateBodySize = (maxSizeKB = 500) => {
  return (req, res, next) => {
    const bodySize = JSON.stringify(req.body).length;
    const maxBytes = maxSizeKB * 1024;

    if (bodySize > maxBytes) {
      return res.status(413).json({
        message: `Request body too large. Maximum ${maxSizeKB}KB allowed.`,
        hint: "Reduce the amount of data being sent or compress images before uploading.",
      });
    }

    next();
  };
};
