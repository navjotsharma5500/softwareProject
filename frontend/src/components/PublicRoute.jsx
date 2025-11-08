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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user) {
    // User is already logged in
    // Get the intended destination from state, or default based on role
    const from = location.state?.from?.pathname;
    
    if (from) {
      // If there's a saved intended destination, go there
      return <Navigate to={from} replace />;
    }
    
    // Otherwise, admins go to admin dashboard, regular users go home
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  }

  // User is not logged in, show the login/signup page
  return children;
};
