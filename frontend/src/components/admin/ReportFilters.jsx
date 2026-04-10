/**
 * @file ReportFilters.jsx
 * @description Collapsible filter bar for the admin reports list page.
 *
 * @component
 */
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { CATEGORIES, CATEGORY_DISPLAY_NAMES } from '../../utils/constants';

/**
 * Collapsible filter bar for the admin reports list.
 *
 * Separate controlled inputs are provided for text-search, report ID, and
 * reporter name (each with its own raw-value prop) because they are debounced
 * independently in the parent. Selects and date pickers share a single
 * `onFilterChange` handler.
 *
 * @component
 * @param {object}   props
 * @param {boolean}  props.showFilters           - Whether the filter panel is expanded.
 * @param {Function} props.onToggleFilters
 * @param {string}   props.searchInput            - Raw (unthrottled) text-search value.
 * @param {Function} props.onSearchChange
 * @param {string}   props.reportIdInput
 * @param {Function} props.onReportIdChange
 * @param {string}   props.reporterNameInput
 * @param {Function} props.onReporterNameChange
 * @param {{category: string, status: string, startDate: string, endDate: string}} props.filters
 * @param {Function} props.onFilterChange        - Called with a synthetic event from select/date inputs.
 * @param {Function} props.onClearFilters
 * @returns {JSX.Element}
 */
const ReportFilters = ({
  showFilters,
  onToggleFilters,
  searchInput,
  onSearchChange,
  reportIdInput,
  onReportIdChange,
  reporterNameInput,
  onReporterNameChange,
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Filter size={14} /> Filters
        </h3>
        <button
          onClick={onToggleFilters}
          className="text-sm text-gray-600 hover:underline"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by description, location…"
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Report ID */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by Report ID…"
                value={reportIdInput}
                onChange={(e) => onReportIdChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Reporter Name */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by reporter name/email…"
                value={reporterNameInput}
                onChange={(e) => onReporterNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <select
              name="category"
              value={filters.category}
              onChange={onFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_DISPLAY_NAMES[cat] || cat}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              name="status"
              value={filters.status}
              onChange={onFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Date range row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date Lost — From</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={onFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date Lost — To</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={onFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 rounded-lg font-semibold transition-all bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportFilters;
