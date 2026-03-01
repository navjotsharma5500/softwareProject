import React from 'react';
import { CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';

const CARD_CLASS = {
  pending: 'border rounded-lg p-6 hover:shadow-md transition-shadow border-gray-200',
  approved: 'border rounded-lg p-6 border-green-200 bg-green-50',
  rejected: 'border rounded-lg p-6 border-red-200 bg-red-50',
};

const ClaimCard = ({ claim, status, onApprove, onReject, onViewUser, CATEGORY_DISPLAY_NAMES }) => {
  return (
    <div className={CARD_CLASS[status]}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{claim.item?.name}</h3>
        {claim.claimId && (
          <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {claim.claimId}
          </span>
        )}
        {status === 'approved' && (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Approved</span>
        )}
        {status === 'rejected' && (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Rejected</span>
        )}
      </div>

      {/* Details grid — stacks on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Claimant</span>
          <button
            onClick={() => onViewUser(claim.claimant?._id, claim.claimant?.name)}
            className="font-medium hover:underline text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-0.5"
          >
            {claim.claimant?.name}
            <FileText size={13} />
          </button>
          <p className="text-sm text-gray-600">{claim.claimant?.email}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Item Details</span>
          <p className="text-sm text-gray-900 mt-0.5">ID: <span className="font-mono">{claim.item?.itemId}</span></p>
          <p className="text-sm text-gray-900">Category: {CATEGORY_DISPLAY_NAMES[claim.item?.category] || claim.item?.category}</p>
          <p className="text-sm text-gray-900">Location: {claim.item?.foundLocation}</p>
          <p className="text-sm text-gray-900">Date: {new Date(claim.item?.dateFound).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Timestamp */}
      {status === 'pending' && (
        <p className="text-xs text-gray-500 mb-3">Claimed on: {new Date(claim.createdAt).toLocaleString()}</p>
      )}
      {status === 'approved' && (
        <p className="text-xs text-gray-500 mb-3">Approved on: {new Date(claim.updatedAt).toLocaleString()}</p>
      )}
      {status === 'rejected' && (
        <p className="text-xs text-gray-500 mb-3">Rejected on: {new Date(claim.updatedAt).toLocaleString()}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onViewUser(claim.claimant?._id, claim.claimant?.name)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
        >
          <ExternalLink size={16} />
          View Claimant
        </button>
        {status === 'pending' && (
          <>
            <button
              onClick={() => onApprove(claim)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <CheckCircle size={16} />
              Approve
            </button>
            <button
              onClick={() => onReject(claim)}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <XCircle size={16} />
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ClaimCard;
