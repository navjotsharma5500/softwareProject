/**
 * @file ItemFilters.jsx
 * @description Collapsible filter bar for the admin items tab.
 *
 * @component
 */
import React from 'react';
import { Search } from 'lucide-react';
import { CATEGORIES, LOCATIONS } from '../../utils/constants';

/**
 * Collapsible filter bar for the admin items tab.
 *
 * @component
 * @param {object}   props
 * @param {boolean}  props.showItemFilters   - Whether the filter row is expanded.
 * @param {Function} props.onToggle          - Toggles the filter panel.
 * @param {string}   props.itemSearchInput   - Raw (unthrottled) search value.
 * @param {Function} props.onSearchChange    - Called with each new input value.
 * @param {{category: string, location: string, status: string}} props.itemFilters
 * @param {Function} props.onFilterChange    - Called with `(key, value)` on select change.
 * @param {Function} props.onClearFilters    - Resets all filters.
 * @returns {JSX.Element}
 */
const ItemFilters = ({
  showItemFilters,
  onToggle,
  itemSearchInput,
  onSearchChange,
  itemFilters,
  onFilterChange,
  onClearFilters,
}) => {
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        <button
          onClick={onToggle}
          className="text-sm text-gray-900 hover:underline"
        >
          {showItemFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showItemFilters && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search items..."
                value={itemSearchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
              />
            </div>

            <input
              type="text"
              list="filter-category-options"
              value={itemFilters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
              placeholder="All Categories"
            />
            <datalist id="filter-category-options">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>

            <input
              type="text"
              list="filter-location-options"
              value={itemFilters.location}
              onChange={(e) => onFilterChange('location', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
              placeholder="All Locations"
            />
            <datalist id="filter-location-options">
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>

            <select
              value={itemFilters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>

          <button
            onClick={onClearFilters}
            className="px-4 py-2 rounded-lg font-semibold transition-all bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Clear Filters
          </button>
        </div>
      )}
    </>
  );
};

export default ItemFilters;
