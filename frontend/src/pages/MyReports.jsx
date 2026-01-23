import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { toast } from 'react-toastify';
import { reportApi } from '../utils/api';
import { FileText, Calendar, MapPin, Tag, Trash2, AlertCircle } from 'lucide-react';
import { CATEGORY_DISPLAY_NAMES, LOCATIONS } from '../utils/constants';
import ImageLightbox from '../components/ImageLightbox';

const MyReports = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchReports = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const { data } = await reportApi.getMyReports(params);
      setReports(data.reports);
      setPagination({
        page: data.currentPage,
        totalPages: data.totalPages,
      });
    } catch (error) {
      toast.error('Failed to fetch reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await reportApi.deleteReport(id);
      toast.success('Report deleted successfully');
      fetchReports(pagination.page);
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
      case 'resolved':
        return darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'closed':
        return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
      default:
        return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              My Reports
            </h1>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Track all your lost item reports
            </p>
          </div>
          <button
            onClick={() => navigate('/report-lost-item')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Report
          </button>
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Reports</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading reports...
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <FileText className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No reports found
            </p>
            <button
              onClick={() => navigate('/report-lost-item')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Report
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report._id}
                className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {report.itemDescription}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className={`space-y-2 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        <span>{CATEGORY_DISPLAY_NAMES[report.category] || report.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{LOCATIONS[report.location] || report.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Lost on: {new Date(report.dateLost).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {report.additionalDetails && (
                      <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {report.additionalDetails}
                      </p>
                    )}

                    {/* Photos */}
                    {report.photos && report.photos.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {report.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setLightboxImages(report.photos);
                              setLightboxIndex(index);
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            draggable={false}
                          />
                        ))}
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Reported on: {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => handleDelete(report._id)}
                      className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                      title="Delete Report"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => fetchReports(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-4 py-2 rounded-lg ${
                pagination.page === 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Previous
            </button>
            <span className={`px-4 py-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchReports(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-4 py-2 rounded-lg ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className={`mt-6 p-4 rounded-lg ${
          darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-800'
        }`}>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">About Reports</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your reports are only visible to you and administrators</li>
                <li>Admin can see your reports when reviewing claims</li>
                <li>Keep reports active until your item is found</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxImages && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
};

export default MyReports;
