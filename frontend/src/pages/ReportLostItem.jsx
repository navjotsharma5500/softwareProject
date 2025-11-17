import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { toast } from 'react-toastify';
import { reportApi } from '../utils/api';
import { Upload, X, AlertCircle } from 'lucide-react';
import { CATEGORIES, LOCATIONS, CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import useFormPersistence from '../hooks/useFormPersistence.jsx';

const ReportLostItem = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      // Get presigned URLs
      const fileTypes = files.map(f => f.type);
      const { data } = await reportApi.getUploadUrls(files.length, fileTypes);
      
      // Upload files to S3
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const response = await fetch(data.uploadUrls[i].uploadUrl, {
          method: 'PUT',
          body: files[i],
          headers: {
            'Content-Type': files[i].type,
          },
        });
        
        if (response.ok) {
          uploadedUrls.push(data.uploadUrls[i].fileUrl);
        }
      }
      
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
    
    if (!formData.itemDescription || !formData.category || !formData.location || !formData.dateLost) {
      toast.error('Please fill all required fields');
      return;
    }

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

      // Final validation: ensure categoryToSend is one of CATEGORIES
      if (!CATEGORIES.includes(categoryToSend)) {
        toast.error('Invalid category selected');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        category: categoryToSend,
        photos,
      };

      // debug: show payload in console to help diagnose server errors
      // eslint-disable-next-line no-console
      console.debug('Creating report payload:', payload);

      await reportApi.createReport(payload);
      
      toast.success('Report submitted successfully! View it in your profile.');
      // clear persisted draft after successful submit
      formControls.clear();
      photosControls.clear();
      
      // Reset form to initial state instead of navigating away
      setFormData({
        itemDescription: '',
        category: '',
        location: '',
        dateLost: '',
        additionalDetails: '',
      });
      setPhotos([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Report Lost Item
        </h1>

        <form onSubmit={handleSubmit} className={`p-6 rounded-lg shadow-md ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Item Description */}
          <div className="mb-4">
            <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Item Description *
            </label>
            <input
              type="text"
              name="itemDescription"
              value={formData.itemDescription}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="e.g., Black iPhone 13 Pro"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_DISPLAY_NAMES[cat] || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Where did you lose it? *
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            >
              <option value="">Select location</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Date Lost */}
          <div className="mb-4">
            <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              When did you lose it? *
            </label>
            <input
              type="date"
              name="dateLost"
              value={formData.dateLost}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>

          {/* Additional Details */}
          <div className="mb-4">
            <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Additional Details
            </label>
            <textarea
              name="additionalDetails"
              value={formData.additionalDetails}
              onChange={handleInputChange}
              rows="4"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Any distinguishing features, serial numbers, etc."
            />
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
            <label className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Photos (Max 3)
            </label>
            
            {photos.length < 3 && (
              <label className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                darkMode
                  ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}>
                <div className="flex flex-col items-center">
                  <Upload className={`w-8 h-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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

          {/* Info */}
          <div className={`flex items-start gap-2 p-4 rounded-lg mb-6 ${
            darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-800'
          }`}>
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              Your report will be visible only to you and administrators. If someone finds an item matching your description, admin can verify your report.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportLostItem;
