/**
 * @file AuthContext.jsx
 * @description Global authentication state provider.
 *
 * On mount, reads a JWT from `localStorage.token` and validates it by
 * hitting `GET /auth/profile`. While this check is in flight the `loading`
 * flag is `true`; a full-screen {@link LoadingSpinner} is rendered to
 * prevent route flicker.
 *
 * Context value shape:
 * ```ts
 * {
 *   user: UserDocument | null;
 *   loading: boolean;
 *   logout: () => Promise<void>;
 *   isAuthenticated: boolean;
 *   isAdmin: boolean;
 * }
 * ```
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const AuthContext = createContext(null);

/**
 * Provides authentication state to all descendant components.
 *
 * @component
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount: restore session from stored JWT
  // ─ Deps: [] (run once). Cleanup: none needed (Axios is stateless).
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Validates the stored JWT by fetching the user profile from the API.
   * Sets `user` on success, removes the token and sets `user = null` on failure.
   * Always sets `loading = false` when complete.
   *
   * @async
   * @returns {Promise<void>}
   */
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  /**
   * Logs the user out by calling `POST /auth/logout`, removing the stored
   * token, clearing user state, and navigating to the home page.
   *
   * @async
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    }
  };

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false
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
// pls fix this error Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components.eslint(react-refresh/only-export-components)