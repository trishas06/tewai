import axiosInstance from '../utils/axiosInstance';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Create a separate instance for auth-related calls
const authAxios = axiosInstance;

export const authService = {
  getUserInfo: async (token) => {
    try {
      const response = await authAxios.post(
        '/get_user',
        {}, // Empty body for POST request
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Get user info error:', error);
      throw error.response?.data || new Error('Failed to get user info');
    }
  },

  login: async (username, password) => {
    try {
      const response = await authAxios.post('/login', { username, password });
      
      if (response.data.token) {
        // Store token first
        localStorage.setItem('token', response.data.token);
        
        // Fetch user information using the token
        try {
          const userInfoResponse = await authService.getUserInfo(response.data.token);
          if (userInfoResponse.status === 'success' && userInfoResponse.user) {
            // Store complete user information
            const userData = {
              ...userInfoResponse.user,
              token: response.data.token
            };
            localStorage.setItem('user', JSON.stringify(userData));
            return userData;
          } else {
            throw new Error('Invalid user data received');
          }
        } catch (userInfoError) {
          console.error('Failed to fetch user info after login:', userInfoError);
          // Fallback to basic user info if get_user fails
          const fallbackUser = {
            username: username,
            role: response.data.role || 'User',
            token: response.data.token
          };
          localStorage.setItem('user', JSON.stringify(fallbackUser));
          return fallbackUser;
        }
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial authentication data on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error.response?.data || new Error('Failed to login');
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService; 