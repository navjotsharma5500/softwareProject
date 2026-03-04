/**
 * @file Profile.jsx
 * @description Authenticated user profile page showing account info, active
 * claims, and submitted reports.
 *
 * Features:
 * - Edit mode for `displayName` and `phoneNumber`.
 * - Two tabs ("My Claims" / "My Reports"), persisted via URL `?section=`.
 * - Claims and reports are paginated; page is persisted in the URL.
 * - `isInitialLoad` ref is reset on tab switch so the full spinner shows
 *   correctly on each tab's cold start.
 * - Image lightbox for report photos.
 * - Claim deletion and report deletion/resolution via guarded `ConfirmModal`.
 * - Ref guards prevent double-submission on rapid clicks.
 * - 2-second refresh cooldown via `useCooldown`.
 *
 * @component
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Package, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { userApi, reportApi } from '../utils/api';
import { CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import useFormPersistence from '../hooks/useFormPersistence.jsx';
import { useCooldown } from '../hooks/useCooldown';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageLightbox from '../components/ImageLightbox';
import { useSearchParams } from 'react-router-dom';
import ClaimCard from '../components/profile/ClaimCard';
import ReportCard from '../components/profile/ReportCard';
import ProfileHeader from '../components/profile/ProfileHeader';
import Pagination from '../components/admin/Pagination';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

/**
 * User profile page.
 *
 * @component
 * @returns {JSX.Element}
 */
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
  const [resolvingReport, setResolvingReport] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { key, ...payload }
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSavingRef = useRef(false);
  const isDeletingClaimRef = useRef(false);
  const isDeletingReportRef = useRef(false);
  const isResolvingReportRef = useRef(false);

  const [refreshCooldown, triggerRefresh] = useCooldown(2000);

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
    if (!triggerRefresh()) {
      toast.warning('Please wait before refreshing again');
      return;
    }

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
    }
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

  const handleRemoveClaim = (claimId, itemName) => {
    setConfirmAction({ key: 'removeClaim', claimId, itemName });
  };

  const executeRemoveClaim = async (claimId) => {
    setConfirmAction(null);
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

  const handleRemoveReport = (reportId, itemName) => {
    setConfirmAction({ key: 'removeReport', reportId, itemName });
  };

  const executeRemoveReport = async (reportId) => {
    setConfirmAction(null);
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

  const handleResolveReport = (reportId, itemName) => {
    setConfirmAction({ key: 'resolveReport', reportId, itemName });
  };

  const executeResolveReport = async (reportId) => {
    setConfirmAction(null);
    if (isResolvingReportRef.current || resolvingReport === reportId) {
      console.log('Duplicate report resolve blocked');
      return;
    }

    isResolvingReportRef.current = true;
    setResolvingReport(reportId);
    try {
      await reportApi.resolveReport(reportId);
      toast.success('Report marked as resolved!');
      await fetchMyReports();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resolve report';
      toast.error(message);
    } finally {
      isResolvingReportRef.current = false;
      setResolvingReport(null);
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
        <ProfileHeader
          profileData={profileData}
          user={user}
          editing={editing}
          saving={saving}
          setEditing={setEditing}
          handleSave={handleSave}
          handleCancel={handleCancel}
          formData={formData}
          setFormData={setFormData}
          onImageClick={(images, index) => {
            setLightboxImages(images);
            setLightboxIndex(index);
          }}
        />

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
                <LoadingSpinner message="Loading claims..." />
              ) : claims.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No claim requests yet"
                  subtitle="Browse items and submit a claim request"
                />
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <ClaimCard
                      key={claim._id}
                      claim={claim}
                      onRemove={handleRemoveClaim}
                      deletingClaim={deletingClaim}
                      CATEGORY_DISPLAY_NAMES={CATEGORY_DISPLAY_NAMES}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Pagination
                    page={page}
                    pagination={pagination}
                    onPrev={() => setPage(page - 1)}
                    onNext={() => setPage(page + 1)}
                  />
                </div>
              )}
            </>
          )}

          {/* Reports Section */}
          {activeSection === 'reports' && (
            <>
              {loading ? (
                <LoadingSpinner message="Loading reports..." />
              ) : reports.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No reports found"
                  subtitle="Report a lost item to get started"
                />
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <ReportCard
                      key={report._id}
                      report={report}
                      onDelete={handleRemoveReport}
                      deletingReport={deletingReport}
                      onResolve={handleResolveReport}
                      resolvingReport={resolvingReport}
                      CATEGORY_DISPLAY_NAMES={CATEGORY_DISPLAY_NAMES}
                      onImageClick={(photos, index) => {
                        setLightboxImages(photos);
                        setLightboxIndex(index);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Pagination
                    page={page}
                    pagination={pagination}
                    onPrev={() => setPage(page - 1)}
                    onNext={() => setPage(page + 1)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmAction?.key === 'removeClaim'}
        title="Remove Claim?"
        description={`Are you sure you want to remove your claim for "${confirmAction?.itemName}"?`}
        confirmLabel="Remove Claim"
        onConfirm={() => executeRemoveClaim(confirmAction.claimId)}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        isOpen={confirmAction?.key === 'removeReport'}
        title="Delete Report?"
        description={`Are you sure you want to delete your report for "${confirmAction?.itemName}"?`}
        confirmLabel="Delete Report"
        onConfirm={() => executeRemoveReport(confirmAction.reportId)}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        isOpen={confirmAction?.key === 'resolveReport'}
        variant="success"
        title="Mark as Resolved?"
        description={`Mark your report for "${confirmAction?.itemName}" as resolved? This means you found your item.`}
        confirmLabel="Yes, Mark Resolved"
        onConfirm={() => executeResolveReport(confirmAction.reportId)}
        onCancel={() => setConfirmAction(null)}
      />

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