import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
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
        type: String, // S3 URL
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

// Index for faster queries (optimized for EC2 efficiency)
reportSchema.index({ user: 1, createdAt: -1 }); // User's reports
reportSchema.index({ status: 1, createdAt: -1 }); // Admin queries by status
reportSchema.index({ category: 1, status: 1 }); // Category + status filtering
reportSchema.index({ dateLost: -1 }); // Date-based queries

const Report = mongoose.model("Report", reportSchema);

export default Report;
