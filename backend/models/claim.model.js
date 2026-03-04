/**
 * @module models/claim
 * @description Mongoose model representing a user's ownership claim on a found item.
 *
 * A user may have at most one non-rejected claim per item at a time.
 * When an admin approves a claim, all other pending claims for the same
 * item are automatically rejected and email notifications are sent.
 */
import mongoose from "mongoose";

/**
 * @typedef {object} ClaimDocument
 * @property {string}   claimId   - Human-readable sequential ID (e.g. `CLAIM000001`).
 * @property {ObjectId} item      - Ref → Item being claimed.
 * @property {ObjectId} claimant  - Ref → User who submitted the claim.
 * @property {'pending'|'approved'|'rejected'} status - Lifecycle state of the claim.
 * @property {string}   [remarks] - Optional admin note attached at approval/rejection.
 * @property {Date}     createdAt - Auto-managed by `timestamps`.
 * @property {Date}     updatedAt - Auto-managed by `timestamps`.
 */
const claimSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, unique: true },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    remarks: { type: String }, // Admin can add remarks
  },
  { timestamps: true },
);

// Indexes for performance optimization
claimSchema.index({ claimant: 1, status: 1, createdAt: -1 }); // User's claims queries
claimSchema.index({ item: 1, status: 1 }); // Item's claims queries
claimSchema.index({ status: 1, createdAt: -1 }); // Pending claims listing
claimSchema.index({ claimId: 1 }); // Search by claim ID

const Claim = mongoose.model("Claim", claimSchema);
export default Claim;
