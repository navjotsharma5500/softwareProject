import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, RefreshCw, User, Ban, CheckCircle, ExternalLink, Shield, SlidersHorizontal } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';
import { adminApi } from '../utils/api';
import Pagination from '../components/admin/Pagination';

const LIMIT = 20;

function AdminUserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');       // '' | 'active' | 'blacklisted'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name_asc' | 'name_desc'
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null); // user pending blacklist confirmation

  const searchTimeoutRef = useRef(null);
  const lastRefreshTime = useRef(0);
  const [refreshCooldown, setRefreshCooldown] = useState(false);

  const fetchUsers = useCallback(async (currentPage, currentSearch, currentFilter, currentSortBy, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = { page: currentPage, limit: LIMIT, sortBy: currentSortBy };
      if (currentSearch) params.search = currentSearch;
      if (currentFilter) params.filter = currentFilter;
      const res = await adminApi.getUsers(params);
      setUsers(res.data.users || []);
      setMeta(res.data.pagination || { total: 0, totalPages: 1, hasNext: false, hasPrev: false });
      if (isRefresh) toast.success('Users refreshed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, search, filter, sortBy);
  }, [page, search, filter, sortBy, fetchUsers]);

  const handleSearchChange = (value) => {
    setSearchInput(value);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      setSearch(value.trim());
    }, 400);
  };

  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < 5000) {
      toast.info('Please wait before refreshing again');
      return;
    }
    lastRefreshTime.current = now;
    setRefreshCooldown(true);
    setTimeout(() => setRefreshCooldown(false), 5000);
    fetchUsers(page, search, filter, sortBy, true);
  };

  const handleToggleBlacklist = (user) => {
    // Unblacklisting: do it immediately; blacklisting: require confirmation
    if (!user.isBlacklisted) {
      setConfirmUser(user);
      return;
    }
    executeToggle(user);
  };

  const executeToggle = async (user) => {
    setConfirmUser(null);
    if (togglingId) return;
    setTogglingId(user._id);
    try {
      const res = await adminApi.toggleBlacklist(user._id);
      toast.success(res.data.message);
      // Update local state instead of refetching
      setUsers(prev =>
        prev.map(u => u._id === user._id ? { ...u, isBlacklisted: res.data.isBlacklisted } : u)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update blacklist status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gray-50">

      {/* Blacklist Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmUser}
        title="Blacklist User?"
        subtitle="This action can be reversed later."
        description="Blacklisted users cannot log in or perform any actions on the platform."
        confirmLabel="Yes, Blacklist"
        confirmIcon={Ban}
        onConfirm={() => executeToggle(confirmUser)}
        onCancel={() => setConfirmUser(null)}
      >
        {confirmUser && (
          <>
            <p className="text-sm text-gray-700 mb-1">You are about to blacklist:</p>
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 border border-gray-200">
              <p className="font-semibold text-gray-900">{confirmUser.name}</p>
              <p className="text-sm text-gray-500">{confirmUser.email}</p>
            </div>
          </>
        )}
      </ConfirmModal>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Admin</span>
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8" />
              User Management
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Search users, view their activity, and manage blacklist status.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || refreshCooldown}
            className={`p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all ${refreshing || refreshCooldown ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or roll number..."
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={15} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 mr-1">Status:</span>
              {[
                { label: 'All', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Blacklisted', value: 'blacklisted' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFilter(opt.value); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === opt.value
                      ? opt.value === 'blacklisted'
                        ? 'bg-red-600 text-white'
                        : opt.value === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="text-sm text-gray-500">Sort:</span>
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1); }}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name_asc">Name A → Z</option>
                <option value="name_desc">Name Z → A</option>
              </select>
            </div>
          </div>

          {/* Active filter chips / clear */}
          {(search || filter) && (
            <div className="flex items-center gap-2 flex-wrap">
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                  Search: "{search}"
                  <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="ml-1 hover:text-red-600">✕</button>
                </span>
              )}
              {filter && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                  filter === 'blacklisted' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {filter === 'blacklisted' ? 'Blacklisted only' : 'Active only'}
                  <button onClick={() => { setFilter(''); setPage(1); }} className="ml-1 hover:opacity-70">✕</button>
                </span>
              )}
              <button
                onClick={() => { setSearchInput(''); setSearch(''); setFilter(''); setPage(1); }}
                className="text-xs text-gray-400 hover:text-gray-700 underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Users {meta.total > 0 ? `(${meta.total})` : ''}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="text-gray-500 text-lg">
                {search ? 'No users match your search' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <div
                  key={user._id}
                  className={`border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-shadow hover:shadow-sm ${
                    user.isBlacklisted ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  {/* User Info */}
                  <div className="flex items-start gap-3">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{user.name}</span>
                        {user.isBlacklisted && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Ban size={11} /> Blacklisted
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => navigate(`/admin/user/${user._id}`, { state: { userName: user.name, fromTab: 'users' } })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                    >
                      <ExternalLink size={15} />
                      View Activity
                    </button>
                    <button
                      onClick={() => handleToggleBlacklist(user)}
                      disabled={togglingId === user._id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                        user.isBlacklisted
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      } ${togglingId === user._id ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {togglingId === user._id ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : user.isBlacklisted ? (
                        <CheckCircle size={15} />
                      ) : (
                        <Ban size={15} />
                      )}
                      {togglingId === user._id
                        ? 'Updating...'
                        : user.isBlacklisted
                        ? 'Unblacklist'
                        : 'Blacklist'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && users.length > 0 && (
            <Pagination
              page={page}
              pagination={meta}
              onPrev={() => setPage(p => p - 1)}
              onNext={() => setPage(p => p + 1)}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminUserManagement;
