import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    // Check for error in URL
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'invalid_email':
          setError('Only @thapar.edu email addresses are allowed. Please use your Thapar University email.');
          break;
        case 'authentication_failed':
          setError('Authentication failed. Please try again.');
          break;
        case 'server_error':
          setError('Server error occurred. Please try again later.');
          break;
        default:
          setError('An error occurred during login. Please try again.');
      }
      
      // Clear error after 5 seconds
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }

    // Check if token is in URL (from OAuth callback)
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Get redirect URL if present
      const redirect = searchParams.get('redirect') || '/';
      // Force a full page reload to trigger AuthContext
      window.location.href = decodeURIComponent(redirect);
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    const redirect = searchParams.get('redirect');
    const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    window.location.href = `${API_URL}/auth/google${redirectParam}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg bg-white">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gray-100">
              <LogIn className="h-12 w-12 text-gray-900" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to Thapar Lost & Found Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all bg-white text-gray-900 hover:bg-gray-50 border-2 border-gray-300"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google (@thapar.edu)
          </button>

          <p className="mt-4 text-xs text-center text-gray-600">
            Only @thapar.edu email accounts are allowed
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
