/**
 * @file StatusBadge.jsx
 * @description Coloured pill badge for claim status (approved / rejected /
 * pending).
 *
 * @component
 */
import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * Inline status badge with an icon and colour-coded text.
 *
 * @component
 * @param {object} props
 * @param {'approved'|'rejected'|'pending'|string} props.status - Claim status value.
 * @returns {JSX.Element}
 */
const StatusBadge = ({ status }) => {
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

export default StatusBadge;
