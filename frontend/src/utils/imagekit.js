/**
 * ImageKit Upload Utility
 * Handles direct client-side uploads to ImageKit
 */

/**
 * Upload a file to ImageKit using authentication parameters from backend
 * @param {File} file - The file to upload
 * @param {Object} authParams - Authentication parameters from backend
 * @returns {Promise<string>} - The uploaded file URL
 */
export const uploadToImageKit = async (file, authParams) => {
  const { token, signature, expire, folder, fileName, publicKey, urlEndpoint } =
    authParams;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("publicKey", publicKey);
  formData.append("signature", signature);
  formData.append("expire", expire);
  formData.append("token", token);
  formData.append("fileName", fileName);
  formData.append("folder", folder);

  try {
    const response = await fetch(
      "https://upload.imagekit.io/api/v1/files/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload failed");
    }

    const result = await response.json();
    // Return object with url and fileId
    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw error;
  }
};

/**
 * Upload multiple files to ImageKit
 * @param {File[]} files - Array of files to upload
 * @param {Object[]} authParamsArray - Array of auth parameters from backend
 * @returns {Promise<string[]>} - Array of uploaded file URLs
 */
export const uploadMultipleToImageKit = async (files, authParamsArray) => {
  const uploadPromises = files.map((file, index) =>
    uploadToImageKit(file, authParamsArray[index]),
  );
  // Return array of objects [{url, fileId, name}, ...]
  return Promise.all(uploadPromises);
};
