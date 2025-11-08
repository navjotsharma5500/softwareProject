import React, { useState, useEffect } from 'react';
import { User, Mail, IdCard, Package, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../utils/api';
import { CATEGORY_DISPLAY_NAMES } from '../utils/constants';

const Profile = () => {
  const { user } = useAuth();
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
              <User className="text-white" size={40} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.name}</h1>
              <div className="flex flex-wrap gap-4 text-gray-600">
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
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="text-indigo-600" size={28} />
              <h2 className="text-2xl font-bold text-gray-900">My Claim Requests</h2>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg font-semibold transition-all bg-gray-100 hover:bg-gray-200 text-gray-700 ${
                refreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {claim.item?.name || 'Item'}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                            {CATEGORY_DISPLAY_NAMES[claim.item?.category] || claim.item?.category}
                          </span>
                          {getStatusBadge(claim.status)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">{claim.item?.foundLocation}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={18} className="text-teal-600" />
                        <span className="text-sm">
                          Requested: {new Date(claim.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {claim.remarks && (
                      <div className={`mt-4 p-4 rounded-lg ${
                        claim.status === 'approved' 
                          ? 'bg-green-50 border border-green-200' 
                          : claim.status === 'rejected'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-blue-50 border border-blue-200'
                      }`}>
                        <div className="font-semibold text-gray-900 mb-1">Admin Remarks:</div>
                        <p className="text-gray-700">{claim.remarks}</p>
                      </div>
                    )}

                    {claim.status === 'pending' && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Next Steps:</strong> Visit the admin office during office hours for verification.
                        </p>
                      </div>
                    )}

                    {claim.status === 'approved' && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Congratulations!</strong> Your claim has been approved. Please collect your item from the admin office.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrev}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      pagination.hasPrev
                        ? 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    } transition-all`}
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-gray-900">
                    Page {page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNext}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      pagination.hasNext
                        ? 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    } transition-all`}
                  >
                    Next
                  </button>
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
