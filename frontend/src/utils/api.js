import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
};

export default api;
