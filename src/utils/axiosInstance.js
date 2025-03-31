import axios from 'axios';

// Create a custom event for session timeout
export const SESSION_TIMEOUT_EVENT = 'sessionTimeout';
export const triggerSessionTimeout = () => {
  window.dispatchEvent(new Event(SESSION_TIMEOUT_EVENT));
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      // Clear user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Trigger session timeout event
      triggerSessionTimeout();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 