import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

const VARIANTS = {
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    btnClass: 'bg-red-600 hover:bg-red-700 text-white',
    DefaultIcon: AlertTriangle,
  },
  warning: {
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    btnClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    DefaultIcon: AlertCircle,
  },
  success: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    btnClass: 'bg-green-600 hover:bg-green-700 text-white',
    DefaultIcon: CheckCircle,
  },
};

/**
 * Reusable confirmation modal.
 *
 * Props:
 *   isOpen        – boolean, whether to show the modal
 *   title         – heading text
 *   subtitle      – optional small line beneath the heading
 *   description   – body text
 *   confirmLabel  – label for the confirm button (default: "Confirm")
 *   confirmIcon   – optional lucide icon component to prefix the confirm button
 *   cancelLabel   – label for the cancel button (default: "Cancel")
 *   variant       – 'danger' | 'warning' | 'success' (default: 'danger')
 *   onConfirm     – called when confirm button is clicked
 *   onCancel      – called when cancel button or backdrop is clicked
 *   children      – optional extra content rendered between description and buttons
 */
const ConfirmModal = ({
  isOpen,
  title,
  subtitle,
  description,
  confirmLabel = 'Confirm',
  confirmIcon: ConfirmIcon,
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  children,
}) => {
  if (!isOpen) return null;

  const { iconBg, iconColor, btnClass, DefaultIcon } =
    VARIANTS[variant] ?? VARIANTS.danger;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-full ${iconBg} flex items-center justify-center`}
          >
            <DefaultIcon className={iconColor} size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}

        {/* Extra slot (e.g. info box) */}
        {children}

        {/* Buttons */}
        <div className="flex gap-3 justify-end mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${btnClass}`}
          >
            {ConfirmIcon && <ConfirmIcon size={15} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
