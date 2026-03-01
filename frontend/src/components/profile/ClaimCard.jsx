import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ClaimCard = ({ claim, onRemove, deletingClaim, CATEGORY_DISPLAY_NAMES }) => {
  return (
    <div className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow border-gray-200 bg-white">
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
            <StatusBadge status={claim.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Item Details</span>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-900 break-words">
                  <span className="font-medium">Category:</span>{' '}
                  {CATEGORY_DISPLAY_NAMES[claim.item?.category] || claim.item?.category}
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
                  <span className="break-words">{claim.item?.foundLocation}</span>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Found:</span>{' '}
                  {new Date(claim.item?.dateFound).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                {claim.item?.itemId && (
                  <p className="text-sm text-gray-600 break-all">
                    <span className="font-medium">Item ID:</span> {claim.item.itemId}
                  </p>
                )}
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Claim Information</span>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-gray-600 flex-shrink-0" />
                  <span>
                    Requested:{' '}
                    {new Date(claim.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
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
                   in SBI Lawn during working hours to collect your item.
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
                  onClick={() => onRemove(claim._id, claim.item?.name || 'this item')}
                  disabled={deletingClaim === claim._id}
                  className={`flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold flex-shrink-0 ${
                    deletingClaim === claim._id ? 'opacity-50 cursor-not-allowed' : ''
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
                <strong>Approved!</strong> This item is now in your possession. You have
                successfully claimed this item.
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
      </div>
    </div>
  );
};

export default ClaimCard;
