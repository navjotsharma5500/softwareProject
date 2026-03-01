import React from 'react';
import { Search, RefreshCw, Users, CheckCircle, XCircle } from 'lucide-react';
import ClaimCard from './ClaimCard';
import Pagination from './Pagination';

const HEADING_MAP = {
  pending: 'Pending Claims',
  approved: 'Approved Claims',
  rejected: 'Rejected Claims',
};

const REFRESH_TITLE_MAP = {
  pending: 'Refresh claims',
  approved: 'Refresh approved claims',
  rejected: 'Refresh rejected claims',
};

const EMPTY_STATE = {
  pending: { Icon: Users, message: 'No pending claims' },
  approved: { Icon: CheckCircle, message: 'No approved claims' },
  rejected: { Icon: XCircle, message: 'No rejected claims' },
};

const ClaimsTab = ({
  status,
  claims,
  loading,
  claimsPagination,
  claimsPage,
  setClaimsPage,
  claimSearchInput,
  handleClaimSearchChange,
  showClaimFilters,
  setShowClaimFilters,
  onClearFilters,
  handleRefresh,
  refreshing,
  refreshCooldown,
  onApprove,
  onReject,
  onViewUser,
  CATEGORY_DISPLAY_NAMES,
}) => {
  const heading = HEADING_MAP[status];
  const { Icon: EmptyIcon, message: emptyMessage } = EMPTY_STATE[status];

  return (
    <div className="rounded-xl shadow-md p-6 bg-white">
      {/* Filters */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        <button
          onClick={() => setShowClaimFilters(prev => !prev)}
          className="text-sm text-gray-600 hover:underline"
        >
          {showClaimFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showClaimFilters && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by Claim ID, Item ID, claimant name..."
                value={claimSearchInput}
                onChange={(e) => handleClaimSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white border-gray-300"
              />
            </div>
          </div>
          <button
            onClick={onClearFilters}
            className="px-4 py-2 rounded-lg font-semibold transition-all bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Heading + Refresh */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {heading} {claimsPagination.total ? `(${claimsPagination.total})` : ''}
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing || refreshCooldown}
          className={`p-2 rounded-lg font-semibold transition-all bg-gray-100 hover:bg-gray-200 text-gray-700 ${refreshing || refreshCooldown ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={REFRESH_TITLE_MAP[status]}
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-12">
          <EmptyIcon className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-xl text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <ClaimCard
              key={claim._id}
              claim={claim}
              status={status}
              onApprove={onApprove}
              onReject={onReject}
              onViewUser={onViewUser}
              CATEGORY_DISPLAY_NAMES={CATEGORY_DISPLAY_NAMES}
            />
          ))}
        </div>
      )}

      {!loading && claims.length > 0 && (
        <Pagination
          page={claimsPage}
          pagination={claimsPagination}
          onPrev={() => setClaimsPage(prev => prev - 1)}
          onNext={() => setClaimsPage(prev => prev + 1)}
        />
      )}
    </div>
  );
};

export default ClaimsTab;
