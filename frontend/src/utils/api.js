/**
 * @file api.js
 * @description Pre-configured Axios client and namespaced API helper objects
 * used throughout the frontend.
 *
 * ## Exports
 * | Name          | Type              | Description |
 * |---------------|-------------------|-------------|
 * | `publicApi`   | object            | Unauthenticated item/stats endpoints |
 * | `userApi`     | object            | Profile, claims, lost-item reports |
 * | `reportApi`   | object            | Report CRUD + image-upload endpoints |
 * | `adminApi`    | object            | Admin-only management endpoints |
 *
 * ## Axios instance details
 * - `baseURL` from `VITE_API_BASE_URL` (falls back to `http://localhost:3000/api`)
 * - `withCredentials: true` – sends the httpOnly JWT cookie
 * - 30-second timeout, no redirect following
 * - **Request interceptor**: attaches `Authorization: Bearer <token>` from
 *   `localStorage` and adds an `Idempotency-Key` UUID header to all mutating
 *   methods (POST, PUT, PATCH, DELETE).
 * - **Response interceptor**: silently redirects to `/login` on HTTP 401.
 */
import axios from "axios";

/**
 * Generates a UUID v4 string using the Web Crypto API.
 *
 * Prefers `crypto.randomUUID()` (available in modern browsers). Falls back
 * to a manual byte-based implementation for older environments.
 *
 * @returns {string} A random UUID v4 string (e.g. `"110e8400-e29b-41d4-..."`)
 */
const generateUUID = () => {
  // Use native crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL

// Create axios instance with timeout for EC2 optimization
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests
  maxRedirects: 0, // Don't follow redirects - API should respond directly
  timeout: 30000, // 30 second timeout to prevent hanging requests
});

// Add token and idempotency key to requests
api.interceptors.request.use(
  (config) => {

    // Add idempotency key for POST, PUT, PATCH, DELETE requests
    if (
      ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())
    ) {
      config.headers["Idempotency-Key"] = generateUUID();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      window.location.href = "/lostnfound/login";
    }
    return Promise.reject(error);
  },
);

// Public API calls (no auth required)
export const publicApi = {
  // Get all items with filters (with request cancellation support)
  getItems: (params, config = {}) =>
    api.get("/user/items", { params, ...config }),

  // Get single item
  getItem: (id, config = {}) => api.get(`/user/items/${id}`, config),
};

// User API calls (auth required)
export const userApi = {
  // Claim an item
  claimItem: (itemId) => api.post(`/user/items/${itemId}/claim`),

  // Check whether the current user has a claim for a specific item.
  // Returns { hasClaim, hasRejectedClaim, claim }.
  checkMyClaim: (itemId) => api.get(`/user/items/${itemId}/my-claim`),

  // Get my claims (with request cancellation support)
  getMyClaims: (params, config = {}) =>
    api.get("/user/my-claims", { params, ...config }),

  // Delete own claim
  deleteClaim: (claimId) => api.delete(`/user/my-claims/${claimId}`),

  // Get user profile
  getProfile: () => api.get("/auth/profile"),

  // Update user profile
  updateProfile: (data) => api.patch("/user/profile", data),

  // Get user history (admin only)
  getUserHistory: (userId) => api.get(`/user/history/${userId}`),
};

// Report API calls (auth required)
export const reportApi = {
  // Get upload URLs for photos (with timeout protection)
  getUploadUrls: (count, fileTypes) =>
    api.post("/reports/upload-urls", { count, fileTypes }, { timeout: 10000 }),

  // Create a report
  createReport: (data) => api.post("/reports", data),

  // Get my reports
  getMyReports: (params) => api.get("/reports/my-reports", { params }),

  // Get all reports (admin only)
  getAllReports: (params) => api.get("/reports/all", { params }),

  // Get report by ID
  getReport: (id) => api.get(`/reports/${id}`),

  // Update report
  updateReport: (id, data) => api.patch(`/reports/${id}`, data),

  // Delete report
  deleteReport: (id) => api.delete(`/reports/${id}`),

  // Resolve own report (owner only)
  resolveReport: (id) => api.patch(`/reports/${id}/resolve`),

  // Update report status (admin only)
  updateReportStatus: (id, status) =>
    api.patch(`/reports/${id}/status`, { status }),

  // Get reports by user ID (admin only)
  getReportsByUserId: (userId) => api.get(`/reports/user/${userId}`),

  // Delete orphaned ImageKit files after a failed report submission
  deleteOrphanedImages: (fileIds) =>
    api.delete("/reports/orphaned-images", { data: { fileIds } }),
};

// Admin API calls (admin only)
export const adminApi = {
  // Get all items
  getItems: (params) => api.get("/admin/items", { params }),

  // Create item
  createItem: (data) => api.post("/admin/items", data),

  // Get item by ID
  getItem: (id) => api.get(`/admin/items/${id}`),

  // Update item
  updateItem: (id, data) => api.patch(`/admin/items/${id}`, data),

  // Delete item
  deleteItem: (id) => api.delete(`/admin/items/${id}`),

  // Get all claims for an item
  getItemClaims: (itemId) => api.get(`/admin/items/${itemId}/claims`),

  // Get all pending claims
  getClaims: (params) => api.get("/admin/claims", { params }),

  // Approve claim
  approveClaim: (claimId, remarks) =>
    api.patch(`/admin/claims/${claimId}/approve`, { remarks }),

  // Reject claim
  rejectClaim: (claimId, remarks) =>
    api.patch(`/admin/claims/${claimId}/reject`, { remarks }),

  // Download CSV data
  downloadCsv: () => api.get("/admin/download-csv", { responseType: "text" }),

  // User management
  getUsers: (params) => api.get("/admin/users", { params }),
  toggleBlacklist: (userId) => api.patch(`/admin/users/${userId}/blacklist`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // Admin privilege management
  makeAdmin: (email, code) => api.post("/makeadmin", { email, code }),
  removeAdmin: (email, code) => api.post("/removeadmin", { email, code }),
};

export default api;
