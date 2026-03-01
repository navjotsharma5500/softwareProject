import React from 'react';
import { Trash2, CheckCircle } from 'lucide-react';

const ReportCard = ({ report, onDelete, deletingReport, onResolve, resolvingReport, CATEGORY_DISPLAY_NAMES, onImageClick }) => {
  const isActive = report.status === 'active';

  return (
    <div className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
              {report.itemDescription}
            </h3>
            {report.reportId && (
              <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded break-all">
                {report.reportId}
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                report.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : report.status === 'resolved'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {report.status === 'active' ? 'Active' : report.status === 'resolved' ? 'Resolved' : report.status}
            </span>
          </div>

          <div className="space-y-2 mb-4 text-gray-600 text-sm sm:text-base">
            <p className="break-words">
              <strong>Category:</strong>{' '}
              {CATEGORY_DISPLAY_NAMES[report.category] || report.category}
            </p>
            <p className="break-words">
              <strong>Location:</strong> {report.location}
            </p>
            <p>
              <strong>Lost on:</strong>{' '}
              {new Date(report.dateLost).toLocaleDateString()}
            </p>
            {report.additionalDetails && (
              <p className="text-sm break-words">
                <strong>Details:</strong> {report.additionalDetails}
              </p>
            )}
          </div>

          {report.photos && report.photos.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {report.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                  onClick={() => onImageClick(report.photos, index)}
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 break-words">
            Reported on: {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
          {/* Mark as Resolved Button - only for active reports */}
          {isActive && onResolve && (
            <button
              onClick={() => onResolve(report._id, report.itemDescription)}
              disabled={resolvingReport === report._id}
              className={`flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold w-full sm:w-auto ${
                resolvingReport === report._id ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Mark this report as resolved (item found)"
            >
              <CheckCircle
                size={16}
                className={resolvingReport === report._id ? 'animate-spin' : ''}
              />
              {resolvingReport === report._id ? 'Resolving...' : 'Mark Resolved'}
            </button>
          )}

          {/* Delete Report Button - hidden for resolved reports */}
          {report.status !== 'resolved' && (
          <button
            onClick={() => onDelete(report._id, report.itemDescription)}
            disabled={deletingReport === report._id}
            className={`flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold w-full sm:w-auto ${
              deletingReport === report._id ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Delete this report"
          >
            <Trash2
              size={16}
              className={deletingReport === report._id ? 'animate-spin' : ''}
            />
            {deletingReport === report._id ? 'Deleting...' : 'Delete'}
          </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
