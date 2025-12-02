import axios from "axios";

// Generate secure UUID for idempotency using Web Crypto API
const generateUUID = () => {
  // Use native crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests
});

// Add token and idempotency key to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add idempotency key for POST, PUT, PATCH requests
    if (["post", "put", "patch"].includes(config.method?.toLowerCase())) {
      config.headers["Idempotency-Key"] = generateUUID();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Public API calls (no auth required)
export const publicApi = {
  // Get all items with filters
  getItems: (params) => api.get("/user/items", { params }),

  // Get single item
  getItem: (id) => api.get(`/user/items/${id}`),
};

// User API calls (auth required)
export const userApi = {
  // Claim an item
  claimItem: (itemId) => api.post(`/user/items/${itemId}/claim`),

  // Get my claims
  getMyClaims: (params) => api.get("/user/my-claims", { params }),

  // Get user profile
  getProfile: () => api.get("/user/profile"),

  // Update user profile
  updateProfile: (data) => api.patch("/user/profile", data),

  // Get user history (admin only)
  getUserHistory: (userId) => api.get(`/user/history/${userId}`),
};

// Report API calls (auth required)
export const reportApi = {
  // Get upload URLs for photos
  getUploadUrls: (count, fileTypes) =>
    api.post("/reports/upload-urls", { count, fileTypes }),

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

  // Update report status (admin only)
  updateReportStatus: (id, status) =>
    api.patch(`/reports/${id}/status`, { status }),

  // Get reports by user ID (admin only)
  getReportsByUserId: (userId) => api.get(`/reports/user/${userId}`),
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

  // Feedback management
  getAllFeedback: (params) => api.get("/feedback/admin/all", { params }),
  approveFeedback: (id) => api.patch(`/feedback/${id}/approve`),
  updateFeedbackStatus: (id, status) =>
    api.patch(`/feedback/${id}/status`, { status }),
  respondToFeedback: (id, response) =>
    api.post(`/feedback/${id}/respond`, { response }),
};

export default api;
