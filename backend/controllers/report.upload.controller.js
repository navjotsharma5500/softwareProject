/**
 * @module controllers/report.upload
 * @description Generates ImageKit client-side upload authentication parameters
 * for the report photo upload workflow.
 *
 * The frontend calls this endpoint first to obtain signed upload credentials,
 * then uploads each photo directly to ImageKit from the browser, and finally
 * submits the resulting `{url, fileId}` pairs when creating the report via
 * {@link module:controllers/report.crud}.
 */

import { generateUploadUrl, deleteFile } from "../utils/s3.utils.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

/** MIME types accepted for report photo uploads. */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * Generates up to 3 ImageKit upload authentication parameter sets.
 *
 * Validates:
 *  - `count` must be between 1 and 3.
 *  - Each entry in `fileTypes` (if provided) must be a supported MIME type.
 *
 * Each element of the returned `uploadUrls` array contains: `token`,
 * `signature`, `expire`, `folder`, `fileName`, `publicKey`, `urlEndpoint`.
 *
 * @async
 * @param {import('express').Request}  req - `req.body.count` (number) and
 *   `req.body.fileTypes` (string[], optional).
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @route POST /reports/upload-urls
 * @access Protected
 */
export const getUploadUrls = async (req, res) => {
  try {
    const { count = 1, fileTypes = [] } = req.body;

    if (!count || count < 1) {
      return res.status(400).json({ message: "Invalid count parameter" });
    }
    if (count > 3) {
      return res.status(400).json({ message: "Maximum 3 photos allowed" });
    }
    if (fileTypes.length > 0) {
      const invalid = fileTypes.filter((t) => !ALLOWED_IMAGE_TYPES.includes(t));
      if (invalid.length > 0) {
        return res.status(400).json({
          message: `Invalid file types. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        });
      }
    }

    const uploadParams = await withQueryTimeout(
      Promise.all(
        Array.from({ length: count }).map((_, i) =>
          generateUploadUrl("reports", fileTypes[i] || "image/jpeg"),
        ),
      ),
      5000,
    );

    res.status(200).json({ uploadParams });
  } catch (error) {
    console.error("Upload URL generation error:", error);
    if (error.message.includes("timeout")) {
      return res
        .status(504)
        .json({ message: "Upload service timeout, please try again" });
    }
    res.status(500).json({ message: "Failed to generate upload URLs" });
  }
};

/**
 * Deletes up to 3 ImageKit files that were uploaded during a report submission
 * that subsequently failed or was abandoned.
 *
 * Uses `Promise.allSettled` so a missing/already-deleted file does not cause
 * the whole request to fail.
 *
 * @async
 * @param {import('express').Request}  req - `req.body.fileIds` (string[]).
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @route DELETE /reports/orphaned-images
 * @access Protected
 */
export const deleteOrphanedImages = async (req, res) => {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ message: "fileIds array is required" });
    }
    if (fileIds.length > 3) {
      return res.status(400).json({ message: "Maximum 3 file IDs allowed" });
    }
    if (!fileIds.every((id) => typeof id === "string" && id.trim())) {
      return res.status(400).json({ message: "Invalid file ID format" });
    }

    // Best-effort: ignore errors for files already deleted or not found
    await Promise.allSettled(fileIds.map((id) => deleteFile(id)));

    res.status(200).json({ message: "Cleanup complete" });
  } catch (error) {
    console.error("Orphaned image cleanup error:", error);
    res.status(500).json({ message: "Cleanup failed" });
  }
};
