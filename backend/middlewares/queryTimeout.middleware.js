/**
 * @module middlewares/queryTimeout
 * @description Timeout guards for Mongoose queries and HTTP request/response cycles.
 *
 * Prevents slow MongoDB queries from tying up the Node.js event loop or
 * exhausting the connection pool under load. All three helpers use
 * `Promise.race` against a rejection timeout so the caller can handle
 * the `"Database query timeout"` error message with a 504 response.
 */

/**
 * Races a Mongoose query promise against a rejection timeout.
 *
 * @param {Promise<any>} queryPromise - The Mongoose query or `Promise.all` batch.
 * @param {number} [timeoutMs=10000]  - Milliseconds before the timeout fires.
 * @returns {Promise<any>} Resolves with the query result or rejects with
 *   `Error('Database query timeout')`.
 */
export const withQueryTimeout = (queryPromise, timeoutMs = 10000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Database query timeout")), timeoutMs),
  );

  return Promise.race([queryPromise, timeoutPromise]);
};

/**
 * Express middleware that caps the total allowed request/response duration.
 *
 * Registers `setTimeout` on both `req` and `res` to handle the case where
 * either the inbound stream stalls or the server takes too long to write the
 * full response. Sends HTTP 504 if the deadline is exceeded.
 *
 * @param {number} [timeoutMs=30000] - Maximum allowed duration in milliseconds.
 * @returns {import('express').RequestHandler}
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
 * Executes multiple independent queries in parallel with a shared timeout.
 *
 * Internally calls `Promise.all(queries)` and races it against a timeout
 * so all queries either complete within the window or the entire batch fails.
 *
 * @async
 * @param {Array<Promise<any>>} queries  - Array of Mongoose query promises.
 * @param {number} [timeoutMs=10000]     - Shared deadline in milliseconds.
 * @returns {Promise<Array<any>>} Resolves with an array of results in the
 *   same order as `queries`, or rejects with `Error('Batch query timeout')`.
 */
export const executeWithTimeout = async (queries, timeoutMs = 10000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Batch query timeout")), timeoutMs),
  );

  const queriesPromise = Promise.all(queries);

  return Promise.race([queriesPromise, timeoutPromise]);
};
