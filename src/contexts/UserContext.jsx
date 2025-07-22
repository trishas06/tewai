import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
        }
      }

      // If no user data but token exists, fetch user info from API
      if (token && !storedUser) {
        try {
          const userInfoResponse = await authService.getUserInfo(token);
          if (userInfoResponse.status === 'success' && userInfoResponse.user) {
            setUser(userInfoResponse.user);
            localStorage.setItem('user', JSON.stringify(userInfoResponse.user));
          } else {
            // Invalid token or user not found, clear token
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to fetch user info on refresh:', error);
          // If API call fails, clear invalid token
          localStorage.removeItem('token');
        }
      }

      setLoading(false);
    };

    initializeUser();
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    updateUser,
    clearUser,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
