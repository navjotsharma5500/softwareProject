/**
 * @file AuthContext.jsx
 * @description Global authentication state provider.
 *
 * Uses COOKIE-BASED auth instead of localStorage tokens.
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Always send cookies globally
  axios.defaults.withCredentials = true;

  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated via session-based auth.
   * Calls /auth/profile and checks for session (connect.sid cookie).
   */
  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        withCredentials: true,
      });
      setUser(response.data.user || null);
    } catch (error) {
      // 401 means not authenticated - this is expected on initial load
      if (error.response?.status === 401) {
        setUser(null);
      } else {
        console.error('Auth check failed:', error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout: calls /auth/logout and clears frontend state.
   * Backend clears session and connect.sid cookie.
   */
  const logout = async () => {
    try {
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};