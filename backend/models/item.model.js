/**
 * @module models/item
 * @description Mongoose model for a found physical item registered by an admin.
 *
 * Items progress from unclaimed (`isClaimed: false`) to claimed once an admin
 * approves a matching {@link module:models/claim}. The `owner` reference is
 * populated at approval time.
 */
import mongoose from "mongoose";

/**
 * @typedef {object} ItemDocument
 * @property {string}   itemId        - Human-readable sequential ID (e.g. `ITEM000042`).
 * @property {string}   name          - Brief generic name (e.g. "Phone", "Water Bottle").
 * @property {string}   category      - Slug from {@link module:utils/helpers~VALID_CATEGORIES}.
 * @property {string}   foundLocation - Physical location where the item was found.
 * @property {Date}     dateFound     - Date the item was physically found.
 * @property {boolean}  isClaimed     - `true` once a claim has been approved.
 * @property {ObjectId} [owner]       - Ref → User; set when a claim is approved.
 * @property {Date}     createdAt     - Auto-managed by `timestamps`.
 * @property {Date}     updatedAt     - Auto-managed by `timestamps`.
 */
const itemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // Generic name like "Phone", "Water Bottle"
    category: {
      type: String,
      required: true,
      trim: true,
    },
    foundLocation: {
      type: String,
      required: true,
      trim: true,
    },
    dateFound: { type: Date, required: true },
    isClaimed: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Indexes for performance optimization
// Most common query: isClaimed filter + createdAt sort (used by frontend default view)
itemSchema.index({ isClaimed: 1, createdAt: -1 }); // PRIMARY - default query
itemSchema.index({ category: 1, isClaimed: 1, createdAt: -1 }); // With category filter
itemSchema.index({ foundLocation: 1, isClaimed: 1, createdAt: -1 }); // With location filter
itemSchema.index({ dateFound: -1, isClaimed: 1 }); // Time-based queries
itemSchema.index({ name: "text", itemId: "text" }); // Text search optimization

const Item = mongoose.model("Item", itemSchema);
export default Item;
