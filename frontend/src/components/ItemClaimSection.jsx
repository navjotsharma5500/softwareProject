import React from 'react';
import { Trash2, User } from 'lucide-react';

/**
 * Claim/unclaim action area for ItemDetail page.
 * Props:
 *   item               – item object
 *   claiming           – boolean
 *   deletingClaim      – boolean
 *   checkingClaim      – boolean
 *   userHasClaimed     – boolean
 *   userHasRejectedClaim – boolean
 *   user               – auth user object (can be null)
 *   onClaim            – () => void
 *   onRemoveClaim      – () => void
 *   onNavigateProfile  – () => void
 */
const ItemClaimSection = ({
  item,
  claiming,
  deletingClaim,
  checkingClaim,
  userHasClaimed,
  userHasRejectedClaim,
  user,
  onClaim,
  onRemoveClaim,
  onNavigateProfile,
}) => {
  return (
    <>
      {/* Claim ownership info */}
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
            onClick={onClaim}
            disabled={
              claiming ||
              checkingClaim ||
              userHasClaimed ||
              userHasRejectedClaim ||
              (item.owner && item.owner._id === user?._id)
            }
            className={`flex-1 py-4 rounded-xl font-semibold text-white transition-all ${
              claiming ||
              checkingClaim ||
              userHasClaimed ||
              userHasRejectedClaim ||
              (item.owner && item.owner._id === user?._id)
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
              : item.owner && item.owner._id === user?._id
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

      {/* Info text */}
      {!item.isClaimed && !userHasClaimed && (
        <p className="mt-4 text-sm text-center text-gray-500">
          ⚠️ submitting false claims will result in blacklisting. ⚠️
        </p>
      )}

      {/* User already claimed panel */}
      {userHasClaimed && !item.isClaimed && (
        <div className="mt-4 border rounded-lg p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-center mb-3 text-yellow-800">
            You have already submitted a claim request for this item. Check your{' '}
            <button
              onClick={onNavigateProfile}
              className="font-semibold underline hover:text-yellow-900"
            >
              profile page
            </button>
            {' '}for the status.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onRemoveClaim}
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

      {/* Rejected claim panel */}
      {userHasRejectedClaim && !item.isClaimed && (
        <div className="mt-4 border rounded-lg p-4 bg-red-50 border-red-200">
          <p className="text-sm text-center text-red-800">
            Your previous claim for this item was rejected by an admin. You cannot re-claim this item.
            Please check your{' '}
            <button
              onClick={onNavigateProfile}
              className="font-semibold underline hover:text-red-900"
            >
              profile page
            </button>
            {' '}for details or contact the admin office.
          </p>
        </div>
      )}
    </>
  );
};

export default ItemClaimSection;
