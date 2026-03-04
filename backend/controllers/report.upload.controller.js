/**
 * Report — Upload URL generation.
 * Handles ImageKit client-side upload authentication.
 */

import { generateUploadUrl } from "../utils/s3.utils.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * Generate ImageKit client-side upload authentication parameters.
 * Validates count (max 3) and optional MIME type list.
 * Uses a 5 s timeout on the ImageKit API call.
 *
 * @route POST /reports/upload-urls
 * @access Protected — authenticated users only
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
