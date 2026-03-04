import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { reportApi } from '../utils/api';
import { uploadMultipleToImageKit } from '../utils/imagekit';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { CATEGORIES, CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import useFormPersistence from '../hooks/useFormPersistence.jsx';
import ReportFormFields from '../components/report/ReportFormFields';
import ImageUploadSection from '../components/report/ImageUploadSection';

const ReportLostItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Use ref to prevent spam submissions
  const isSubmittingRef = useRef(false);
  const [photos, setPhotos, photosControls] = useFormPersistence('reportLost_photos', []);
  const [formData, setFormData, formControls] = useFormPersistence('reportLost_form', {
    itemDescription: '',
    category: '',
    location: '',
    dateLost: '',
    additionalDetails: '',
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (photos.length + files.length > 3) {
      toast.error('Maximum 3 photos allowed');
      return;
    }

    setUploading(true);
    try {
      // Get ImageKit authentication parameters from backend
      const fileTypes = files.map(f => f.type);
      const { data } = await reportApi.getUploadUrls(files.length, fileTypes);
      
      // Upload files directly to ImageKit
      const uploadedUrls = await uploadMultipleToImageKit(files, data.uploadParams);
      
      setPhotos([...photos, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} photo(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload photos');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If not logged in, redirect to login with redirect back to this page
    if (!user) {
      navigate(`/login?redirect=/report-lost-item`);
      return;
    }

    // Prevent spam submissions
    if (isSubmittingRef.current || loading) {
      console.log('Duplicate submission blocked');
      return;
    }

    if (!formData.itemDescription || !formData.category || !formData.location || !formData.dateLost) {
      toast.error('Please fill all required fields');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      // Normalize category to expected enum key (defensive: handle numeric indices or display labels)
      let categoryToSend = formData.category;

      // If numeric (string or number), treat as index into CATEGORIES
      if (typeof categoryToSend === 'number' || /^\d+$/.test(String(categoryToSend))) {
        const idx = parseInt(String(categoryToSend), 10);
        if (!isNaN(idx) && CATEGORIES[idx]) {
          categoryToSend = CATEGORIES[idx];
        }
      }

      // If a display name (e.g. "Electronics"), map back to the key
      if (typeof categoryToSend === 'string') {
        const foundKey = Object.keys(CATEGORY_DISPLAY_NAMES).find(
          (k) => CATEGORY_DISPLAY_NAMES[k].toLowerCase() === categoryToSend.toLowerCase()
        );
        if (foundKey) categoryToSend = foundKey;
      }

      // Final validation: ensure categoryToSend is not empty
      if (!categoryToSend || categoryToSend.trim() === '') {
        toast.error('Category cannot be empty');
        setLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      const payload = {
        ...formData,
        category: categoryToSend,
        photos,
      };

      await reportApi.createReport(payload);
      
      toast.success('Report submitted successfully! Redirecting to your profile...');
      // clear persisted draft after successful submit
      formControls.clear();
      photosControls.clear();
      
      // Reset form to initial state
      setFormData({
        itemDescription: '',
        category: '',
        location: '',
        dateLost: '',
        additionalDetails: '',
      });
      setPhotos([]);
      
      // Redirect to profile page with reports section selected
      setTimeout(() => {
        navigate('/profile?section=reports');
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          Report Lost Item
        </h1>

        <form onSubmit={handleSubmit} className="p-6 rounded-lg shadow-md bg-white">
          <ReportFormFields formData={formData} onChange={handleInputChange} />

          <ImageUploadSection
            photos={photos}
            uploading={uploading}
            onUpload={handlePhotoUpload}
            onRemove={removePhoto}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
            
           <div className="h-6" />
          {/* Info */}
          <div className="flex items-start gap-2 p-4 rounded-lg mb-6 bg-gray-100 text-gray-800">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
            <p className="text-sm">
              Most people who find lost items hand them to campus guards or administrators instead of checking the website or emails. Administrators do not actively search for your lost item—it is your responsibility to check the portal and submit a claim. Filing a report before the item appears online can help establish credibility when claiming it. Your report is private and visible only to you and administrators, ensuring security and confidentiality.
             </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportLostItem;
