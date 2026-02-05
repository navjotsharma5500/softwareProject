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
      ],
      required: true,
    },
    dateFound: { type: Date, required: true },
    isClaimed: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes for performance optimization
itemSchema.index({ category: 1, isClaimed: 1, dateFound: -1 }); // Common filter queries
itemSchema.index({ foundLocation: 1, isClaimed: 1 }); // Location-based queries
itemSchema.index({ name: "text" }); // Text search on item name
itemSchema.index({ createdAt: -1 }); // Sorting by creation date

const Item = mongoose.model("Item", itemSchema);
export default Item;
