/**
 * @file ImageLightbox.jsx
 * @description Fullscreen image lightbox with keyboard navigation, backdrop
 * dismissal, and image-scraping protections.
 *
 * @component
 */
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ImageLightbox Component
 *
 * Displays a fullscreen modal lightbox for browsing a collection of images.
 *
 * Features:
 * - Keyboard navigation: ArrowLeft / ArrowRight to cycle images, Escape to close.
 * - Click-outside (backdrop) dismissal.
 * - Prevents body scroll while open.
 * - Prevents right-click, drag, and mouse-down selection on images to deter scraping.
 * - Supports both plain URL strings and objects with a `.url` property in the images array.
 *
 * @param {Array<string|{url: string}>} images       - Array of image URLs or objects containing a `url` field.
 * @param {number}                      initialIndex - Zero-based index of the image to show first (default: 0).
 * @param {Function}                    onClose      - Callback invoked when the lightbox should close.
 *                                                     Wrap the definition in useCallback in the parent component
 *                                                     to avoid unnecessary re-registrations of the keyboard listener.
 */
const ImageLightbox = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  /**
   * Navigate to the previous image, wrapping around from the first to the last.
   * Memoised with useCallback so it can be safely listed as a dependency of the
   * keyboard-listener effect without causing infinite re-registration loops.
   */
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  /**
   * Navigate to the next image, wrapping around from the last to the first.
   * Memoised with useCallback for the same reason as handlePrevious.
   */
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  /**
   * Lock body scroll while the lightbox is mounted to prevent the page behind
   * the overlay from scrolling. The overflow style is restored on unmount.
   */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  /**
   * Register a global keyboard listener for lightbox navigation controls.
   *
   * Dependencies:
   *  - handleNext / handlePrevious  – memoised, only change when images.length changes.
   *  - onClose                      – supplied by the parent; wrap it in useCallback
   *                                   there if it causes unnecessary re-registrations.
   *
   * The listener is cleaned up and re-registered whenever any dependency changes.
   */
  useEffect(() => {
    /**
     * Handle keydown events:
     *  - Escape     → close the lightbox
     *  - ArrowLeft  → go to the previous image
     *  - ArrowRight → go to the next image
     */
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, onClose]);

  /**
   * Close the lightbox when the user clicks directly on the dark backdrop,
   * but not when they click on the image or any controls inside it.
   *
   * @param {React.SyntheticEvent} e - The click event.
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    /*
     * Backdrop overlay – covers the full viewport. Clicking directly on this
     * element (not on any child) triggers handleBackdropClick → onClose.
     */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={handleBackdropClick}
    >
      {/* Close button – always visible in the top-right corner */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors z-50"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/*
       * Navigation buttons – only rendered when there is more than one image.
       * Each button calls its memoised handler so the keyboard effect's
       * dependency list stays stable.
       */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors z-50"
            aria-label="Previous image"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors z-50"
            aria-label="Next image"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Image container – constrained to 90 vh to keep the image on-screen */}
      <div className="relative max-w-7xl max-h-[90vh] w-full px-16">
        <img
          src={typeof images[currentIndex] === 'object' ? images[currentIndex].url : images[currentIndex]}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          className="w-full h-full object-contain rounded-lg"
          style={{ maxHeight: '90vh' }}
          /* Disable right-click context menu to deter direct URL copying */
          onContextMenu={(e) => e.preventDefault()}
          /* Disable drag-and-drop to prevent easy image extraction */
          draggable={false}
          /* Disable mouse-down text/image selection */
          onMouseDown={(e) => e.preventDefault()}
        />

        {/* Image counter badge – shown only when multiple images exist */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gray-800 text-white rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageLightbox;
