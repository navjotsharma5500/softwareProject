import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Mail, IdCard, Package, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Edit2, Save, X, Phone, FileText, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { userApi, reportApi } from '../utils/api';
import { CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import useFormPersistence from '../hooks/useFormPersistence.jsx';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageLightbox from '../components/ImageLightbox';
import { useSearchParams } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profileData, setProfileData] = useState(null);
  const [claims, setClaims] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingClaim, setDeletingClaim] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSavingRef = useRef(false);
  const isDeletingClaimRef = useRef(false);
  const isDeletingReportRef = useRef(false);

  const lastRefreshTime = useRef(0);
  const [refreshCooldown, setRefreshCooldown] = useState(false);

  const initialSection = searchParams.get('section') === 'reports' ? 'reports' : 'claims';
  const [activeSection, setActiveSection] = useState(initialSection);

  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // FIX: isInitialLoad is now reset to true whenever the active section
  // changes, so the cold-start spinner message shows correctly on each
  // first load of a tab, not just the very first page load.
  const isInitialLoad = useRef(true);

  const [formData, setFormData, formControls] = useFormPersistence('profile_form', {
    rollNo: '',
    phone: '',
  });

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : (window.location.href = '/');
  };

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [page, setPage] = useState(1);

  // FIX: Wrapped in useCallback so it has a stable reference and can be
  // safely listed as a dependency in useEffect without causing infinite loops.
  const fetchProfile = useCallback(async () => {
    try {
      const response = await userApi.getProfile();
      setProfileData(response.data.user);
      const fetched = response.data.user;
      formControls.replaceIfEmpty({
        rollNo: fetched.rollNo && fetched.rollNo !== '0' ? fetched.rollNo : '',
        phone: fetched.phone || '',
      });
    } catch (error) {
      toast.error('Failed to load profile');
      console.error(error);
    }
    // formControls is stable (from a custom hook), safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIX: Wrapped in useCallback with `page` as a dependency.
  // Previously this closed over a stale `page` value because it was defined
  // as a plain async function inside the component. If `page` changed between
  // renders, the fetch would silently use the old value.
  const fetchMyClaims = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userApi.getMyClaims({ page, limit: 10 });
      setClaims(response.data.claims);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load claims');
      console.error(error);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [page]);

  // FIX: Same useCallback treatment as fetchMyClaims.
  const fetchMyReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportApi.getMyReports({ page, limit: 10 });
      setReports(response.data.reports);
      setPagination(
        response.data.pagination || {
          total: response.data.reports.length,
          totalPages: response.data.totalPages,
          hasNext: response.data.hasNext,
          hasPrev: response.data.hasPrev,
        }
      );
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [page]);

  // FIX: Removed the eslint-disable suppression. Now that fetch functions are
  // stable useCallbacks, they can be properly listed as dependencies.
  // This effect correctly re-runs when page, activeSection, or fetch
  // functions change (fetch functions only change when `page` changes).
  useEffect(() => {
    fetchProfile();

    if (searchParams.get('section')) {
      setSearchParams({}, { replace: true });
    }

    // FIX: Reset isInitialLoad so the cold-start spinner shows on each
    // section's first load, not only the very first render.
    isInitialLoad.current = true;

    if (activeSection === 'claims') {
      fetchMyClaims();
    } else {
      fetchMyReports();
    }
  }, [page, activeSection, fetchMyClaims, fetchMyReports, fetchProfile, searchParams, setSearchParams]);

  const handleRefresh = async () => {
    const now = Date.now();
    const REFRESH_COOLDOWN = 2000;

    if (now - lastRefreshTime.current < REFRESH_COOLDOWN) {
      toast.warning('Please wait before refreshing again');
      return;
    }

    lastRefreshTime.current = now;
    setRefreshCooldown(true);
    setRefreshing(true);

    try {
      await fetchProfile();
      if (activeSection === 'claims') {
        await fetchMyClaims();
      } else {
        await fetchMyReports();
      }
      toast.success('Refreshed successfully!');
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshCooldown(false), REFRESH_COOLDOWN);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (isSavingRef.current || saving) {
      console.log('Duplicate save blocked');
      return;
    }

    isSavingRef.current = true;
    setSaving(true);
    try {
      if (formData.rollNo && formData.rollNo.toString().trim() !== '') {
        const rollNoStr = formData.rollNo.toString().trim();
        if (!/^\d{9}$/.test(rollNoStr)) {
          toast.error(
            `Roll number must be exactly 9 digits long. You entered ${rollNoStr.length} digits.`
          );
          return;
        }
      }

      if (formData.phone && formData.phone.trim() !== '') {
        const phoneStr = formData.phone.trim();
        if (!/^\d{10}$/.test(phoneStr)) {
          toast.error(
            `Phone number must be exactly 10 digits long. You entered ${phoneStr.length} digits.`
          );
          return;
        }
      }

      const payload = { ...formData };
      if (payload.rollNo !== undefined && payload.rollNo !== '') {
        payload.rollNo = payload.rollNo.toString().trim();
      }
      if (payload.phone !== undefined && payload.phone !== '') {
        payload.phone = payload.phone.toString().trim();
      }

      await userApi.updateProfile(payload);
      await fetchProfile();
      setEditing(false);
      formControls.clear();
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Update profile error:', error);

      const errorMsg = error.response?.data?.message || '';

      if (errorMsg.includes('Roll number')) {
        toast.error(errorMsg);
      } else if (errorMsg.includes('phone') || errorMsg.includes('Phone')) {
        toast.error(errorMsg);
      } else if (errorMsg.includes('name') || errorMsg.includes('Name')) {
        toast.error(errorMsg);
      } else if (error.response?.status === 413) {
        toast.error('Data too large. Please reduce the length of your inputs.');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(
          errorMsg || 'Failed to update profile. Please check your input and try again.'
        );
      }
    } finally {
      // FIX: Always reset refs/state in finally, not inside early-return
      // branches. The original code had isSavingRef.current = false inside the
      // validation if-blocks, which was correct but redundant — the finally
      // block handles it cleanly for all paths.
      isSavingRef.current = false;
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      rollNo:
        profileData.rollNo && profileData.rollNo !== '0' ? profileData.rollNo : '',
      phone: profileData.phone || '',
    });
    setEditing(false);
  };

  const handleRemoveClaim = async (claimId, itemName) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove your claim for "${itemName}"?`
    );
    if (!confirmed) return;

    if (isDeletingClaimRef.current || deletingClaim === claimId) {
      console.log('Duplicate claim deletion blocked');
      return;
    }

    isDeletingClaimRef.current = true;
    setDeletingClaim(claimId);
    try {
      await userApi.deleteClaim(claimId);
      toast.success('Claim removed successfully!');

      // FIX: Always await the re-fetch so state is guaranteed to be fresh
      // before the loading spinner disappears. The original code called
      // fetchMyClaims() without await, meaning the component could finish
      // rendering the "removed" optimistic state before the list was actually
      // refreshed, causing a brief flash of the old claim.
      // Also removed the `if (activeSection === 'claims')` guard — if this
      // function is called, we are always on the claims tab by definition
      // (the button is only rendered there), so the guard was dead code.
      await fetchMyClaims();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove claim';
      toast.error(message);
    } finally {
      isDeletingClaimRef.current = false;
      setDeletingClaim(null);
    }
  };

  const handleRemoveReport = async (reportId, itemName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete your report for "${itemName}"?`
    );
    if (!confirmed) return;

    if (isDeletingReportRef.current || deletingReport === reportId) {
      console.log('Duplicate report deletion blocked');
      return;
    }

    isDeletingReportRef.current = true;
    setDeletingReport(reportId);
    try {
      await reportApi.deleteReport(reportId);
      toast.success('Report deleted successfully!');

      // FIX: Same as handleRemoveClaim — await the re-fetch so the list
      // is guaranteed to be up-to-date when the spinner clears. Without
      // await, a slow network response could show the deleted report for
      // a brief moment after the "success" toast fires.
      await fetchMyReports();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete report';
      toast.error(message);
    } finally {
      isDeletingReportRef.current = false;
      setDeletingReport(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle size={14} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle size={14} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <AlertCircle size={14} />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        {/* Profile Header */}
        <div className="rounded-2xl shadow-lg p-4 sm:p-8 mb-8 bg-white overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6">
            {profileData?.profilePicture ? (
              <img
                src={profileData.profilePicture}
                alt={profileData.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 shadow-lg flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <User className="text-white" size={48} />
              </div>
            )}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="min-w-0 w-full sm:w-auto">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 break-words">
                    {profileData?.name || user?.name}
                  </h1>
                  <p className="text-sm text-gray-600 break-all">
                    {profileData?.email || user?.email}
                  </p>
                  {user?.isAdmin && (
                    <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-semibold text-sm">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
                    >
                      <Edit2 size={18} />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                      >
                        <Save size={18} />
                        <span>{saving ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                      >
                        <X size={18} />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                <User size={18} />
                Full Name
              </label>
              <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900 break-words">
                {profileData?.name || user?.name}
                <span className="ml-2 text-xs text-gray-400">(Cannot be changed)</span>
              </p>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                <Mail size={18} />
                Email Address
              </label>
              <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-600 break-all">
                {profileData?.email || user?.email}
                <span className="ml-2 text-xs">(Cannot be changed)</span>
              </p>
            </div>

            {/* Roll Number */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                <IdCard size={18} />
                Roll Number/Email
              </label>
              {editing ? (
                <div>
                  <input
                    type="text"
                    name="rollNo"
                    value={formData.rollNo || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData((prev) => ({ ...prev, rollNo: value }));
                    }}
                    placeholder="Enter 9 digit roll number (e.g., 102303737)"
                    maxLength="9"
                    className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
                  />
                  {formData.rollNo && (
                    <p
                      className={`text-xs mt-1 ${
                        formData.rollNo.length === 9 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formData.rollNo.length} / 9 digits
                    </p>
                  )}
                </div>
              ) : (
                <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900 break-all">
                  {profileData?.rollNo && profileData.rollNo !== '0'
                    ? profileData.rollNo
                    : 'Not provided'}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                <Phone size={18} />
                Phone Number (Optional)
              </label>
              {editing ? (
                <div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData((prev) => ({ ...prev, phone: value }));
                    }}
                    placeholder="Enter 10 digit phone number (e.g., 9876543210)"
                    maxLength="10"
                    className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
                  />
                  {formData.phone && (
                    <p
                      className={`text-xs mt-1 ${
                        formData.phone.length === 10 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formData.phone.length} / 10 digits
                    </p>
                  )}
                </div>
              ) : (
                <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900 break-all">
                  {profileData?.phone || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Claims and Reports Section */}
        <div className="rounded-2xl shadow-lg p-4 sm:p-8 bg-white overflow-hidden">
          {/* Tab Selector */}
          <div className="flex gap-2 sm:gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => {
                setActiveSection('claims');
                setPage(1);
              }}
              className={`px-3 sm:px-4 py-3 font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeSection === 'claims'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={20} />
                <span className="hidden sm:inline">My Claims</span>
                <span className="sm:hidden">Claims</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveSection('reports');
                setPage(1);
              }}
              className={`px-3 sm:px-4 py-3 font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeSection === 'reports'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={20} />
                <span className="hidden sm:inline">My Reports</span>
                <span className="sm:hidden">Reports</span>
              </div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              {activeSection === 'claims' ? 'Claim Requests' : 'Lost Item Reports'} (
              {pagination.total || 0})
            </h3>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || refreshCooldown}
              className={`p-2 rounded-lg font-semibold transition-all bg-gray-100 hover:bg-gray-200 text-gray-700 ${
                refreshing || refreshCooldown ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Refresh"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Claims Section */}
          {activeSection === 'claims' && (
            <>
              {loading ? (
                <LoadingSpinner
                  showColdStartMessage={isInitialLoad.current}
                  message="Loading claims..."
                />
              ) : claims.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-xl text-gray-500 mb-2">No claim requests yet</p>
                  <p className="text-gray-400">Browse items and submit a claim request</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <div
                      key={claim._id}
                      className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow border-gray-200 bg-white"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
                              {claim.item?.name || 'Item'}
                            </h3>
                            {claim.claimId && (
                              <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded break-all">
                                {claim.claimId}
                              </span>
                            )}
                            {getStatusBadge(claim.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Item Details
                              </span>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-gray-900 break-words">
                                  <span className="font-medium">Category:</span>{' '}
                                  {CATEGORY_DISPLAY_NAMES[claim.item?.category] ||
                                    claim.item?.category}
                                </p>
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                  <svg
                                    className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  <span className="break-words">
                                    {claim.item?.foundLocation}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Found:</span>{' '}
                                  {new Date(claim.item?.dateFound).toLocaleDateString(
                                    'en-US',
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    }
                                  )}
                                </p>
                                {claim.item?.itemId && (
                                  <p className="text-sm text-gray-600 break-all">
                                    <span className="font-medium">Item ID:</span>{' '}
                                    {claim.item.itemId}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Claim Information
                              </span>
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock
                                    size={16}
                                    className="text-gray-600 flex-shrink-0"
                                  />
                                  <span>
                                    Requested:{' '}
                                    {new Date(claim.createdAt).toLocaleDateString(
                                      'en-US',
                                      {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      }
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {claim.remarks && (
                        <div
                          className={`mb-4 p-4 rounded-lg border ${
                            claim.status === 'approved'
                              ? 'bg-green-50 border-green-200'
                              : claim.status === 'rejected'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-100 border-gray-200'
                          }`}
                        >
                          <div
                            className={`font-semibold text-sm mb-1 ${
                              claim.status === 'approved'
                                ? 'text-green-800'
                                : claim.status === 'rejected'
                                ? 'text-red-800'
                                : 'text-gray-800'
                            }`}
                          >
                            Admin Remarks:
                          </div>
                          <p
                            className={`text-sm break-words ${
                              claim.status === 'approved'
                                ? 'text-green-700'
                                : claim.status === 'rejected'
                                ? 'text-red-700'
                                : 'text-gray-700'
                            }`}
                          >
                            {claim.remarks}
                          </p>
                        </div>
                      )}

                      {claim.status === 'pending' && (
                        <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="text-sm text-yellow-800">
                              <p className="mb-1">
                                <strong>Pending:</strong> Please visit the admin office
                                during office hours to collect your item.
                              </p>
                              {claim.claimId && (
                                <p className="text-xs mt-2 break-words">
                                  📋 Provide Claim ID{' '}
                                  <span className="font-mono font-semibold bg-yellow-200 px-2 py-0.5 rounded break-all">
                                    {claim.claimId}
                                  </span>{' '}
                                  to the admin for easier tracking.
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveClaim(
                                  claim._id,
                                  claim.item?.name || 'this item'
                                )
                              }
                              disabled={deletingClaim === claim._id}
                              className={`flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold flex-shrink-0 ${
                                deletingClaim === claim._id
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                              }`}
                            >
                              <Trash2 size={14} />
                              {deletingClaim === claim._id ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      )}

                      {claim.status === 'approved' && (
                        <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                          <p className="text-sm text-green-800">
                            <strong>Approved!</strong> This item is now in your
                            possession. You have successfully claimed this item.
                          </p>
                        </div>
                      )}

                      {claim.status === 'rejected' && (
                        <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                          <p className="text-sm text-red-800">
                            <strong>Rejected:</strong> Your claim was not approved.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Page {page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
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
                      onClick={() => setPage(page + 1)}
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
              )}
            </>
          )}

          {/* Reports Section */}
          {activeSection === 'reports' && (
            <>
              {loading ? (
                <LoadingSpinner
                  showColdStartMessage={isInitialLoad.current}
                  message="Loading reports..."
                />
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-xl text-gray-500 mb-2">No reports found</p>
                  <p className="text-gray-400">Report a lost item to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report._id}
                      className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
                              {report.itemDescription}
                            </h3>
                            {report.reportId && (
                              <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded break-all">
                                {report.reportId}
                              </span>
                            )}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                report.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : report.status === 'resolved'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4 text-gray-600 text-sm sm:text-base">
                            <p className="break-words">
                              <strong>Category:</strong>{' '}
                              {CATEGORY_DISPLAY_NAMES[report.category] || report.category}
                            </p>
                            <p className="break-words">
                              <strong>Location:</strong> {report.location}
                            </p>
                            <p>
                              <strong>Lost on:</strong>{' '}
                              {new Date(report.dateLost).toLocaleDateString()}
                            </p>
                            {report.additionalDetails && (
                              <p className="text-sm break-words">
                                <strong>Details:</strong> {report.additionalDetails}
                              </p>
                            )}
                          </div>

                          {report.photos && report.photos.length > 0 && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                              {report.photos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo.url}
                                  alt={`Photo ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                  onClick={() => {
                                    setLightboxImages(report.photos);
                                    setLightboxIndex(index);
                                  }}
                                  onContextMenu={(e) => e.preventDefault()}
                                  draggable={false}
                                />
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-gray-500 break-words">
                            Reported on: {new Date(report.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {/* Delete Report Button */}
                        <div className="flex-shrink-0 w-full sm:w-auto sm:ml-4">
                          <button
                            onClick={() =>
                              handleRemoveReport(report._id, report.itemDescription)
                            }
                            disabled={deletingReport === report._id}
                            className={`flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold w-full sm:w-auto ${
                              deletingReport === report._id
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                            title="Delete this report"
                          >
                            <Trash2
                              size={16}
                              className={
                                deletingReport === report._id ? 'animate-spin' : ''
                              }
                            />
                            {deletingReport === report._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Page {page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
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
                      onClick={() => setPage(page + 1)}
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxImages && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
};

export default Profile;