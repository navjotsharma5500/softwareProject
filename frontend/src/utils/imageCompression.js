import imageCompression from "browser-image-compression";

/**
 * Compress an image file to under 1MB before uploading to ImageKit.
 * @param {File} imageFile - The original image file from input.
 * @returns {Promise<File>} - The compressed image file.
 */
export async function compressImageTo1MB(imageFile) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    throw error;
  }
}
