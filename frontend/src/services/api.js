import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
  getActivities: (params) => api.get("/dashboard/activities", { params }),
  getSalesMetrics: (params) => api.get("/dashboard/sales-metrics", { params }),
};

// Leads
export const leadsApi = {
  getAll: (params) => api.get("/leads", { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post("/leads", data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
};

// Deals
export const dealsApi = {
  getAll: (params) => api.get("/deals", { params }),
  getKanban: () => api.get("/deals/kanban"),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post("/deals", data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  updateStatus: (id, status) => api.put(`/deals/${id}/status`, { status }),
  delete: (id) => api.delete(`/deals/${id}`),
};

// Analytics
export const analyticsApi = {
  getOverview: (params) => api.get("/analytics/overview", { params }),
  getSalesChart: (params) => api.get("/analytics/sales-chart", { params }),
  getLeadSources: () => api.get("/analytics/lead-sources"),
  getConversionFunnel: () => api.get("/analytics/conversion-funnel"),
  getDealStatusBreakdown: () => api.get("/analytics/deal-status-breakdown"),
};

export default api;
