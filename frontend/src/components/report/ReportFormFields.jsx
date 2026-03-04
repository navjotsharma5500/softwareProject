import React from 'react';
import { CATEGORIES, LOCATIONS, CATEGORY_DISPLAY_NAMES } from '../../utils/constants';

/**
 * All text/select fields for the ReportLostItem form.
 * Props:
 *   formData      – { itemDescription, category, location, dateLost, additionalDetails }
 *   onChange      – (e: ChangeEvent) => void
 */
const ReportFormFields = ({ formData, onChange }) => {
  return (
    <>
      {/* Item Description */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">
          Item Description *{' '}
          <span className="text-xs text-gray-500">({formData.itemDescription.length}/100)</span>
        </label>
        <input
          type="text"
          name="itemDescription"
          value={formData.itemDescription}
          onChange={onChange}
          maxLength={100}
          className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
          placeholder="e.g., Black iPhone 13 Pro"
          required
        />
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Category *</label>
        <input
          type="text"
          name="category"
          list="category-options"
          value={formData.category}
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
          required
        />
      </div>

      {/* Additional Details */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">
          Additional Details{' '}
          <span className="text-xs text-gray-500">({formData.additionalDetails.length}/500)</span>
        </label>
        <textarea
          name="additionalDetails"
          value={formData.additionalDetails}
          onChange={onChange}
          maxLength={500}
          rows="4"
          className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
          placeholder="Any distinguishing features, serial numbers, etc."
        />
      </div>
    </>
  );
};

export default ReportFormFields;
