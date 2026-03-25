// frontend/src/api/axios.js
import axios from 'axios';

// Use runtime environment variable when provided, otherwise fall back to same-origin '/api'.
// When building for production set REACT_APP_API_URL to the backend root (e.g. https://api.yourdomain.com)
const apiRoot = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiRoot,
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    // Check localStorage first, then sessionStorage
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid/expired — clear stored auth and emit an event
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('role');
      sessionStorage.removeItem('role');
      try {
        window.dispatchEvent(
          new CustomEvent('api:unauthorized', { detail: error.response })
        );
      } catch (evtErr) {
        console.warn('Failed to dispatch api:unauthorized event', evtErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
