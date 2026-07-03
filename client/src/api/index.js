import axios from 'axios';

export const DEFAULT_SERVER = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getServerUrl() {
  try {
    const stored = localStorage.getItem('serverUrl');
    return stored || DEFAULT_SERVER;
  } catch {
    return DEFAULT_SERVER;
  }
}

export function setServerUrl(url) {
  localStorage.setItem('serverUrl', url);
  api.defaults.baseURL = url + '/api';
}

export const api = axios.create({
  baseURL: getServerUrl() + '/api',
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401/403 globally — clear session and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Employees
export const employeesApi = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
  filters: () => api.get('/employees/meta/filters'),
};

// Trainings
export const trainingsApi = {
  list: (params) => api.get('/trainings', { params }),
  summary: () => api.get('/trainings/summary'),
  get: (id) => api.get(`/trainings/${id}`),
  create: (data) => api.post('/trainings', data),
  update: (id, data) => api.put(`/trainings/${id}`, data),
  remove: (id) => api.delete(`/trainings/${id}`),
  categories: () => api.get('/trainings/meta/categories'),
};

// Users
export const usersApi = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

// Reports
export const reportsApi = {
  overview: () => api.get('/reports/overview'),
  byCategory: () => api.get('/reports/by-category'),
  byFactory: () => api.get('/reports/by-factory'),
  expiring: (params) => api.get('/reports/expiring', { params }),
  auditLogs: (limit) => api.get('/reports/audit-logs', { params: { limit } }),
  recordLogs: (table, id) => api.get(`/reports/audit-logs/${table}/${id}`),
  exportTrainings: (params) => api.get('/reports/export/trainings', { params }),
  takesPerMonth: () => api.get('/reports/takes-per-month'),
};

// Public (no auth)
export const publicApi = {
  employees: (params) => axios.get(getServerUrl() + '/api/public/employees', { params }),
  employeeTrainings: (id) => axios.get(getServerUrl() + `/api/public/employees/${id}/trainings`),
};

// Health check
export const checkServer = (url) =>
  axios.get((url || getServerUrl()) + '/health', { timeout: 5000 });
