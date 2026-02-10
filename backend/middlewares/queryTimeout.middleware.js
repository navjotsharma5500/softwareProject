/**
 * Query timeout middleware to prevent long-running database queries
 * Adds timeout protection to prevent EC2 overload
 */

/**
 * Wraps a database query promise with timeout protection
 * @param {Promise} queryPromise - The database query promise
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000 = 10s)
 * @returns {Promise} - Race between query and timeout
 */
export const withQueryTimeout = (queryPromise, timeoutMs = 10000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Database query timeout")), timeoutMs),
  );

  return Promise.race([queryPromise, timeoutPromise]);
};

/**
 * Express middleware to set a global request timeout
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000 = 30s)
 */
export const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    // Set request timeout
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(504).json({
          message: "Request timeout",
          hint: "The request took too long to process. Please try again or contact support.",
        });
      }
    });

    // Also set response timeout
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(504).json({
          message: "Response timeout",
          hint: "The server took too long to respond. Please try again.",
        });
      }
    });

    next();
  };
};

/**
 * Helper to execute multiple queries with timeout protection
 * @param {Array<Promise>} queries - Array of query promises
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Array>} - Results from all queries
 */
export const executeWithTimeout = async (queries, timeoutMs = 10000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Batch query timeout")), timeoutMs),
  );

  const queriesPromise = Promise.all(queries);

  return Promise.race([queriesPromise, timeoutPromise]);
};
