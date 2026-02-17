import mongoose from "mongoose";

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
