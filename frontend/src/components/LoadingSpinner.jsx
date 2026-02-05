import React from 'react';

const LoadingSpinner = ({ showColdStartMessage = false, message = "Loading..." }) => {
  return (
    <div className="flex flex-col justify-center items-center py-20">
      <div className="mb-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
      </div>
      <p className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {message}
      </p>
      {showColdStartMessage && (
        <>
          <p className="text-gray-600 dark:text-gray-300 text-sm max-w-md text-center mb-1">
            Cold starting server... This might take up to 20-30 seconds
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            (Free service - Thanks for your patience! 🙏)
          </p>
        </>
      )}
    </div>
  );
};

export default LoadingSpinner;
