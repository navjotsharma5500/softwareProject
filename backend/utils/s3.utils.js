// ============================
// OLD S3 CODE (DEPRECATED - Now using ImageKit)
// ============================
// import {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
// } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import crypto from "crypto";

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// /**
//  * Generate a presigned URL for uploading a file to S3
//  * @param {string} folder - Folder name in S3 bucket
//  * @param {string} fileType - MIME type of the file
//  * @returns {Promise<{uploadUrl: string, fileKey: string, fileUrl: string}>}
//  */
// export const generateUploadUrl = async (folder = "reports", fileType) => {
//   const fileKey = `${folder}/${crypto
//     .randomBytes(16)
//     .toString("hex")}-${Date.now()}`;

//   const command = new PutObjectCommand({
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: fileKey,
//     ContentType: fileType,
//   });

//   try {
//     const uploadUrl = await getSignedUrl(s3Client, command, {
//       expiresIn: 3600,
//     }); // 1 hour
//     const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

//     return {
//       uploadUrl,
//       fileKey,
//       fileUrl,
//     };
//   } catch (error) {
//     console.error("Error generating upload URL:", error);
//     throw new Error("Failed to generate upload URL");
//   }
// };

// /**
//  * Delete a file from S3
//  * @param {string} fileKey - The S3 key of the file to delete
//  */
// export const deleteFile = async (fileKey) => {
//   const command = new DeleteObjectCommand({
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: fileKey,
//   });

//   try {
//     await s3Client.send(command);
//   } catch (error) {
//     console.error("Error deleting file from S3:", error);
//     throw new Error("Failed to delete file");
//   }
// };

// /**
//  * Extract S3 key from full URL
//  * @param {string} url - Full S3 URL
//  * @returns {string} - S3 key
//  */
// export const extractKeyFromUrl = (url) => {
//   if (!url) return null;
//   const urlParts = url.split(".amazonaws.com/");
//   return urlParts.length > 1 ? urlParts[1] : null;
// };

// ============================
// NEW IMAGEKIT CODE
// ============================
import ImageKit from "imagekit";
import crypto from "crypto";

// Initialize ImageKit instance
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Generate authentication parameters for client-side upload to ImageKit
 * @param {string} folder - Folder name in ImageKit
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<{token: string, expire: number, signature: string, folder: string, fileName: string}>}
 */
export const generateUploadUrl = async (folder = "reports", fileType) => {
  try {
    // Generate unique filename
    const fileName = `${crypto.randomBytes(16).toString("hex")}-${Date.now()}`;
    
    // Get authentication parameters for client-side upload
    const authParams = imagekit.getAuthenticationParameters();
    
    return {
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      folder: folder,
      fileName: fileName,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    };
  } catch (error) {
    console.error("Error generating ImageKit upload params:", error);
    throw new Error("Failed to generate upload parameters");
  }
};

/**
 * Delete a file from ImageKit
 * @param {string} fileId - The ImageKit file ID to delete
 */
export const deleteFile = async (fileId) => {
  try {
    await imagekit.deleteFile(fileId);
    console.log(`Successfully deleted file: ${fileId}`);
  } catch (error) {
    console.error("Error deleting file from ImageKit:", error);
    throw new Error("Failed to delete file");
  }
};

/**
 * Extract ImageKit file ID from full URL
 * @param {string} url - Full ImageKit URL
 * @returns {string} - ImageKit file ID (extracted from URL path)
 */
export const extractKeyFromUrl = (url) => {
  if (!url) return null;
  
  // ImageKit URLs typically look like: https://ik.imagekit.io/your_id/folder/filename.jpg
  // We need to extract the file ID which is usually in the path after the domain
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Return the last part as the file identifier
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error("Error extracting file ID from URL:", error);
    return null;
  }
};

/**
 * Upload a file buffer directly to ImageKit (server-side upload)
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Name of the file
 * @param {string} folder - Folder path in ImageKit
 * @returns {Promise<{fileUrl: string, fileId: string}>}
 */
export const uploadFileBuffer = async (fileBuffer, fileName, folder = "reports") => {
  try {
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    });

    return {
      fileUrl: result.url,
      fileId: result.fileId,
      filePath: result.filePath,
    };
  } catch (error) {
    console.error("Error uploading file to ImageKit:", error);
    throw new Error("Failed to upload file");
  }
};
