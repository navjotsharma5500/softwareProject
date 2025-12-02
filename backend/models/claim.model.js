import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
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
  { timestamps: true }
);

// Indexes for performance optimization
claimSchema.index({ claimant: 1, status: 1, createdAt: -1 }); // User's claims queries
claimSchema.index({ item: 1, status: 1 }); // Item's claims queries
claimSchema.index({ status: 1, createdAt: -1 }); // Pending claims listing

const Claim = mongoose.model("Claim", claimSchema);
export default Claim;
