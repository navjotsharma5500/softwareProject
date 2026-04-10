/**
 * @module utils/s3
 * @description ImageKit file-management utilities for the Lost & Found Portal.
 *
 * This module replaced an earlier AWS S3 implementation; the original S3 code
 * is preserved below as commented-out blocks for reference.
 *
 * Public API:
 *  - {@link generateUploadUrl}  – returns signed client-side upload params
 *  - {@link deleteFile}         – deletes a file from ImageKit by `fileId`
 *  - {@link extractKeyFromUrl}  – extracts `fileId` / path from a CDN URL
 *  - {@link uploadFileBuffer}   – server-side buffer upload (used by maintenance scripts)
 *
 * Required environment variables:
 *  - `IMAGEKIT_PUBLIC_KEY`
 *  - `IMAGEKIT_PRIVATE_KEY`
 *  - `IMAGEKIT_URL_ENDPOINT`
 */
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
 * Generates ImageKit client-side upload authentication parameters.
 *
 * The frontend uses the returned params to upload directly to ImageKit
 * without routing the file through this server.
 *
 * @async
 * @param {string} [folder='reports'] - Destination folder in ImageKit.
 * @param {string} fileType           - MIME type of the file (informational only).
 * @returns {Promise<{
 *   token: string,
 *   expire: number,
 *   signature: string,
 *   folder: string,
 *   fileName: string,
 *   publicKey: string,
 *   urlEndpoint: string
 * }>} Auth params to pass to the ImageKit upload SDK on the client.
 * @throws {Error} If ImageKit auth parameter generation fails.
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
 * Deletes a file from ImageKit by its `fileId`.
 *
 * `fileId` is returned by ImageKit on upload and stored alongside the
 * file URL in {@link module:models/report~ReportPhoto}.
 *
 * @async
 * @param {string} fileId - The ImageKit file ID to delete.
 * @returns {Promise<void>}
 * @throws {Error} If the ImageKit API call fails.
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
 * Extracts a file identifier from a full ImageKit CDN URL by returning the
 * last path segment.
 *
 * @param {string} url - Full ImageKit URL (e.g.
 *   `https://ik.imagekit.io/abc/reports/file.jpg`).
 * @returns {string|null} Last path segment, or `null` if the URL is falsy or
 *   cannot be parsed.
 */
export const extractKeyFromUrl = (url) => {
  if (!url) return null;

  // ImageKit URLs typically look like: https://ik.imagekit.io/your_id/folder/filename.jpg
  // We need to extract the file ID which is usually in the path after the domain
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    // Return the last part as the file identifier
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error("Error extracting file ID from URL:", error);
    return null;
  }
};

/**
 * Uploads a raw file buffer to ImageKit from the server side.
 * Used by maintenance/migration scripts rather than the main API flow.
 *
 * @async
 * @param {Buffer} fileBuffer        - Raw binary buffer of the file to upload.
 * @param {string} fileName          - Desired file name in ImageKit.
 * @param {string} [folder='reports']- Destination folder in ImageKit.
 * @returns {Promise<{fileUrl: string, fileId: string}>}
 * @throws {Error} If the ImageKit upload fails.
 */
export const uploadFileBuffer = async (
  fileBuffer,
  fileName,
  folder = "reports",
) => {
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
