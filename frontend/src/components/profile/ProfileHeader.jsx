/**
 * @file ProfileHeader.jsx
 * @description Profile page header card containing avatar, name, admin badge,
 * edit/save/cancel controls, and the field grid.
 *
 * @component
 */
import React from 'react';
import { User, Edit2, Save, X } from 'lucide-react';
import EditProfileForm from './EditProfileForm';

/**
 * Profile header panel with avatar, info, and inline edit controls.
 *
 * @component
 * @param {object}   props
 * @param {object}   props.profileData   - User object returned from server.
 * @param {object}   props.user          - Auth context user.
 * @param {boolean}  props.editing       - Whether the form is in edit mode.
 * @param {boolean}  props.saving        - `true` while the save API call is in-flight.
 * @param {Function} props.setEditing
 * @param {Function} props.handleSave
 * @param {Function} props.handleCancel
 * @param {{rollNo: string, phone: string}} props.formData
 * @param {Function} props.setFormData
 * @param {Function} props.onImageClick  - Called with `(images, index)` to open the lightbox.
 * @returns {JSX.Element}
 */
const ProfileHeader = ({
  profileData,
  user,
  editing,
  saving,
  setEditing,
  handleSave,
  handleCancel,
  formData,
  setFormData,
  onImageClick,
}) => {
  return (
    <div className="rounded-2xl shadow-lg p-4 sm:p-8 mb-8 bg-white overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6">
        {profileData?.profilePicture ? (
          <img
            src={profileData.profilePicture}
            alt={profileData.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 shadow-lg flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onImageClick([{ url: profileData.profilePicture }], 0)}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        ) : (
          <div className="w-24 h-24 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <User className="text-white" size={48} />
          </div>
        )}

        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="min-w-0 w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 break-words">
                {profileData?.name || user?.name}
              </h1>
              <p className="text-sm text-gray-600 break-all">
                {profileData?.email || user?.email}
              </p>
              {user?.isAdmin && (
                <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-semibold text-sm">
                  Admin
                </span>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
                >
                  <Edit2 size={18} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                  >
                    <X size={18} />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditProfileForm
        profileData={profileData}
        user={user}
        editing={editing}
        formData={formData}
        setFormData={setFormData}
      />
    </div>
  );
};

export default ProfileHeader;
