          /**
           * @file EditProfileForm.jsx
           * @description Profile info grid that switches between display and edit
           * mode for the rollNo and phoneNumber fields.
           *
           * @component
           */
          import React from 'react';
          import { User, Mail, IdCard, Phone } from 'lucide-react';

          /**
           * 4-field info grid: Name (read-only), Email (read-only), Roll No, Phone.
           *
           * In edit mode Roll No and Phone become text inputs bound to `formData`.
           *
           * @component
           * @param {object}   props
           * @param {object}   props.profileData  - User object returned from the server.
           * @param {object}   props.user         - Auth context user.
           * @param {boolean}  props.editing      - Whether the form is in edit mode.
           * @param {{rollNo: string, phone: string}} props.formData - Editable field values.
           * @param {Function} props.setFormData  - Setter for `formData`.
           * @returns {JSX.Element}
           */
          const EditProfileForm = ({ profileData, user, editing, formData, setFormData }) => {
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name (always read-only) */}
                <div>
                  <label className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                    <User size={18} />
                    Full Name
                  </label>
                  <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900 break-words">
                    {profileData?.name || user?.name}
                    <span className="ml-2 text-xs text-gray-400">(Cannot be changed)</span>
                  </p>
                </div>

                {/* Email (always read-only) */}
                <div>
                  <label className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                    <Mail size={18} />
                    Email Address
                  </label>
                  <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-600 break-all">
                    {profileData?.email || user?.email}
                    <span className="ml-2 text-xs">(Cannot be changed)</span>
                  </p>
                </div>

                {/* Roll Number */}
                <div>
                  <label className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                    <IdCard size={18} />
                    Roll Number/Email
                  </label>
                  {editing ? (
                    <div>
                      <input
                        type="text"
                        name="rollNo"
                        value={formData.rollNo || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setFormData((prev) => ({ ...prev, rollNo: value }));
                        }}
                        placeholder="Enter your roll number (e.g., 6767676767)"
                        maxLength="10"
                        className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
                      />
                      {formData.rollNo && (
                        <p
                          className={`text-xs mt-1 ${
                              (formData.rollNo.length === 9 || formData.rollNo.length === 10)
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formData.rollNo.length} / 9-10 digits
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900 break-all">
                      {profileData?.rollNo && profileData.rollNo !== '0'
                        ? profileData.rollNo
                        : 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                    <Phone size={18} />
                    Phone Number (Optional)
                  </label>
                  {editing ? (
                    <div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setFormData((prev) => ({ ...prev, phone: value }));
                        }}
                        placeholder="Enter 10 digit phone number (e.g., 9876543210)"
                        maxLength="10"
                        className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900"
                      />
                      {formData.phone && (
                        <p
                          className={`text-xs mt-1 ${
                            formData.phone.length === 10 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formData.phone.length} / 10 digits
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900 break-all">
                      {profileData?.phone || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            );
          };  

          export default EditProfileForm;
