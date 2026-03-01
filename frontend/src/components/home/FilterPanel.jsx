import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { CATEGORIES, LOCATIONS, TIME_PERIODS } from '../../utils/constants';

const FilterPanel = ({
  searchInput,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFilterChange,
  onClearFilters,
  clearCooldown,
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search for lost items already handed over to the admin. Click to claim if it's yours."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={onToggleFilters}
          className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 transition-all"
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden p-6 rounded-xl bg-white border-gray-200 border"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Category
              </label>
              <input
                type="text"
                list="home-category-options"
                value={filters.category}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                placeholder="All Categories"
              />
              <datalist id="home-category-options">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Location
              </label>
              <input
                type="text"
                list="home-location-options"
                value={filters.location}
                onChange={(e) => onFilterChange('location', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                placeholder="All Locations"
              />
              <datalist id="home-location-options">
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            {/* Time Period Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Time Period
              </label>
              <select
                value={filters.timePeriod}
                onChange={(e) => onFilterChange('timePeriod', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="">All Time</option>
                {TIME_PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClearFilters}
              disabled={clearCooldown}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                clearCooldown
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : 'text-red-600 hover:text-red-700'
              }`}
            >
              <X size={16} />
              {clearCooldown ? 'Please wait...' : 'Clear Filters'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FilterPanel;
