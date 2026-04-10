/**
 * @file ImageUploadSection.jsx
 * @description Photo upload area for the Report Lost Item form.
 *
 * @component
 */
import React from 'react';
import { Upload, X } from 'lucide-react';

/**
 * Photo upload area and preview grid.
 *
 * Shows the upload label/input while fewer than 3 photos are attached.
 * Each uploaded photo can be individually removed.
 *
 * @component
 * @param {object}   props
 * @param {Array<{url: string}>} props.photos  - Currently attached photo objects.
 * @param {boolean}  props.uploading            - `true` while an upload is in-flight.
 * @param {Function} props.onUpload             - File input `onChange` handler (kept in parent).
 * @param {Function} props.onRemove             - Called with `(index)` to remove a photo.
 * @returns {JSX.Element}
 */
const ImageUploadSection = ({ photos, uploading, onUpload, onRemove }) => {
  return (
    <div className="mb-6">
      <label className="block mb-2 font-medium text-gray-700">
        Photos (Max 3, up to 5 MB each)
      </label>

      {photos.length < 3 && (
        <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 hover:border-gray-400 bg-gray-50">
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 mb-2 text-gray-500" />
            <span className="text-sm text-gray-500">
              {uploading ? 'Uploading...' : 'Click to upload photos'}
            </span>
            <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · max 5 MB each</span>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={onUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={photo.url}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadSection;
