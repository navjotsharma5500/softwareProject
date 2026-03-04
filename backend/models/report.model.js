/**
 * @module models/report
 * @description Mongoose model for a lost-item report submitted by a user.
 *
 * A report captures the user's description of a lost item and can include
 * up to three photos stored in ImageKit. Reports progress through
 * `active → resolved | closed` lifecycles managed by admins.
 */
import mongoose from "mongoose";

/**
 * @typedef {object} ReportPhoto
 * @property {string} url    - Public ImageKit CDN URL.
 * @property {string} fileId - ImageKit `fileId` used for remote deletion.
 */

/**
 * @typedef {object} ReportDocument
 * @property {string}        reportId          - Sequential human-readable ID (e.g. `REPORT000001`).
 * @property {ObjectId}      user              - Ref → User who filed the report.
 * @property {string}        itemDescription   - Free-text description of the lost item.
 * @property {string}        category          - Slug from {@link module:utils/helpers~VALID_CATEGORIES}.
 * @property {string}        location          - Where the item was last seen.
 * @property {Date}          dateLost          - When the item was lost.
 * @property {string}        [additionalDetails] - Any extra context the user provides.
 * @property {ReportPhoto[]} photos            - Up to 3 ImageKit photo attachments.
 * @property {'active'|'resolved'|'closed'} status - Lifecycle state; defaults to `active`.
 * @property {Date}          createdAt         - Auto-managed by `timestamps`.
 * @property {Date}          updatedAt         - Auto-managed by `timestamps`.
 */
const reportSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemDescription: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    dateLost: {
      type: Date,
      required: true,
    },
    additionalDetails: {
      type: String,
      trim: true,
    },
    photos: [
      {
        url: { type: String, required: true },
        fileId: { type: String, default: "" }, // ImageKit fileId for deletion
      },
    ],
    status: {
      type: String,
      enum: ["active", "resolved", "closed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// ...existing code...

const Report = mongoose.model("Report", reportSchema);

export default Report;
