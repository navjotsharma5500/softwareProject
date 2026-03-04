/**
 * @module middlewares/requestValidator
 * @description Lightweight Express middleware helpers for validating and
 * sanitising common request inputs before they reach controllers.
 *
 * These guards sit between the rate-limiter and the controller, keeping
 * controller code free from input-validation boilerplate.
 */

/**
 * Validates `req.query.page` and `req.query.limit` and coerces them to
 * integers in-place so controllers can use them directly.
 *
 * Allowed ranges:
 *  - `page`:  1 – 10 000
 *  - `limit`: 1 – 100
 *
 * @param {import('express').Request}  req  - Express request.
 * @param {import('express').Response} res  - Express response.
 * @param {import('express').NextFunction} next - Next middleware.
 * @returns {void}
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
 * Factory that returns a middleware validating a named route parameter as a
 * 24-character hexadecimal MongoDB ObjectId.
 *
 * @param {string} [paramName='id'] - The `req.params` key to validate.
 * @returns {import('express').RequestHandler}
 * @example
 * router.get('/:itemId', validateObjectId('itemId'), getItemById);
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
 * Sanitises `req.query.search` to prevent Regular Expression Denial of
 * Service (ReDoS) attacks.
 *
 * - Truncates to 100 characters.
 * - Escapes all regex meta-characters so the value can be passed directly
 *   to `new RegExp(req.query.search, 'i')` without risk.
 *
 * @param {import('express').Request}  req  - Express request.
 * @param {import('express').Response} res  - Express response.
 * @param {import('express').NextFunction} next - Next middleware.
 * @returns {void}
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
 * Factory that returns a middleware rejecting requests whose serialised
 * JSON body exceeds the specified size limit.
 *
 * Uses `JSON.stringify(req.body).length` as a conservative byte estimate.
 * Sends HTTP 413 Payload Too Large when the limit is exceeded.
 *
 * @param {number} [maxSizeKB=500] - Maximum allowed body size in kilobytes.
 * @returns {import('express').RequestHandler}
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
