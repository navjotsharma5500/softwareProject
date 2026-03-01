import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, RefreshCw, FileText, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { CATEGORIES, CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import Pagination from '../components/admin/Pagination';
import EmptyState from '../components/EmptyState';

const LIMIT = 30;

const STATUS_STYLES = {
  active:   'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed:   'bg-gray-100 text-gray-700',
};

const defaultFilters = {
  search: '',
  category: '',
  status: '',
  startDate: '',
  endDate: '',
};

function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  const searchTimeoutRef = useRef(null);

  const lastRefreshTime = useRef(0);
  const [refreshCooldown, setRefreshCooldown] = useState(false);

  const fetchReports = useCallback(async (currentPage, currentFilters) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: LIMIT,
        ...(currentFilters.search   && { search:    currentFilters.search }),
        ...(currentFilters.category && { category:  currentFilters.category }),
        ...(currentFilters.status   && { status:    currentFilters.status }),
        ...(currentFilters.startDate && { startDate: currentFilters.startDate }),
        ...(currentFilters.endDate   && { endDate:   currentFilters.endDate }),
      };
      const res = await api.get('/admin/reports', { params });
      setReports(res.data.reports || []);
      setMeta(res.data.pagination || { total: 0, totalPages: 1, hasNext: false, hasPrev: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(page, filters);
  }, [page, filters, fetchReports]);

  // Sync searchInput with filters.search on external changes
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setPage(1);
    }, 300);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setSearchInput('');
    setPage(1);
  };

  const handleRefresh = async () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < 2000) {
      toast.warning('Please wait before refreshing again');
      return;
    }
    lastRefreshTime.current = now;
    setRefreshCooldown(true);
    setRefreshing(true);
    try {
      await fetchReports(page, filters);
      toast.success('Reports refreshed!');
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshCooldown(false), 2000);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Admin</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-8 h-8 text-gray-800" />
            <h1 className="text-3xl font-bold text-gray-900">All Submitted Reports</h1>
          </div>
          <p className="text-gray-600 ml-11">Browse and review all lost item reports submitted by users.</p>
        </div>

        {/* Main Card */}
        <div className="rounded-xl shadow-md p-6 bg-white">

          {/* Filter toggle header */}
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Filter size={14} /> Filters
            </h3>
            <button
              onClick={() => setShowFilters(prev => !prev)}
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
                    placeholder="Search by name, description, location…"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_DISPLAY_NAMES[cat] || cat}</option>
                  ))}
                </select>

                {/* Status */}
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
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
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date Lost — To</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-lg font-semibold transition-all bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Table header with count + refresh */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Reports {meta.total ? <span className="text-gray-500 font-normal text-base">({meta.total})</span> : ''}
            </h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing || refreshCooldown}
              className={`p-2 rounded-lg transition-all bg-gray-100 hover:bg-gray-200 text-gray-700 ${
                refreshing || refreshCooldown ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Refresh"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              iconClassName="mx-auto text-gray-300 mb-3"
              title="No reports found"
              subtitle="Try adjusting your filters"
              className="text-center py-16"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-10">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Reporter</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date Lost</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Submitted</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((r, idx) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 tabular-nums">
                        {(page - 1) * LIMIT + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{r.user?.name || '—'}</p>
                        <p className="text-xs text-gray-500">{r.user?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                        <span className="line-clamp-2">{r.itemDescription}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {CATEGORY_DISPLAY_NAMES[r.category] || r.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{r.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {r.dateLost ? new Date(r.dateLost).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/admin/report/${r._id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ml-auto"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && reports.length > 0 && (
            <Pagination
              page={page}
              pagination={meta}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
