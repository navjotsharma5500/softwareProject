import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { publicApi } from '../utils/api';
import { CATEGORIES, LOCATIONS, TIME_PERIODS, CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import DarkModeToggle from '../components/DarkModeToggle';

const Home = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'claimed'
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    timePeriod: '',
    search: '',
    page: 1,
    limit: 12
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Remove empty filters and add status based on active tab
      const params = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      }, {});
      
      // Add isClaimed filter based on active tab
      params.isClaimed = activeTab === 'claimed';
      
      const response = await publicApi.getItems(params);
      setItems(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load items');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to page 1 when filters change
    }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters(prev => ({ ...prev, page: 1 })); // Reset to page 1 when tab changes
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchItems();
      toast.success('Items refreshed!');
    } catch {
      toast.error('Failed to refresh items');
    } finally {
      setRefreshing(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      timePeriod: '',
      search: '',
      page: 1,
      limit: 12
    });
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-8">
        {/* Dark Mode Toggle */}
        <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Thapar Institute
            </span>
            <br />Lost & Found
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Find your lost items or help others reunite with theirs
          </motion.p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className={`inline-flex rounded-xl p-1 ${
            darkMode ? 'bg-slate-800' : 'bg-gray-200'
          }`}>
            <button
              onClick={() => handleTabChange('available')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'available'
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                  : darkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Available Items
            </button>
            <button
              onClick={() => handleTabChange('claimed')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'claimed'
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                  : darkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Claimed Items
            </button>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-3 rounded-xl font-semibold transition-all ${
              darkMode
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-white text-gray-900 hover:bg-gray-50'
            } border ${darkMode ? 'border-slate-700' : 'border-gray-200'} ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Refresh items"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
              <input
                type="text"
                placeholder="Search items..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
              />
            </div>
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 ${
                darkMode
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-white text-gray-900 hover:bg-gray-50'
              } border ${darkMode ? 'border-slate-700' : 'border-gray-200'} transition-all`}
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
              className={`p-6 rounded-xl ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              } border`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {CATEGORY_DISPLAY_NAMES[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Location
                  </label>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  >
                    <option value="">All Locations</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Time Period Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Time Period
                  </label>
                  <select
                    value={filters.timePeriod}
                    onChange={(e) => handleFilterChange('timePeriod', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  >
                    <option value="">All Time</option>
                    {TIME_PERIODS.map(period => (
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
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results Count */}
        <div className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Found <span className="font-semibold">{pagination.total}</span> items
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Items Grid */}
        {!loading && items.length > 0 && (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {items.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => navigate(`/item/${item._id}`)}
                className={`group ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                } rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border cursor-pointer`}
              >
                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-indigo-600 transition-colors`}>
                      {item.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.isClaimed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.isClaimed ? 'Claimed' : 'Available'}
                    </span>
                  </div>

                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                    darkMode ? 'bg-slate-700 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {CATEGORY_DISPLAY_NAMES[item.category] || item.category}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item.foundLocation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Found: {new Date(item.dateFound).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all">
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <p className="text-2xl font-semibold mb-2">No items found</p>
            <p>Try adjusting your filters or search terms</p>
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={!pagination.hasPrev}
              className={`px-4 py-2 rounded-lg font-medium ${
                pagination.hasPrev
                  ? darkMode
                    ? 'bg-slate-800 text-white hover:bg-slate-700'
                    : 'bg-white text-gray-900 hover:bg-gray-50'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } transition-all`}
            >
              Previous
            </button>
            
            <span className={`px-4 py-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Page {filters.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={!pagination.hasNext}
              className={`px-4 py-2 rounded-lg font-medium ${
                pagination.hasNext
                  ? darkMode
                    ? 'bg-slate-800 text-white hover:bg-slate-700'
                    : 'bg-white text-gray-900 hover:bg-gray-50'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } transition-all`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;