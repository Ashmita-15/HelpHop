const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'vc_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Thrown for any non-2xx response; carries the server's message and status. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON response — handled below */
  }

  if (!res.ok) {
    // An expired/invalid token means the stored session is useless.
    if (res.status === 401 && token) clearToken();
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status);
  }

  return data;
}

const qs = (params) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== 'All')
  ).toString();
  return search ? `?${search}` : '';
};

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  // Opportunities
  listOpportunities: (filters = {}) => request(`/opportunities${qs(filters)}`),
  getOpportunity: (id) => request(`/opportunities/${id}`),
  createOpportunity: (payload) => request('/opportunities', { method: 'POST', body: payload }),
  updateOpportunity: (id, payload) =>
    request(`/opportunities/${id}`, { method: 'PUT', body: payload }),
  deleteOpportunity: (id) => request(`/opportunities/${id}`, { method: 'DELETE' }),
  joinOpportunity: (id) => request(`/opportunities/${id}/join`, { method: 'POST' }),
  listVolunteers: (id) => request(`/opportunities/${id}/volunteers`),
  categories: () => request('/opportunities/categories', { auth: false }),

  // Dashboard + AI
  dashboard: () => request('/users/dashboard'),
  generateDescription: (payload) =>
    request('/ai/generate-description', { method: 'POST', body: payload }),
};
