/**
 * @file ProtectedRoute.jsx
 * @description Route guard that requires authentication (and optionally admin
 * privileges) before rendering its children.
 *
 * @component
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects a route from unauthenticated or insufficiently privileged access.
 *
 * Behaviour:
 *  - While auth is loading: renders a centred spinner.
 *  - Not logged in: redirects to `/login?redirect=<current path>` so
 *    the user is sent back after authentication.
 *  - Logged in but not admin (when `adminOnly` is `true`): redirects to `/`.
 *  - Otherwise: renders `children`.
 *
 * @component
 * @param {object}  props
 * @param {React.ReactNode} props.children   - The route content to protect.
 * @param {boolean} [props.adminOnly=false]  - When `true`, also requires `isAdmin`.
 * @returns {JSX.Element}
 */
export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with the current path as redirect parameter
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  if (adminOnly && !isAdmin) {
    // User is logged in but not an admin
    return <Navigate to="/" replace />;
  }

  return children;
};
