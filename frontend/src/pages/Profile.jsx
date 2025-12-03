import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, IdCard, Package, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Edit2, Save, X, Phone, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { userApi, reportApi } from '../utils/api';
import { CATEGORY_DISPLAY_NAMES, LOCATIONS } from '../utils/constants';
import useFormPersistence from '../hooks/useFormPersistence.jsx';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const [profileData, setProfileData] = useState(null);
  const [claims, setClaims] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('claims'); // 'claims' or 'reports'
  const isInitialLoad = useRef(true);
  const [formData, setFormData, formControls] = useFormPersistence('profile_form', {
    name: '',
    rollNo: '',
    phone: '',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [page, setPage] = useState(1);

  const fetchProfile = async () => {
    try {
      const response = await userApi.getProfile();
      setProfileData(response.data.user);
      formControls.replaceIfEmpty({
        name: response.data.user.name,
        rollNo: response.data.user.rollNo,
        phone: response.data.user.phone || '',
      });
    } catch (error) {
      toast.error('Failed to load profile');
      console.error(error);
    }
  };

  const fetchMyClaims = async () => {
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
  };

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const response = await reportApi.getMyReports({ page, limit: 10 });
      setReports(response.data.reports);
      setPagination(response.data.pagination || {
        total: response.data.reports.length,
        totalPages: response.data.totalPages,
        hasNext: response.data.hasNext,
        hasPrev: response.data.hasPrev
      });
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  };

  useEffect(() => {
    fetchProfile();
    if (activeSection === 'claims') {
      fetchMyClaims();
    } else {
      fetchMyReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeSection]);

  const handleRefresh = async () => {
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userApi.updateProfile(formData);
      await fetchProfile();
      setEditing(false);
      formControls.clear();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profileData.name,
      rollNo: profileData.rollNo,
      phone: profileData.phone || '',
    });
    setEditing(false);
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
    <div className={`min-h-screen py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className={`rounded-2xl shadow-lg p-8 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-start gap-6 mb-6">
            {profileData?.profilePicture ? (
              <img
                src={profileData.profilePicture}
                alt={profileData.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="text-white" size={48} />
              </div>
            )}
            <div className="flex-1">
              <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {profileData?.name || user?.name}
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {profileData?.email || user?.email}
              </p>
              {user?.isAdmin && (
                <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-semibold text-sm">
                  Admin
                </span>
              )}
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className={`flex items-center gap-2 mb-2 font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <User size={18} />
                Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              ) : (
                <p className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                }`}>
                  {profileData?.name || user?.name}
                </p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className={`flex items-center gap-2 mb-2 font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Mail size={18} />
                Email Address
              </label>
              <p className={`px-4 py-2 rounded-lg ${
                darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-600'
              }`}>
                {profileData?.email || user?.email}
                <span className="ml-2 text-xs">(Cannot be changed)</span>
              </p>
            </div>

            {/* Roll Number */}
            <div>
              <label className={`flex items-center gap-2 mb-2 font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <IdCard size={18} />
                Roll Number
              </label>
              {editing ? (
                <input
                  type="text"
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, rollNo: value});
                  }}
                  placeholder="e.g., 102203456"
                  maxLength="12"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              ) : (
                <p className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                }`}>
                  {profileData?.rollNo || user?.rollNo}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className={`flex items-center gap-2 mb-2 font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Phone size={18} />
                Phone Number (Optional)
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, phone: value});
                  }}
                  placeholder="9876543210"
                  maxLength="10"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              ) : (
                <p className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                }`}>
                  {profileData?.phone || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Claims and Reports Section */}
        <div className={`rounded-2xl shadow-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Tab Selector */}
          <div className="flex gap-4 mb-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
            <button
              onClick={() => {
                setActiveSection('claims');
                setPage(1);
              }}
              className={`px-4 py-3 font-semibold transition-all border-b-2 ${
                activeSection === 'claims'
                  ? 'border-indigo-600 text-indigo-600'
                  : darkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={20} />
                My Claims
              </div>
            </button>
            <button
              onClick={() => {
                setActiveSection('reports');
                setPage(1);
              }}
              className={`px-4 py-3 font-semibold transition-all border-b-2 ${
                activeSection === 'reports'
                  ? 'border-indigo-600 text-indigo-600'
                  : darkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={20} />
                My Reports
              </div>
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {activeSection === 'claims' ? 'Claim Requests' : 'Lost Item Reports'} ({pagination.total || 0})
            </h3>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg font-semibold transition-all ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                      darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {claim.item?.name || 'Item'}
                          </h3>
                          {getStatusBadge(claim.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Item Details</span>
                            <div className="mt-2 space-y-1">
                              <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                <span className="font-medium">Category:</span> {CATEGORY_DISPLAY_NAMES[claim.item?.category] || claim.item?.category}
                              </p>
                              <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{claim.item?.foundLocation}</span>
                              </div>
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="font-medium">Found:</span> {new Date(claim.item?.dateFound).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              {claim.item?.itemId && (
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  <span className="font-medium">Item ID:</span> {claim.item.itemId}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Claim Information</span>
                            <div className="mt-2 space-y-1">
                              <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <Clock size={16} className="text-teal-600" />
                                <span>
                                  Requested: {new Date(claim.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {claim.remarks && (
                      <div className={`mb-4 p-4 rounded-lg border ${
                        claim.status === 'approved' 
                          ? darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
                          : claim.status === 'rejected'
                          ? darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                          : darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className={`font-semibold text-sm mb-1 ${
                          claim.status === 'approved'
                            ? darkMode ? 'text-green-300' : 'text-green-800'
                            : claim.status === 'rejected'
                            ? darkMode ? 'text-red-300' : 'text-red-800'
                            : darkMode ? 'text-blue-300' : 'text-blue-800'
                        }`}>Admin Remarks:</div>
                        <p className={`text-sm ${
                          claim.status === 'approved'
                            ? darkMode ? 'text-green-200' : 'text-green-700'
                            : claim.status === 'rejected'
                            ? darkMode ? 'text-red-200' : 'text-red-700'
                            : darkMode ? 'text-blue-200' : 'text-blue-700'
                        }`}>{claim.remarks}</p>
                      </div>
                    )}

                    {claim.status === 'pending' && (
                      <div className={`p-4 rounded-lg border ${
                        darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          <strong>Next Steps:</strong> Visit the admin office during office hours for verification.
                        </p>
                      </div>
                    )}

                    {claim.status === 'approved' && !claim.remarks && (
                      <div className={`p-4 rounded-lg border ${
                        darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
                      }`}>
                        <p className={`text-sm ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                          <strong>Approved!</strong> Your claim has been approved. Please visit the admin office to collect your item.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Page {page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrev}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        pagination.hasPrev
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        pagination.hasNext
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                      className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {report.itemDescription}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              report.status === 'active' ? 'bg-green-100 text-green-800' :
                              report.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {report.status}
                            </span>
                          </div>

                          <div className={`space-y-2 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <p><strong>Category:</strong> {CATEGORY_DISPLAY_NAMES[report.category]}</p>
                            <p><strong>Location:</strong> {LOCATIONS[report.location] || report.location}</p>
                            <p><strong>Lost on:</strong> {new Date(report.dateLost).toLocaleDateString()}</p>
                            {report.additionalDetails && (
                              <p className="text-sm"><strong>Details:</strong> {report.additionalDetails}</p>
                            )}
                          </div>

                          {report.photos && report.photos.length > 0 && (
                            <div className="flex gap-2 mb-4">
                              {report.photos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Photo ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}

                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Reported on: {new Date(report.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Page {page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrev}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        pagination.hasPrev
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        pagination.hasNext
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
    </div>
  );
};

export default Profile;
