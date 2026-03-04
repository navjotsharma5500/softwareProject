/**
 * @file UserActivityHistory.jsx
 * @description Admin drill-down page showing all claims and reports for a
 * specific user, with the ability to toggle the user's blacklist status.
 *
 * The `userName` is accepted from `useLocation` state when navigating from
 * the admin page (avoiding an extra API call). The `fromTab` state is used
 * to restore the correct tab on the admin page when navigating back.
 *
 * @component
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, AlertCircle, Package, MapPin, Clock, Calendar, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { userApi, adminApi } from '../utils/api';
import { CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import ImageLightbox from '../components/ImageLightbox';

/**
 * User activity history page (admin only).
 *
 * @component
 * @returns {JSX.Element}
 */
const UserActivityHistory = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Try to get the userName from navigation state (passed from admin page)
  const [userName, setUserName] = useState(location.state?.userName || '');
  const fromTab = location.state?.fromTab || 'claims';
  const [userHistory, setUserHistory] = useState({ claims: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [togglingBlacklist, setTogglingBlacklist] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await userApi.getUserHistory(userId);
        setUserHistory(response.data);
        // If the API returns a name and we don't have one yet, use it
        if (!userName && response.data?.user?.name) {
          setUserName(response.data.user.name);
        }
        if (typeof response.data?.user?.isBlacklisted === 'boolean') {
          setIsBlacklisted(response.data.user.isBlacklisted);
        }
      } catch (error) {
        toast.error('Failed to load user history');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleToggleBlacklist = async () => {
    if (togglingBlacklist) return;
    setTogglingBlacklist(true);
    try {
      const res = await adminApi.toggleBlacklist(userId);
      setIsBlacklisted(res.data.isBlacklisted);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update blacklist status');
    } finally {
      setTogglingBlacklist(false);
    }
  };

  return (
    <>
      <div className="min-h-screen py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() =>
              fromTab === 'users'
                ? navigate('/admin/users')
                : navigate('/admin', { state: { tab: fromTab } })
            }
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to {
              fromTab === 'users' ? 'User Management' :
              fromTab === 'claims' ? 'Pending Claims' :
              fromTab === 'approved-claims' ? 'Approved Claims' :
              fromTab === 'rejected-claims' ? 'Rejected Claims' : 'Admin'
            }</span>
          </button>

          {/* Page Header */}
          <div className="mb-8 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">User Activity History</h1>
              {userName && (
                <p className="text-lg text-gray-600 flex items-center gap-2">
                  {userName}
                  {isBlacklisted && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <Ban size={11} /> Blacklisted
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={handleToggleBlacklist}
              disabled={togglingBlacklist || loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors self-start ${
                isBlacklisted
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } ${togglingBlacklist || loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {togglingBlacklist ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : isBlacklisted ? (
                <CheckCircle size={16} />
              ) : (
                <Ban size={16} />
              )}
              {togglingBlacklist ? 'Updating...' : isBlacklisted ? 'Unblacklist User' : 'Blacklist User'}
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-lg text-center bg-orange-50 border border-orange-100">
                  <p className="text-2xl font-bold text-orange-600">
                    {userHistory.reports?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Reports</p>
                </div>
                <div className="p-4 rounded-lg text-center bg-gray-100 border border-gray-200">
                  <p className="text-2xl font-bold text-gray-900">
                    {userHistory.claims?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Claims</p>
                </div>
                <div className="p-4 rounded-lg text-center bg-green-50 border border-green-100">
                  <p className="text-2xl font-bold text-green-600">
                    {userHistory.claims?.filter(c => c.status === 'approved').length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="p-4 rounded-lg text-center bg-red-50 border border-red-100">
                  <p className="text-2xl font-bold text-red-600">
                    {userHistory.claims?.filter(c => c.status === 'rejected').length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>

              {/* Two-column layout: Reports & Claims */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lost Item Reports Section */}
                <div className="rounded-lg border p-6 border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                      <AlertCircle size={22} className="text-orange-500" />
                      Lost Item Reports
                    </h2>
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-800">
                      {userHistory.reports?.length || 0}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {userHistory.reports && userHistory.reports.length > 0 ? (
                      userHistory.reports.map((report) => {
                        const suspiciousClaim = userHistory.claims?.find((claim) => {
                          const claimTime = new Date(claim.createdAt);
                          const reportTime = new Date(report.createdAt);
                          const diffHours = (claimTime - reportTime) / (1000 * 60 * 60);
                          if (claimTime > reportTime && diffHours <= 5) return true;
                          if (reportTime > claimTime) return true;
                          return false;
                        });

                        return (
                          <div
                            key={report._id}
                            className="p-5 rounded-lg border border-gray-200 bg-gray-50 transition-all hover:shadow-md hover:bg-white"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {report.itemDescription}
                                  </h3>
                                  {report.reportId && (
                                    <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      {report.reportId}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">
                                    {CATEGORY_DISPLAY_NAMES[report.category] || report.category}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    report.status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {report.status?.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600">
                              {suspiciousClaim && (() => {
                                const claimTime = new Date(suspiciousClaim.createdAt);
                                const reportTime = new Date(report.createdAt);
                                const diffHours = (claimTime - reportTime) / (1000 * 60 * 60);
                                let msg = '';
                                if (claimTime > reportTime && diffHours <= 5) {
                                  msg = `Suspicious: Claim made ${diffHours.toFixed(2)} hours after report. Review for possible abuse.`;
                                } else if (reportTime > claimTime) {
                                  const diff = (reportTime - claimTime) / (1000 * 60 * 60);
                                  msg = `Suspicious: Report made ${diff.toFixed(2)} hours after a claim. Review for possible abuse.`;
                                }
                                return (
                                  <div className="mb-2 p-2 rounded bg-yellow-100 border border-yellow-400 flex items-start gap-2">
                                    <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                                    <div>
                                      <span className="text-yellow-800 font-semibold">{msg}</span>
                                      <span className="block text-xs text-yellow-700 mt-0.5">
                                        (Claim: {claimTime.toLocaleString('en-US', {
                                          year: 'numeric', month: 'short', day: 'numeric',
                                          hour: '2-digit', minute: '2-digit', hour12: true
                                        })})
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-red-500 shrink-0" />
                                <span><strong>Location:</strong> {report.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-500 shrink-0" />
                                <span>
                                  <strong>Lost on:</strong>{' '}
                                  {new Date(report.dateLost).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-purple-500 shrink-0" />
                                <span>
                                  <strong>Reported:</strong>{' '}
                                  {new Date(report.createdAt).toLocaleString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit', hour12: true
                                  })}
                                </span>
                              </div>
                            </div>

                            {report.additionalDetails && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm text-gray-600">
                                  <strong>Details:</strong> {report.additionalDetails}
                                </p>
                              </div>
                            )}

                            {report.photos && report.photos.length > 0 && (
                              <div className="mt-3 flex gap-2 flex-wrap">
                                {report.photos.map((photo, idx) => (
                                  <img
                                    key={idx}
                                    src={photo.url}
                                    alt={`Report photo ${idx + 1}`}
                                    className="w-20 h-20 object-cover rounded border-2 border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      setLightboxImages(report.photos);
                                      setLightboxIndex(idx);
                                    }}
                                    onContextMenu={(e) => e.preventDefault()}
                                    draggable={false}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-16">
                        <AlertCircle className="mx-auto mb-3 text-gray-300" size={48} />
                        <p className="text-sm text-gray-500">No lost item reports</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Claim Requests Section */}
                <div className="rounded-lg border p-6 border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                      <Package size={22} className="text-gray-500" />
                      Claim Requests
                    </h2>
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-800">
                      {userHistory.claims?.length || 0}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {userHistory.claims && userHistory.claims.length > 0 ? (
                      userHistory.claims.map((claim) => (
                        <div
                          key={claim._id}
                          className="p-5 rounded-lg border border-gray-200 bg-gray-50 transition-all hover:shadow-md hover:bg-white"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-1 text-gray-900">
                                {claim.item?.name}
                              </h3>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                  {CATEGORY_DISPLAY_NAMES[claim.item?.category] || claim.item?.category}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {claim.status?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-green-500 shrink-0" />
                              <span><strong>Found at:</strong> {claim.item?.foundLocation}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-500 shrink-0" />
                              <span><strong>Item ID:</strong> {claim.item?.itemId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-orange-500 shrink-0" />
                              <span>
                                <strong>Claimed on:</strong>{' '}
                                {new Date(claim.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric', month: 'long', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>

                          {claim.remarks && (
                            <div className={`mt-3 pt-3 border-t p-3 rounded ${
                              claim.status === 'approved'
                                ? 'border-green-200 bg-green-50'
                                : claim.status === 'rejected'
                                ? 'border-red-200 bg-red-50'
                                : 'border-gray-200 bg-white'
                            }`}>
                              <p className={`text-sm font-semibold mb-1 ${
                                claim.status === 'approved' ? 'text-green-700' :
                                claim.status === 'rejected' ? 'text-red-700' :
                                'text-gray-700'
                              }`}>
                                Admin Remarks:
                              </p>
                              <p className="text-sm text-gray-600">{claim.remarks}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <Package className="mx-auto mb-3 text-gray-300" size={48} />
                        <p className="text-sm text-gray-500">No claim requests</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
    </>
  );
};

export default UserActivityHistory;
