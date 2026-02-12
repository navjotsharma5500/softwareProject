import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ArrowLeft, User, Trash2 } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { publicApi, userApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_DISPLAY_NAMES } from '../utils/constants';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [deletingClaim, setDeletingClaim] = useState(false);
  const [userHasClaimed, setUserHasClaimed] = useState(false);
  const [userClaimId, setUserClaimId] = useState(null);
  const [checkingClaim, setCheckingClaim] = useState(false);
  const [userHasRejectedClaim, setUserHasRejectedClaim] = useState(false);
  
  // Use refs to prevent spam submissions
  const isClaimingRef = useRef(false);
  const isDeletingClaimRef = useRef(false);

  const fetchItemDetails = async () => {
    try {
      const response = await publicApi.getItem(id);
      setItem(response.data.item);
    } catch (error) {
      toast.error('Failed to load item details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Check if user has already claimed this item
  useEffect(() => {
    const checkIfUserClaimed = async () => {
      if (!isAuthenticated || !item) return;
      
      setCheckingClaim(true);
      try {
        const response = await userApi.getMyClaims({ page: 1, limit: 100 });
        const userClaim = response.data.claims.find(
          claim => claim.item?._id === item._id && claim.status !== 'rejected'
        );
        const rejectedClaim = response.data.claims.find(
          claim => claim.item?._id === item._id && claim.status === 'rejected'
        );
        setUserHasClaimed(!!userClaim);
        setUserClaimId(userClaim?._id || null);
        setUserHasRejectedClaim(!!rejectedClaim);
      } catch (error) {
        console.error('Failed to check claim status:', error);
      } finally {
        setCheckingClaim(false);
      }
    };

    checkIfUserClaimed();
  }, [item, isAuthenticated]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to claim this item');
      const currentPath = `/item/${id}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (item.isClaimed) {
      toast.warning('This item has already been claimed');
      return;
    }

    if (userHasClaimed) {
      toast.warning('You already have a claim request for this item');
      return;
    }

    // Prevent spam claiming
    if (isClaimingRef.current || claiming) {
      console.log('Duplicate claim blocked');
      return;
    }

    isClaimingRef.current = true;
    setClaiming(true);
    try {
      await userApi.claimItem(id);
      toast.success('Claim request submitted successfully!');
      setUserHasClaimed(true); // Optimistic update
      fetchItemDetails(); // Refresh item details
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit claim';
      toast.error(message);
      // If error, recheck claim status
      setUserHasClaimed(false);
    } finally {
      isClaimingRef.current = false;
      setClaiming(false);
    }
  };

  const handleRemoveClaim = async () => {
    if (!userClaimId) return;

    // Prevent spam deletion
    if (isDeletingClaimRef.current || deletingClaim) {
      console.log('Duplicate deletion blocked');
      return;
    }

    isDeletingClaimRef.current = true;
    setDeletingClaim(true);
    try {
      await userApi.deleteClaim(userClaimId);
      toast.success('Claim removed successfully!');
      setUserHasClaimed(false);
      setUserClaimId(null);
      // Don't call fetchItemDetails() here to avoid duplicate toasts
      // fetchItemDetails(); // Refresh item details
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove claim';
      toast.error(message);
    } finally {
      isDeletingClaimRef.current = false;
      setDeletingClaim(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Item not found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-gray-900 hover:text-gray-700"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-6 transition-colors text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Items
        </button>

        {/* Item Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-gray-900">{item.name}</h1>
                <div className="flex gap-2 flex-wrap">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                    item.isClaimed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.isClaimed ? 'Claimed' : 'Available'}
                  </span>
                  {userHasClaimed && !item.isClaimed && (
                    <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                      You Claimed This
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm mb-1 text-gray-500">Item ID</div>
                <div className="font-mono text-lg font-semibold text-gray-900">
                  {item.itemId}
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="mb-6">
              <div className="inline-block px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-800">
                {CATEGORY_DISPLAY_NAMES[item.category] || item.category}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-gray-100">
                  <MapPin className="text-gray-800" size={24} />
                </div>
                <div>
                  <div className="text-sm mb-1 text-gray-500">Found Location</div>
                  <div className="font-semibold text-gray-900">{item.foundLocation}</div>
                </div>
              </div>

              {/* Date Found */}
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-gray-100">
                  <Calendar className="text-gray-800" size={24} />
                </div>
                <div>
                  <div className="text-sm mb-1 text-gray-500">Date Found</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(item.dateFound).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Description (if exists) */}
            {item.description && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Description</h3>
                <p className="leading-relaxed text-gray-700">{item.description}</p>
              </div>
            )}

            {/* Claim Information */}
            {item.owner && (
              <div className="border rounded-lg p-4 mb-6 bg-gray-100 border-gray-200">
                <div className="flex items-center gap-2 mb-2 text-gray-800">
                  <User size={20} />
                  <span className="font-semibold">Claim Status</span>
                </div>
                <p className="text-gray-700">
                  {item.isClaimed 
                    ? 'This item has been claimed and is no longer available.' 
                    : 'A claim request has been submitted for this item. Awaiting admin approval.'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {!item.isClaimed && (
                <button
                  onClick={handleClaim}
                  disabled={claiming || checkingClaim || userHasClaimed || userHasRejectedClaim || (item.owner && item.owner._id === user?._id)}
                  className={`flex-1 py-4 rounded-xl font-semibold text-white transition-all ${
                    claiming || checkingClaim || userHasClaimed || userHasRejectedClaim || (item.owner && item.owner._id === user?._id)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:shadow-lg'
                  }`}
                >
                  {checkingClaim
                    ? 'Checking...'
                    : claiming 
                    ? 'Submitting...' 
                    : userHasRejectedClaim
                    ? 'Your Claim Was Rejected - Cannot Re-claim'
                    : userHasClaimed
                    ? 'Already Claimed - Awaiting Approval'
                    : (item.owner && item.owner._id === user?._id)
                    ? 'You already claimed this'
                    : 'Request to Claim This Item'}
                </button>
              )}
              
              {item.isClaimed && (
                <div className="flex-1 py-4 rounded-xl font-semibold text-center bg-gray-200 text-gray-600">
                  This item is no longer available
                </div>
              )}
            </div>

            {/* Info Text */}
            {!item.isClaimed && !userHasClaimed && (
              <p className="mt-4 text-sm text-center text-gray-500">
                After submitting a claim, visit the admin office during office hours for verification
              </p>
            )}
            
            {/* User Already Claimed Message */}
            {userHasClaimed && !item.isClaimed && (
              <div className="mt-4 border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <p className="text-sm text-center mb-3 text-yellow-800">
                  You have already submitted a claim request for this item. Check your{' '}
                  <button 
                    onClick={() => navigate('/profile')}
                    className="font-semibold underline hover:text-yellow-900"
                  >
                    profile page
                  </button>
                  {' '}for the status.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={handleRemoveClaim}
                    disabled={deletingClaim}
                    className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold ${
                      deletingClaim ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Trash2 size={16} />
                    {deletingClaim ? 'Removing...' : 'Remove Claim'}
                  </button>
                </div>
              </div>
            )}

            {/* User Rejected Claim Message */}
            {userHasRejectedClaim && !item.isClaimed && (
              <div className="mt-4 border rounded-lg p-4 bg-red-50 border-red-200">
                <p className="text-sm text-center text-red-800">
                  Your previous claim for this item was rejected by an admin. You cannot re-claim this item.
                  Please check your{' '}
                  <button 
                    onClick={() => navigate('/profile')}
                    className="font-semibold underline hover:text-red-900"
                  >
                    profile page
                  </button>
                  {' '}for details or contact the admin office.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 rounded-xl shadow-md p-6 bg-white"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            How to Claim Your Item
          </h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <span>Click "Request to Claim This Item" button above</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <span>Visit the admin office during office hours</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <span>The admin will verify your identity and ownership</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </span>
              <span>If approved, you'll receive your item immediately</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                5
              </span>
              <span>To make admin's job easier, provide your Claim ID from your <button onClick={() => navigate('/profile')} className="font-semibold underline hover:text-gray-900">profile page</button> when you visit the office.</span>
            </li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
};

export default ItemDetail;
