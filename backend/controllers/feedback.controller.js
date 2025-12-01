import Feedback from "../models/feedback.model.js";
import User from "../models/user.model.js";

// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    // Debug logging
    console.log("🔍 Feedback submission attempt:");
    console.log("- Cookies:", req.cookies);
    console.log("- Auth header:", req.headers.authorization);
    console.log("- User from middleware:", req.user);

    // Joi validation
    const Joi = (await import("joi")).default;
    const schema = Joi.object({
      rating: Joi.number().integer().min(1).max(5).required(),
      category: Joi.string()
        .valid(
          "bug_report",
          "feature_request",
          "ui_ux",
          "performance",
          "general",
          "other"
        )
        .required(),
      subject: Joi.string().min(3).max(200).required(),
      message: Joi.string().min(10).max(2000).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const { rating, category, subject, message } = value;

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Authentication required. Please log in to submit feedback.",
      });
    }

    // Get user information
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message:
          "User account not found. Please log in again or contact support.",
      });
    }

    // Create feedback - always public (subject to admin approval)
    const feedback = await Feedback.create({
      userId: req.user._id,
      name: user.name,
      email: user.email,
      rating,
      category,
      subject,
      message,
      isPublic: true,
      status: "pending",
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: {
        id: feedback._id,
        subject: feedback.subject,
        category: feedback.category,
        rating: feedback.rating,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res
      .status(500)
      .json({ message: "Error submitting feedback", error: error.message });
  }
};

// Get public feedback feed - Only approved feedback
export const getFeedbackFeed = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Build query - Only show approved feedback by admin
    const query = {
      isPublic: true,
      isApproved: true, // Admin must approve for public feed
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    // Get feedback with pagination
    const feedbacks = await Feedback.find(query)
      .select("-userId -email -__v")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await Feedback.countDocuments(query);

    // Calculate statistics only for approved feedback
    const stats = await Feedback.aggregate([
      { $match: { isPublic: true, isApproved: true } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalFeedback: { $sum: 1 },
          fiveStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
          },
          fourStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
          },
          threeStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
          },
          twoStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
          },
          oneStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      feedbacks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit),
      },
      stats:
        stats.length > 0
          ? stats[0]
          : {
              avgRating: 0,
              totalFeedback: 0,
              fiveStarCount: 0,
              fourStarCount: 0,
              threeStarCount: 0,
              twoStarCount: 0,
              oneStarCount: 0,
            },
    });
  } catch (error) {
    console.error("Error fetching feedback feed:", error);
    res
      .status(500)
      .json({ message: "Error fetching feedback", error: error.message });
  }
};

// Get user's own feedback
export const getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ feedbacks });
  } catch (error) {
    console.error("Error fetching user feedback:", error);
    res
      .status(500)
      .json({ message: "Error fetching feedback", error: error.message });
  }
};

// Get feedback by ID (for detailed view)
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id).lean();

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Only allow user to view their own feedback or approved public feedback
    if (feedback.userId.toString() !== req.user._id.toString()) {
      if (!feedback.isPublic || !feedback.isApproved) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.status(200).json({ feedback });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res
      .status(500)
      .json({ message: "Error fetching feedback", error: error.message });
  }
};

// Update feedback (only by the creator, before admin response)
export const updateFeedback = async (req, res) => {
  try {
    // Joi validation
    const Joi = (await import("joi")).default;
    const schema = Joi.object({
      rating: Joi.number().integer().min(1).max(5).optional(),
      category: Joi.string()
        .valid(
          "bug_report",
          "feature_request",
          "ui_ux",
          "performance",
          "general",
          "other"
        )
        .optional(),
      subject: Joi.string().min(3).max(200).optional(),
      message: Joi.string().min(10).max(2000).optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const { id } = req.params;
    const { rating, category, subject, message } = value;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Check if user owns this feedback
    if (feedback.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only update your own feedback" });
    }

    // Prevent update if admin has already responded
    if (feedback.adminResponse) {
      return res.status(400).json({
        message: "Cannot update feedback that has been responded to by admin",
      });
    }

    // Update fields
    if (rating !== undefined) feedback.rating = rating;
    if (category !== undefined) feedback.category = category;
    if (subject !== undefined) feedback.subject = subject;
    if (message !== undefined) feedback.message = message;

    await feedback.save();

    res.status(200).json({
      message: "Feedback updated successfully",
      feedback,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res
      .status(500)
      .json({ message: "Error updating feedback", error: error.message });
  }
};

// Delete feedback (only by creator, before admin response)
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Check if user owns this feedback
    if (feedback.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own feedback" });
    }

    // Prevent deletion if admin has already responded
    if (feedback.adminResponse) {
      return res.status(400).json({
        message: "Cannot delete feedback that has been responded to by admin",
      });
    }

    await Feedback.findByIdAndDelete(id);

    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res
      .status(500)
      .json({ message: "Error deleting feedback", error: error.message });
  }
};

// Admin: Get all feedback (including private)
export const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, rating } = req.query;

    // Build query
    const query = {};

    if (category && category !== "all") {
      query.category = category;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get feedback with pagination
    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await Feedback.countDocuments(query);

    // Calculate statistics
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalFeedback: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$isApproved", true] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$isApproved", false] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      feedbacks,
      stats: stats[0] || {
        avgRating: 0,
        totalFeedback: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all feedback:", error);
    res
      .status(500)
      .json({ message: "Error fetching feedback", error: error.message });
  }
};

// Admin: Respond to feedback
export const respondToFeedback = async (req, res) => {
  try {
    // Joi validation
    const Joi = (await import("joi")).default;
    const schema = Joi.object({
      response: Joi.string().min(10).max(1000).required(),
      status: Joi.string()
        .valid("pending", "reviewed", "resolved", "archived")
        .optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const { id } = req.params;
    const { response, status } = value;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.adminResponse = response;
    feedback.respondedAt = new Date();
    feedback.respondedBy = req.user._id;

    if (status) {
      feedback.status = status;
    } else {
      feedback.status = "reviewed";
    }

    await feedback.save();

    res.status(200).json({
      message: "Response added successfully",
      feedback,
    });
  } catch (error) {
    console.error("Error responding to feedback:", error);
    res
      .status(500)
      .json({ message: "Error responding to feedback", error: error.message });
  }
};

// Admin: Update feedback status
export const updateFeedbackStatus = async (req, res) => {
  try {
    // Joi validation
    const Joi = (await import("joi")).default;
    const schema = Joi.object({
      status: Joi.string()
        .valid("pending", "reviewed", "resolved", "archived")
        .required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const { id } = req.params;
    const { status } = value;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({
      message: "Status updated successfully",
      feedback,
    });
  } catch (error) {
    console.error("Error updating feedback status:", error);
    res
      .status(500)
      .json({ message: "Error updating status", error: error.message });
  }
};

// Admin: Approve or reject feedback for public feed
export const approveFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      {
        isApproved: true,
        status: "reviewed", // Auto-update status
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({
      message: "Feedback approved for public feed",
      feedback,
    });
  } catch (error) {
    console.error("Error approving feedback:", error);
    res.status(500).json({
      message: "Error approving feedback",
      error: error.message,
    });
  }
};
