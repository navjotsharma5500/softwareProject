import mongoose from "mongoose";
const itemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // Generic name like "Phone", "Water Bottle"
    category: {
      type: String,
      enum: [
        "bottle",
        "earpods",
        "watch",
        "phone",
        "wallet",
        "id_card",
        "keys",
        "bag",
        "laptop",
        "charger",
        "books",
        "stationery",
        "glasses",
        "jewelry",
        "clothing",
        "electronics",
        "other",
      ],
      required: true,
    },
    foundLocation: {
      type: String,
      enum: [
        "COS",
        "Library",
        "LT",
        "near HOSTEL O C D M",
        "near HOSTEL A B J H",
        "near HOSTEL Q PG",
        "near HOSTEL E N G I",
        "near HOSTEL K L",
        "SBI LAWN",
        "G BLOCK",
        "SPORTS AREA",
        "Auditorium",
        "Main Gate",
        "Jaggi",
        "Other",
      ],
      required: true,
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
