/**
 * @file ItemDetail.jsx
 * @description Full detail view for a single found item, including the
 * claim / unclaim workflow.
 *
 * Features:
 * - Fetches item by `:id` route param via `publicApi.getItem`.
 * - Fetches the authenticated user's own claim via the dedicated
 *   `/user/items/:id/my-claim` endpoint (avoids cache inconsistency from
 *   fetching all claims client-side).
 * - Ref guards (`isClaimingRef`, `isDeletingClaimRef`) prevent double
 *   submission on rapid clicks.
 * - A `ConfirmModal` gates both claim and remove-claim actions.
 *
 * @component
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { publicApi, userApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import ItemClaimSection from '../components/ItemClaimSection';
import ConfirmModal from '../components/ConfirmModal';

/**
 * Item detail page.
 *
 * @component
 * @returns {JSX.Element}
 */
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
  const [checkingClaim, setCheckingClaim] = useState(true);
  const [userHasRejectedClaim, setUserHasRejectedClaim] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(null); // 'claim' | 'removeClaim'
  
  // Use refs to prevent spam submissions
  const isClaimingRef = useRef(false);
  const isDeletingClaimRef = useRef(false);

  const fetchItemDetails = useCallback(async () => {
    try {
      const response = await publicApi.getItem(id);
      setItem(response.data.item);
    } catch (error) {
      toast.error('Failed to load item details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Uses the dedicated /user/items/:id/my-claim endpoint so we only fetch the
  // claim that belongs to the current user for THIS item — no more fetching
  // all 100 claims and filtering client-side. That approach had two failure
  // modes:
  //  1. Redis cached the "all claims" response under a different key than the
  //     Profile page, so the two could show inconsistent data.
  //  2. Users with >100 claims would never see the matching claim at all.
  const checkUserClaimStatus = useCallback(async (currentItem) => {
    if (!isAuthenticated || !currentItem) {
      setCheckingClaim(false);
      return;
    }

    setCheckingClaim(true);
    try {
      const response = await userApi.checkMyClaim(currentItem._id);
      const { hasClaim, hasRejectedClaim, claim } = response.data;
      setUserHasClaimed(hasClaim);
      setUserClaimId(claim?._id || null);
      setUserHasRejectedClaim(hasRejectedClaim);
    } catch (error) {
      // If the check fails, default to allowing the user to try claiming.
      console.error('Failed to check claim status:', error);
      setUserHasClaimed(false);
      setUserClaimId(null);
      setUserHasRejectedClaim(false);
    } finally {
      setCheckingClaim(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

  // Runs automatically when item or auth state changes
  useEffect(() => {
    checkUserClaimStatus(item);
  }, [item, checkUserClaimStatus]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to claim this item');
      const currentPath = `/item/${id}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    if (userHasClaimed) {
      toast.warning('You already have a claim request for this item');
      return;
    }
    if (isClaimingRef.current || claiming) {
      console.log('Duplicate claim blocked');
      return;
    }

    isClaimingRef.current = true;
    setClaiming(true);
    try {
      await userApi.claimItem(id);
      toast.success('Claim request submitted successfully!');
      setUserHasClaimed(true);
      fetchItemDetails();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit claim';
      toast.error(message);
      setUserHasClaimed(false);
    } finally {
      isClaimingRef.current = false;
      setClaiming(false);
    }
  };

  const handleRemoveClaim = () => {
    if (!userClaimId) return;
    setPendingConfirm('removeClaim');
  };

  const executeRemoveClaim = async () => {
    setPendingConfirm(null);
    if (!userClaimId) return;
    if (isDeletingClaimRef.current || deletingClaim) {
      console.log('Duplicate deletion blocked');
      return;
    }

    isDeletingClaimRef.current = true;
    setDeletingClaim(true);
    try {
      await userApi.deleteClaim(userClaimId);
      toast.success('Claim removed successfully!');

      // FIX: Re-fetch item details AND re-check claim status from backend.
      //
      // BUG (original): Only local state was reset:
      //   setUserHasClaimed(false);
      //   setUserClaimId(null);
      // This left `item.owner`, `userHasRejectedClaim`, and other derived UI
      // state pointing at stale data — causing the claim to still appear in
      // the UI even though it was deleted on the server.
      //
      // FIX: fetchItemDetails() updates the item object (clearing item.owner
      // when appropriate). Because checkUserClaimStatus is called inside the
      // useEffect that watches `item`, it will automatically re-run once
      // fetchItemDetails resolves and setItem fires with fresh data.
      // This ensures ALL claim-related state is reset atomically from the
      // server's source of truth.
      await fetchItemDetails();
      // Note: checkUserClaimStatus will be triggered automatically by the
      // useEffect above once `item` state updates from fetchItemDetails.

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
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

            <ItemClaimSection
              item={item}
              claiming={claiming}
              deletingClaim={deletingClaim}
              checkingClaim={checkingClaim}
              userHasClaimed={userHasClaimed}
              userHasRejectedClaim={userHasRejectedClaim}
              user={user}
              onClaim={handleClaim}
              onRemoveClaim={handleRemoveClaim}
              onNavigateProfile={() => navigate('/profile')}
            />
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
              <span>Visit the admin during office hours at SBI Lawn             
              </span>
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

      <ConfirmModal
        isOpen={pendingConfirm === 'removeClaim'}
        title="Remove Claim?"
        description="Are you sure you want to withdraw your claim request for this item?"
        confirmLabel="Remove Claim"
        onConfirm={executeRemoveClaim}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
};

export default ItemDetail;