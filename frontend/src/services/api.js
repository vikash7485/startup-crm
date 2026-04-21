import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/password", data),
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

// Notifications
export const notificationsApi = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
};

// Notes
export const notesApi = {
  getByLead: (leadId) => api.get(`/notes/${leadId}`),
  create: (data) => api.post("/notes", data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// Reminders
export const remindersApi = {
  getUpcoming: () => api.get("/reminders/upcoming"),
  getByLead: (leadId) => api.get(`/reminders/lead/${leadId}`),
  create: (data) => api.post("/reminders", data),
  complete: (id) => api.put(`/reminders/${id}/complete`),
  delete: (id) => api.delete(`/reminders/${id}`),
};


export default api;
