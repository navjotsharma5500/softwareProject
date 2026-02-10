import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <div className="mb-8">
          <h1 className="text-9xl font-extrabold text-gray-900 animate-pulse">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative text-gray-300">
            <svg 
              className="w-48 h-48" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            {/* Search icon overlay */}
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-3 shadow-lg">
              <svg 
                className="w-12 h-12 text-gray-900"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Page Not Found
          </h2>
          <p className="text-lg mb-2 text-gray-600">
            Oops! Looks like this page went missing...
          </p>
          <p className="text-base text-gray-500">
            Just like a lost item, we can't seem to find what you're looking for. But don't worry, we can help you get back on track!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg bg-gray-900 hover:bg-gray-800 text-white"
          >
            🏠 Go Home
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-lg`}
          >
            ← Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className={`mt-12 pt-8 border-t border-gray-200`}>
          <p className={`text-sm mb-4 text-gray-500`}>
            Looking for something? Try these links:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/items')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700`}
            >
              🔍 Browse Found Items
            </button>
            <button
              onClick={() => navigate('/report')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700`}
            >
              📝 Report Lost Item
            </button>
            <button
              onClick={() => navigate('/how-it-works')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700`}
            >
              ℹ️ How It Works
            </button>
          </div>
        </div>

        {/* Fun Message */}
        <div className={`mt-8 text-sm text-gray-400 italic`}>
          <p>💡 Pro tip: Unlike lost items, this page is permanently missing from our system!</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;