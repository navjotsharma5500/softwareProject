/**
 * Report — Admin operations.
 * Handles listing all reports, changing report status, and fetching by user.
 */

import Joi from "joi";
import Report from "../models/report.model.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";
import { paginationMeta } from "../utils/helpers.js";

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * List all reports with optional status and category filters, paginated.
 * Admin-only. Sorted newest-first.
 *
 * @route GET /reports/all
 * @access Protected — admins only
 */
export const getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const { status, category } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const [reports, count] = await withQueryTimeout(
      Promise.all([
        Report.find(query)
          .populate("user", "name email rollNo")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Report.countDocuments(query),
      ]),
    );

    res
      .status(200)
      .json({ reports, pagination: paginationMeta(page, limit, count) });
  } catch (error) {
    console.error("getAllReports error:", error.message);
    if (error.message === "Database query timeout") {
      return res
        .status(504)
        .json({ message: "Request timeout, please try again" });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Set the status (active / resolved / closed) of any report.
 * Admin-only operation.
 *
 * @route PATCH /reports/:id/status
 * @access Protected — admins only
 */
export const updateReportStatus = async (req, res) => {
  const schema = Joi.object({
    status: Joi.string().valid("active", "resolved", "closed").required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).populate("user", "name email rollNo");

    if (!report) return res.status(404).json({ message: "Report not found" });

    res
      .status(200)
      .json({ report, message: "Report status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch up to 20 reports for a specific user (newest first).
 * Admin-only.
 *
 * @route GET /reports/user/:userId
 * @access Protected — admins only
 */
export const getReportsByUserId = async (req, res) => {
  try {
    const reports = await withQueryTimeout(
      Report.find({ user: req.params.userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    );
    res.status(200).json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
