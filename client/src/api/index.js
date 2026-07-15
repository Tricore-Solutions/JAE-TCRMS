// Renderer data layer. Talks to the Electron main process over a single IPC
// channel (window.electron.db.call) which connects directly to MySQL.
// Every call resolves to { data } on success (axios-compatible) and throws an
// axios-like error ({ response: { data: { error }, status } }) on failure.

export const DEFAULT_DB_CONFIG = {
  host: '',
  port: '3306',
  database: 'tcrms',
  user: 'tcrms_user',
  password: 'tcrms_password',
};

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function clearSession() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch { /* ignore */ }
  onUnauthorized?.();
}

function makeError(message, status) {
  const msg = message || 'Request failed';
  const err = new Error(msg);
  err.response = { data: { error: msg }, status };
  err.status = status;
  return err;
}

function bridge() {
  return (typeof window !== 'undefined' && window.electron) ? window.electron : null;
}

async function invoke(op, payload) {
  const b = bridge();
  if (!b || !b.db || typeof b.db.call !== 'function') {
    throw makeError('Desktop bridge unavailable. Please restart the application.', 0);
  }
  return b.db.call(op, payload);
}

// Returns { data } on success, throws an axios-like error otherwise.
async function request(op, payload, options = {}) {
  let res;
  try {
    res = await invoke(op, payload);
  } catch (e) {
    throw makeError(e && e.message, 0);
  }
  if (res && res.ok) return { data: res.data };

  const status = (res && res.status) != null ? res.status : 500;
  const message = (res && res.error) || 'Request failed';
  if ((status === 401 || status === 403) && op !== 'auth.login') {
    clearSession();
    if (!options.skipAuthRedirect && !window.location.hash.includes('/login')) {
      window.location.hash = '/login';
    }
  }
  throw makeError(message, status);
}

// ---- Auth -------------------------------------------------------------------
export const authApi = {
  login: (credentials) => request('auth.login', credentials),
  me: (options = {}) => request('auth.me', undefined, options),
  logout: () => request('auth.logout'),
};

// ---- Employees --------------------------------------------------------------
export const employeesApi = {
  list: (params) => request('employees.list', params || {}),
  get: (id) => request('employees.get', { id }),
  create: (data) => request('employees.create', data),
  update: (id, data) => request('employees.update', { id, data }),
  remove: (id) => request('employees.remove', { id }),
  filters: () => request('employees.filters'),
};

// ---- Trainings --------------------------------------------------------------
export const trainingsApi = {
  list: (params) => request('trainings.list', params || {}),
  summary: () => request('trainings.summary'),
  get: (id) => request('trainings.get', { id }),
  create: (data) => request('trainings.create', data),
  update: (id, data) => request('trainings.update', { id, data }),
  remove: (id) => request('trainings.remove', { id }),
  categories: () => request('trainings.categories'),
  titles: () => request('trainings.titles'),
  archived: () => request('trainings.archived'),
  restore: (id) => request('trainings.restore', { id }),
  deletePermanent: (id) => request('trainings.deletePermanent', { id }),
  bulkArchive: (ids) => request('trainings.bulkArchive', { ids }),
  bulkRestore: (ids) => request('trainings.bulkRestore', { ids }),
  bulkDelete: (ids) => request('trainings.bulkDelete', { ids }),
  importExcel: async (formData) => {
    const file = formData && typeof formData.get === 'function' ? formData.get('file') : null;
    if (!file) throw makeError('Excel file is required', 400);
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return request('trainings.import', { filename: file.name, bytes });
  },
};

// ---- Users ------------------------------------------------------------------
export const usersApi = {
  list: () => request('users.list'),
  get: (id) => request('users.get', { id }),
  create: (data) => request('users.create', data),
  update: (id, data) => request('users.update', { id, data }),
  remove: (id) => request('users.remove', { id }),
};

// ---- Reports ----------------------------------------------------------------
export const reportsApi = {
  overview: () => request('reports.overview'),
  byCategory: () => request('reports.byCategory'),
  byFactory: () => request('reports.byFactory'),
  expiring: (params) => request('reports.expiring', params || {}),
  auditLogs: (limit) => request('reports.auditLogs', { limit }),
  recordLogs: (table, id) => request('reports.recordLogs', { table, id }),
  exportTrainings: (params) => request('reports.exportTrainings', params || {}),
  takesPerMonth: () => request('reports.takesPerMonth'),
};

// ---- Public (no auth) -------------------------------------------------------
export const publicApi = {
  employees: (params) => request('public.employees', params || {}),
  employeeTrainings: (id, params) => request('public.employeeTrainings', { id, ...(params || {}) }),
  trainingTitles: () => request('public.trainingTitles'),
};

// ---- DB connection configuration (used by Setup / boot) ---------------------
export const dbConfigApi = {
  get: async () => {
    const res = await invoke('config.getDb');
    if (res && res.ok) return res.data; // db config object or null
    throw makeError(res && res.error, (res && res.status) || 500);
  },
  test: async (cfg) => {
    const res = await invoke('db.test', cfg);
    if (res && res.ok) return true;
    throw makeError(res && res.error, (res && res.status) || 400);
  },
  set: async (cfg) => {
    const res = await invoke('config.setDb', cfg);
    if (res && res.ok) return res.data;
    throw makeError(res && res.error, (res && res.status) || 400);
  },
  clear: async () => {
    const res = await invoke('config.clearDb');
    if (res && res.ok) return res.data;
    throw makeError(res && res.error, (res && res.status) || 500);
  },
};
