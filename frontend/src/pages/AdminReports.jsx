import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, FileText, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { CATEGORIES, CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import { useCooldown } from '../hooks/useCooldown';
import ReportFilters from '../components/admin/ReportFilters';
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
  reportId: '',
  reporterName: '',
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

  // Debounced inputs
  const [searchInput, setSearchInput] = useState('');
  const [reportIdInput, setReportIdInput] = useState('');
  const [reporterNameInput, setReporterNameInput] = useState('');
  const searchTimeoutRef = useRef(null);
  const reportIdTimeoutRef = useRef(null);
  const reporterNameTimeoutRef = useRef(null);

  const [refreshCooldown, triggerRefresh] = useCooldown(2000);

  const fetchReports = useCallback(async (currentPage, currentFilters) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: LIMIT,
        ...(currentFilters.search        && { search:       currentFilters.search }),
        ...(currentFilters.category      && { category:     currentFilters.category }),
        ...(currentFilters.status        && { status:       currentFilters.status }),
        ...(currentFilters.startDate     && { startDate:    currentFilters.startDate }),
        ...(currentFilters.endDate       && { endDate:      currentFilters.endDate }),
        ...(currentFilters.reportId      && { reportId:     currentFilters.reportId }),
        ...(currentFilters.reporterName  && { reporterName: currentFilters.reporterName }),
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

  // Sync debounced inputs with filters on external changes
  useEffect(() => { setSearchInput(filters.search || ''); }, [filters.search]);
  useEffect(() => { setReportIdInput(filters.reportId || ''); }, [filters.reportId]);
  useEffect(() => { setReporterNameInput(filters.reporterName || ''); }, [filters.reporterName]);

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

  const handleReportIdChange = (value) => {
    setReportIdInput(value);
    if (reportIdTimeoutRef.current) clearTimeout(reportIdTimeoutRef.current);
    reportIdTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, reportId: value }));
      setPage(1);
    }, 300);
  };

  const handleReporterNameChange = (value) => {
    setReporterNameInput(value);
    if (reporterNameTimeoutRef.current) clearTimeout(reporterNameTimeoutRef.current);
    reporterNameTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, reporterName: value }));
      setPage(1);
    }, 300);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setSearchInput('');
    setReportIdInput('');
    setReporterNameInput('');
    setPage(1);
  };

  const handleRefresh = async () => {
    if (!triggerRefresh()) {
      toast.warning('Please wait before refreshing again');
      return;
    }
    setRefreshing(true);
    try {
      await fetchReports(page, filters);
      toast.success('Reports refreshed!');
    } finally {
      setRefreshing(false);
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

          <ReportFilters
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(prev => !prev)}
            searchInput={searchInput}
            onSearchChange={handleSearchChange}
            reportIdInput={reportIdInput}
            onReportIdChange={handleReportIdChange}
            reporterNameInput={reporterNameInput}
            onReporterNameChange={handleReporterNameChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

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
