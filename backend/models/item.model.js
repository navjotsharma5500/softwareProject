import mongoose from "mongoose";
const itemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
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
    briefNotes: { type: String },
    dateFound: { type: Date, required: true },
    isClaimed: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const Item = mongoose.model("Item", itemSchema);
export default Item;
