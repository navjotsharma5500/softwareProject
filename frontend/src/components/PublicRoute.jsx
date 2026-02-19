import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PublicRoute - Wrapper for login/signup pages
 * Prevents authenticated users from accessing these pages
 * Redirects logged-in users to home or admin dashboard
 */
export const PublicRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user) {
    // User is already logged in
    // Always redirect away from login/signup pages
    // Get the intended destination from state, or default based on role
    const from = location.state?.from?.pathname;
    // Prevent redirecting back to login
    const forbiddenPaths = ['/login'];
    if (from && !forbiddenPaths.includes(from)) {
      return <Navigate to={from} replace />;
    }
    // Otherwise, admins go to admin dashboard, regular users go home
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  }

  // User is not logged in, show the login/signup page
  return children;
};
