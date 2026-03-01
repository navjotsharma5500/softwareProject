import React from 'react';

const Pagination = ({ page, pagination, onPrev, onNext }) => {
  return (
    <div className="mt-6 flex justify-between items-center">
      <div className="text-sm text-gray-600">
        Page {page} of {pagination.totalPages || Math.ceil((pagination.total || 0) / 10)}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={!pagination.hasPrev}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            pagination.hasPrev
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!pagination.hasNext}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            pagination.hasNext
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
