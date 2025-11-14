import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";


const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a presigned URL for uploading a file to S3
 * @param {string} folder - Folder name in S3 bucket
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<{uploadUrl: string, fileKey: string, fileUrl: string}>}
 */
export const generateUploadUrl = async (folder = "reports", fileType) => {
  const fileKey = `${folder}/${crypto
    .randomBytes(16)
    .toString("hex")}-${Date.now()}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    }); // 1 hour
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    return {
      uploadUrl,
      fileKey,
      fileUrl,
    };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    throw new Error("Failed to generate upload URL");
  }
};

/**
 * Delete a file from S3
 * @param {string} fileKey - The S3 key of the file to delete
 */
export const deleteFile = async (fileKey) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Failed to delete file");
  }
};

/**
 * Extract S3 key from full URL
 * @param {string} url - Full S3 URL
 * @returns {string} - S3 key
 */
export const extractKeyFromUrl = (url) => {
  if (!url) return null;
  const urlParts = url.split(".amazonaws.com/");
  return urlParts.length > 1 ? urlParts[1] : null;
};
