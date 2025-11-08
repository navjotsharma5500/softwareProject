import React, { useState, useEffect } from 'react';
import { User, Mail, IdCard, Package, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { userApi } from '../utils/api';
import { CATEGORY_DISPLAY_NAMES } from '../utils/constants';

const Profile = () => {
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [page, setPage] = useState(1);

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
    }
  };

  useEffect(() => {
    fetchMyClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMyClaims();
      toast.success('Claims refreshed!');
    } catch {
      toast.error('Failed to refresh claims');
    } finally {
      setRefreshing(false);
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
    <div className={`min-h-screen py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className={`rounded-2xl shadow-lg p-8 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
              <User className="text-white" size={40} />
            </div>
            <div className="flex-1">
              <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</h1>
              <div className={`flex flex-wrap gap-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2">
                  <Mail size={18} />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IdCard size={18} />
                  <span>Roll No: {user?.rollNo}</span>
                </div>
              </div>
            </div>
            {user?.isAdmin && (
              <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-semibold">
                Admin
              </div>
            )}
          </div>
        </div>

        {/* My Claims Section */}
        <div className={`rounded-2xl shadow-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="text-indigo-600" size={28} />
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Claim Requests</h2>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg font-semibold transition-all ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh claims"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-xl text-gray-500 mb-2">No claim requests yet</p>
              <p className="text-gray-400">Browse items and submit a claim request</p>
            </div>
          ) : (
            <>
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
                              {claim.item?.itemId && (
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  <span className="font-medium">Item ID:</span> {claim.item.itemId}
                                </p>
                              )}
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
