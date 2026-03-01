import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { CATEGORY_DISPLAY_NAMES } from '../../utils/constants';

const ItemsView = ({ items, viewMode, onNavigate }) => {
  const itemsContainerRef = useRef(null);

  return (
    <motion.div
      ref={itemsContainerRef}
      layout
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'
          : 'space-y-4 mb-12'
      }
    >
      {items.map((item, index) =>
        viewMode === 'grid' ? (
          // Grid View
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => !item.isClaimed && onNavigate(item._id)}
            className={`group bg-white border-gray-200 rounded-xl shadow-md transition-all duration-300 overflow-hidden border ${
              item.isClaimed ? 'opacity-75' : 'hover:shadow-xl cursor-pointer'
            }`}
          >
            {/* Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                  {item.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.isClaimed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.isClaimed ? 'Claimed' : 'Available'}
                </span>
              </div>

              <div className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 bg-gray-100 text-gray-800">
                {CATEGORY_DISPLAY_NAMES[item.category] || item.category}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">{item.foundLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Found:{' '}
                    {new Date(item.dateFound).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Show claimant info for claimed items to increase credibility */}
              {item.isClaimed && item.owner ? (
                <div className="mb-4 text-sm text-gray-700">
                  <span className="font-medium">Claimed by:</span>{' '}
                  <span className="font-semibold">{item.owner.name}</span>
                  {item.owner.rollNo ? (
                    <span className="ml-2 text-xs text-gray-500">
                      (Roll/Email: {item.owner.rollNo})
                    </span>
                  ) : null}
                </div>
              ) : null}

              {/* Only show View Details button for available items */}
              {!item.isClaimed && (
                <button className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all">
                  View Details
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          // List View
          <motion.div
            key={item._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.02 }}
            onClick={() => !item.isClaimed && onNavigate(item._id)}
            className={`group bg-white border-gray-200 rounded-lg shadow-sm transition-all duration-300 border ${
              item.isClaimed ? 'opacity-75' : 'hover:shadow-md cursor-pointer'
            }`}
          >
            <div
              className={`p-4 flex flex-col md:flex-row md:items-center gap-4 ${
                item.isClaimed && item.owner ? 'md:justify-between' : ''
              }`}
            >
              {/* Left section - Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                    {item.name}
                  </h3>
                  <span
                    className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${
                      item.isClaimed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.isClaimed ? 'Claimed' : 'Available'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-800">
                    {CATEGORY_DISPLAY_NAMES[item.category] || item.category}
                  </span>

                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">{item.foundLocation}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">
                      {new Date(item.dateFound).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Show claimant in list view */}
                  {item.isClaimed && item.owner && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">By:</span>{' '}
                      <span className="font-semibold">{item.owner.name}</span>
                      {item.owner.rollNo && (
                        <span className="ml-1 text-xs text-gray-500">
                          (Roll/Email: {item.owner.rollNo})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right section - Action button (only for available items) */}
              {!item.isClaimed && (
                <div className="md:flex-shrink-0">
                  <button className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm">
                    View Details
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )
      )}
    </motion.div>
  );
};

export default ItemsView;
