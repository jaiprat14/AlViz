/**
 * api.js
 * REST client for the AlViz Node/Express backend.
 */

export const BASE_URL = 'http://localhost:5000/api';

const TOKEN_KEY = 'alviz_jwt_token';
const USER_KEY = 'alviz_user_profile';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('LocalStorage removal failed:', e);
  }
}

export function saveStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.error('LocalStorage user save failed:', e);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Universal fetch wrapper for API communication.
 */
export async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = false) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (requiresAuth) {
    throw new Error('Authentication required. Please log in.');
  }

  const options = {
    method,
    headers,
  };

  if (body !== null && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (netErr) {
    throw new Error(`Server connection failed: ${netErr.message}. Ensure backend is running at ${BASE_URL}`);
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errMsg = (data && (data.error || data.message)) || `HTTP error ${response.status}: ${response.statusText}`;
    const err = new Error(errMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Auth Endpoints ──────────────────────────────────────────

export const auth = {
  async register(username, email, password) {
    const res = await apiRequest('/auth/register', 'POST', { username, email, password });
    if (res && res.token) {
      setToken(res.token);
      if (res.user) saveStoredUser(res.user);
    }
    return res;
  },

  async login(email, password) {
    const res = await apiRequest('/auth/login', 'POST', { email, password });
    if (res && res.token) {
      setToken(res.token);
      if (res.user) saveStoredUser(res.user);
    }
    return res;
  },

  async getMe() {
    const res = await apiRequest('/auth/me', 'GET', null, true);
    if (res && res.user) {
      saveStoredUser(res.user);
    }
    return res;
  },

  async logout() {
    try {
      if (getToken()) {
        await apiRequest('/auth/logout', 'POST', {}, true);
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      removeToken();
    }
  },
};

// ── Dataset Endpoints ────────────────────────────────────────

export const datasets = {
  async getAll() {
    return apiRequest('/datasets', 'GET', null, true);
  },

  async getPublic() {
    return apiRequest('/datasets/public', 'GET');
  },

  async getOne(id) {
    return apiRequest(`/datasets/${id}`, 'GET');
  },

  async create(name, algorithm, data, description = '', isPublic = false) {
    return apiRequest('/datasets', 'POST', { name, algorithm, data, description, isPublic }, true);
  },

  async update(id, updates) {
    return apiRequest(`/datasets/${id}`, 'PUT', updates, true);
  },

  async delete(id) {
    return apiRequest(`/datasets/${id}`, 'DELETE', null, true);
  },
};

// ── History Endpoints ────────────────────────────────────────

export const history = {
  async getAll(page = 1, limit = 20) {
    return apiRequest(`/history?page=${page}&limit=${limit}`, 'GET', null, true);
  },

  async log(algorithm, inputData, steps, duration, datasetId = null) {
    if (!getToken()) return null; // Only log when authenticated
    try {
      return await apiRequest('/history', 'POST', {
        algorithm,
        inputData,
        steps,
        duration,
        datasetId,
      }, true);
    } catch (e) {
      console.warn('Simulation history logging failed:', e.message);
      return null;
    }
  },

  async delete(id) {
    return apiRequest(`/history/${id}`, 'DELETE', null, true);
  },

  async clear() {
    return apiRequest('/history', 'DELETE', null, true);
  },
};

