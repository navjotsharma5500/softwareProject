import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "bug_report",
        "feature_request",
        "ui_ux",
        "performance",
        "general",
        "other",
      ],
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    isPublic: {
      type: Boolean,
      default: true, // User's preference for visibility
    },
    isApproved: {
      type: Boolean,
      default: false, // Admin approval required for public feed
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "archived", "rejected"],
      default: "pending",
    },
    adminResponse: {
      type: String,
      maxlength: 1000,
    },
    respondedAt: {
      type: Date,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for efficient querying
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ isPublic: 1, isApproved: 1, createdAt: -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ isApproved: 1 });

// Virtual for user details (populated when needed)
feedbackSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
