import api, { tokenStorage } from './api';

function extractError(err) {
  if (err && err.response) {
    const detail = err.response.data;
    const message =
      (typeof detail === 'string' && detail) ||
      (detail?.detail && typeof detail.detail === 'string' ? detail.detail : null) ||
      (detail?.message && typeof detail.message === 'string' ? detail.message : null) ||
      (Array.isArray(detail?.detail) && detail.detail[0]?.msg) ||
      err.message || 'Something went wrong.';
    return { message, status: err.response.status };
  }
  return { message: 'An unexpected error occurred.', status: null };
}

async function register(payload) {
  try {
    const { data } = await api.post('/auth/register', payload);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: extractError(err).message };
  }
}

async function login(payload) {
  try {
    const { data } = await api.post('/auth/login', {
      email: payload.email,
      password: payload.password,
      role: payload.role,
    });
    // Save JWT token and user info to localStorage
    tokenStorage.setToken(data.access_token);
    tokenStorage.setRole(data.user?.role ?? payload.role);
    tokenStorage.setUser(data.user ?? {});
    return { data, error: null };
  } catch (err) {
    return { data: null, error: extractError(err).message };
  }
}

// Matches backend: POST /auth/verify-otp  { email, otp }
async function verifyOtp(email, otp) {
  try {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: extractError(err).message };
  }
}

// Matches backend: POST /auth/resend-otp  { email }
async function resendOtp(email) {
  try {
    const { data } = await api.post('/auth/resend-otp', { email });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: extractError(err).message };
  }
}

// Matches backend: POST /auth/forgot-password  { email }
async function forgotPassword(email) {
  try {
    const { data } = await api.post('/auth/forgot-password', { email });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: extractError(err).message };
  }
}

// Matches backend: POST /auth/reset-password  { token, new_password }
async function resetPassword(token, newPassword) {
  try {
    const { data } = await api.post('/auth/reset-password', { token, new_password: newPassword });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: extractError(err).message };
  }
}

function logout() {
  tokenStorage.clearAll();
}

function getCurrentUser() {
  return tokenStorage.getUser();
}

function isAuthenticated() {
  return !!tokenStorage.getToken();
}

const authService = {
  register, login, verifyOtp, resendOtp,
  forgotPassword, resetPassword, logout,
  getCurrentUser, isAuthenticated,
};
export default authService;
