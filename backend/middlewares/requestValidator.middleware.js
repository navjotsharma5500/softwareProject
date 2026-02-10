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

/**
 * Validate date parameters
 */
export const validateDateParams = (paramNames = []) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const dateStr = req.query[paramName] || req.body[paramName];

      if (dateStr !== undefined) {
        const date = new Date(dateStr);

        if (isNaN(date.getTime())) {
          return res.status(400).json({
            message: `Invalid ${paramName}. Must be a valid date.`,
          });
        }

        // Check if date is reasonable (not too far in past/future)
        const now = new Date();
        const tenYearsAgo = new Date(
          now.getFullYear() - 10,
          now.getMonth(),
          now.getDate(),
        );
        const oneYearFuture = new Date(
          now.getFullYear() + 1,
          now.getMonth(),
          now.getDate(),
        );

        if (date < tenYearsAgo || date > oneYearFuture) {
          return res.status(400).json({
            message: `${paramName} must be within the last 10 years and not more than 1 year in the future.`,
          });
        }
      }
    }

    next();
  };
};

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
