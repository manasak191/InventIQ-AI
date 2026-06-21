/**
 * api.js — Central Axios instance with JWT interceptors
 */
import axios from 'axios';

export const BASE_URL = 'http://127.0.0.1:8000';

const TOKEN_KEY = 'inventiq_token';
const ROLE_KEY  = 'inventiq_role';
const USER_KEY  = 'inventiq_user';

export const tokenStorage = {
  getToken   : ()        => localStorage.getItem(TOKEN_KEY),
  setToken   : (t)       => localStorage.setItem(TOKEN_KEY, t),
  removeToken: ()        => localStorage.removeItem(TOKEN_KEY),

  getRole    : ()        => localStorage.getItem(ROLE_KEY),
  setRole    : (r)       => localStorage.setItem(ROLE_KEY, r),
  removeRole : ()        => localStorage.removeItem(ROLE_KEY),

  getUser    : ()        => { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; },
  setUser    : (u)       => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  removeUser : ()        => localStorage.removeItem(USER_KEY),

  clearAll   : ()        => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

const api = axios.create({
  baseURL : BASE_URL,
  timeout : 15000,
  headers : { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clearAll();
      window.dispatchEvent(new CustomEvent('inventiq:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default api;
