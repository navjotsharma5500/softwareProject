import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Tag, MapPin, Calendar, Clock, FileText, Image as ImageIcon, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import ImageLightbox from '../components/ImageLightbox.jsx';
import { CATEGORY_DISPLAY_NAMES } from '../utils/constants';

const STATUS_STYLES = {
  active:   'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed:   'bg-gray-100 text-gray-700',
};

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900 font-medium break-words">{value || '—'}</p>
    </div>
  </div>
);

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/admin/reports/${id}`);
        setReport(res.data.report);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  // photos is [{url, fileId}] — extract just the URL strings for lightbox
  const photoUrls = report?.photos?.map(p => (typeof p === 'string' ? p : p.url)) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <FileText className="text-gray-300" size={56} />
        <p className="text-gray-500 text-lg">Report not found.</p>
        <button
          onClick={() => navigate('/admin/reports')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back button */}
        <button
          onClick={() => navigate('/admin/reports')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Reports</span>
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Report Details</h1>
            {report.reportId && (
              <p className="text-sm text-gray-500 mt-1 font-mono">ID: {report.reportId}</p>
            )}
          </div>
          <span className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold capitalize shrink-0 ${
            STATUS_STYLES[report.status] || 'bg-gray-100 text-gray-700'
          }`}>
            {report.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column – main details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Item Info Card */}
            <div className="rounded-xl shadow-md p-6 bg-white">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Item Information</h2>
              <div className="divide-y divide-gray-100">
                <DetailRow icon={FileText} label="Description" value={report.itemDescription} />
                <DetailRow icon={Tag} label="Category" value={CATEGORY_DISPLAY_NAMES[report.category] || report.category} />
                <DetailRow icon={MapPin} label="Location Lost" value={report.location} />
                <DetailRow icon={Calendar} label="Date Lost" value={report.dateLost ? new Date(report.dateLost).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                <DetailRow icon={Clock} label="Reported At" value={new Date(report.createdAt).toLocaleString()} />
                {report.additionalDetails && (
                  <DetailRow icon={Info} label="Additional Details" value={report.additionalDetails} />
                )}
              </div>
            </div>

            {/* Images Card */}
            {photoUrls.length > 0 ? (
              <div className="rounded-xl shadow-md p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon size={16} className="text-gray-500" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Photos <span className="text-gray-400 font-normal text-sm">({photoUrls.length})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photoUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={e => { e.target.onerror = null; e.target.src = '/no-image.png'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl shadow-md p-6 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon size={16} className="text-gray-400" />
                  <h2 className="text-base font-semibold text-gray-900">Photos</h2>
                </div>
                <p className="text-sm text-gray-400">No photos uploaded for this report.</p>
              </div>
            )}
          </div>

          {/* Right column – reporter info */}
          <div className="space-y-6">
            <div className="rounded-xl shadow-md p-6 bg-white">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Reporter</h2>
              <div className="divide-y divide-gray-100">
                <DetailRow icon={User} label="Name" value={report.user?.name} />
                <DetailRow icon={Mail} label="Email" value={report.user?.email} />
              </div>
            </div>

            </div>
        </div>
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={photoUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default ReportDetail;
