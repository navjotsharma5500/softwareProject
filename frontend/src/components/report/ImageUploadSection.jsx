import React from 'react';
import { Upload, X } from 'lucide-react';

/**
 * Photo upload area for ReportLostItem.
 * Props:
 *   photos    – array of { url, ... }
 *   uploading – boolean
 *   onUpload  – (e: ChangeEvent) => void  (file input handler, kept in parent)
 *   onRemove  – (index: number) => void
 */
const ImageUploadSection = ({ photos, uploading, onUpload, onRemove }) => {
  return (
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
