import mongoose from "mongoose";
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
