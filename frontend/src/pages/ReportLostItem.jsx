import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { reportApi } from '../utils/api';
import { uploadMultipleToImageKit } from '../utils/imagekit';
import { Upload, X, AlertCircle, ArrowLeft } from 'lucide-react';
import { CATEGORIES, LOCATIONS, CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import useFormPersistence from '../hooks/useFormPersistence.jsx';
import { useEffect } from 'react';

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

  useEffect(() => {
    // Scroll to the top of the page when the component is mounted
    window.scrollTo(0, 0);
  }, []);

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
          {/* Item Description */}
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">
              Item Description * <span className="text-xs text-gray-500">({formData.itemDescription.length}/100)</span>
            </label>
            <input
              type="text"
              name="itemDescription"
              value={formData.itemDescription}
              onChange={handleInputChange}
              maxLength={100}
              className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
              placeholder="e.g., Black iPhone 13 Pro"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">
              Category *
            </label>
            <input
              type="text"
              name="category"
              list="category-options"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
              placeholder="Select or type a category"
              required
              maxLength={50}
            />
            <datalist id="category-options">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <p className="text-xs mt-1 text-gray-500">
              {formData.category.length}/50 characters used
            </p>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">
              Where did you lose it? *
            </label>
            <input
              type="text"
              name="location"
              list="location-options"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
              placeholder="Select or type a location"
              required
              maxLength={100}
            />
            <datalist id="location-options">
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
            <p className="text-xs mt-1 text-gray-500">
              {formData.location.length}/100 characters used
            </p>
          </div>

          {/* Date Lost */}
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">
              When did you lose it? *
            </label>
            <input
              type="date"
              name="dateLost"
              value={formData.dateLost}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
              required
            />
          </div>

          {/* Additional Details */}
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">
              Additional Details <span className="text-xs text-gray-500">({formData.additionalDetails.length}/500)</span>
            </label>
            <textarea
              name="additionalDetails"
              value={formData.additionalDetails}
              onChange={handleInputChange}
              maxLength={500}
              rows="4"
              className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
              placeholder="Any distinguishing features, serial numbers, etc."
            />
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block mb-2 font-medium text-gray-700">
              Photos (Max 3)
            </label>
            
            {photos.length < 3 && (
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 hover:border-gray-400 bg-gray-50">
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {uploading ? 'Uploading...' : 'Click to upload photos'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}

            {/* Photo Previews */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

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
