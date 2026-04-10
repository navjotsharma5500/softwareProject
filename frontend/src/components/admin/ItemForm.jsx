/**
 * @file ItemForm.jsx
 * @description Multi-purpose admin modal for item CRUD and claim
 * approve/reject actions.
 *
 * @component
 */
import React from 'react';
import { CATEGORIES, LOCATIONS } from '../../utils/constants';

/**
 * Modal dialog for create / edit / delete items and approve / reject claims.
 *
 * The `modalType` prop switches the rendered form/content:
 * - `'create'` / `'edit'` — item name, category, location, description, date, status fields.
 * - `'delete'` — confirmation prompt.
 * - `'approve'` / `'reject'` — claim detail with optional remark textarea;
 *   uses `approveCooldown` / `rejectCooldown` to prevent rapid re-submission.
 *
 * @component
 * @param {object}   props
 * @param {boolean}  props.showModal
 * @param {Function} props.onClose
 * @param {'create'|'edit'|'delete'|'approve'|'reject'} props.modalType
 * @param {object}   props.formData         - Item form field values.
 * @param {Function} props.setFormData
 * @param {object}   props.selectedItem     - Current item or claim object.
 * @param {boolean}  props.submitting
 * @param {Function} props.onCreateItem
 * @param {Function} props.onUpdateItem
 * @param {Function} props.onDeleteItem
 * @param {string}   props.remarkText       - Remark for approve/reject reason.
 * @param {Function} props.setRemarkText
 * @param {boolean}  props.approveCooldown  - `true` while approve API call is in-flight.
 * @param {boolean}  props.rejectCooldown   - `true` while reject API call is in-flight.
 * @param {Function} props.onApproveClaim   - Called with `(claimId)`.
 * @param {Function} props.onRejectClaim    - Called with `(claimId)`.
 * @returns {JSX.Element|null}
 */
const ItemForm = ({
  showModal,
  onClose,
  modalType,
  formData,
  setFormData,
  selectedItem,
  submitting,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  remarkText,
  setRemarkText,
  approveCooldown,
  rejectCooldown,
  onApproveClaim,
  onRejectClaim,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto max-w-2xl bg-white">

        {/* Create / Edit Item Form */}
        {(modalType === 'create' || modalType === 'edit') && (
          <form
            onSubmit={modalType === 'create' ? onCreateItem : onUpdateItem}
            className="p-6"
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-900">
              {modalType === 'create' ? 'Add New Item' : 'Edit Item'}
            </h3>

            <div className="space-y-4">
              {modalType === 'edit' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Item ID</label>
                  <input
                    type="text"
                    value={formData.itemId}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 border-gray-300 text-gray-900 opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs mt-1 text-gray-500">Item ID is auto-generated and cannot be changed</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                  placeholder="Phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Category *</label>
                <input
                  type="text"
                  list="admin-category-options"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                  placeholder="Select or type a category"
                />
                <datalist id="admin-category-options">
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <p className="text-xs mt-1 text-gray-500">Select from list or type your own</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Found Location *</label>
                <input
                  type="text"
                  list="admin-location-options"
                  required
                  value={formData.foundLocation}
                  onChange={(e) => setFormData({ ...formData, foundLocation: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                  placeholder="Select or type a location"
                />
                <datalist id="admin-location-options">
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
                <p className="text-xs mt-1 text-gray-500">Select from list or type your own</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Date Found *</label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.dateFound}
                  onChange={(e) => setFormData({ ...formData, dateFound: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                />
                <p className="text-xs mt-1 text-gray-500">Date cannot be in the future</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                  rows="3"
                  placeholder="Additional details..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'
                }`}
              >
                {submitting && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {submitting ? 'Submitting...' : modalType === 'create' ? 'Create Item' : 'Update Item'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className={`px-4 py-2 border rounded-lg transition-colors border-gray-300 text-gray-700 hover:bg-gray-50 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation */}
        {modalType === 'delete' && (
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Delete Item</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &ldquo;{selectedItem?.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onDeleteItem}
                disabled={submitting}
                className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-700'
                }`}
              >
                {submitting && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={onClose}
                disabled={submitting}
                className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-lg transition-colors ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Approve / Reject Claim */}
        {(modalType === 'approve' || modalType === 'reject') && (
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              {modalType === 'approve' ? 'Approve Claim' : 'Reject Claim'}
            </h3>
            <p className="mb-4 text-gray-600">
              {modalType === 'approve'
                ? `Approve claim by ${selectedItem?.claimant?.name} for "${selectedItem?.item?.name}"?`
                : `Reject claim by ${selectedItem?.claimant?.name} for "${selectedItem?.item?.name}"?`}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Remarks (optional)</label>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white border-gray-300 text-gray-900"
                rows="3"
                placeholder="Add remarks..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  modalType === 'approve'
                    ? onApproveClaim(selectedItem._id)
                    : onRejectClaim(selectedItem._id)
                }
                disabled={modalType === 'approve' ? approveCooldown : rejectCooldown}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  modalType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } ${(modalType === 'approve' ? approveCooldown : rejectCooldown) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {modalType === 'approve' ? 'Approve' : 'Reject'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg transition-colors border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemForm;
