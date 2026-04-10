/**
 * @module controllers/admin.reports
 * @description Admin view controllers for lost-item reports.
 *
 * Provides single-report detail lookup and a multi-filter paginated list
 * supporting: `reportId`, free-text search (description / category /
 * location / reporter name or email), `category`, `status`, and a
 * `dateFrom`/`dateTo` date range against `createdAt`.
 */
import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import { withQueryTimeout } from "../middlewares/queryTimeout.middleware.js";

/**
 * Get a single lost-item report by ID for the admin detail view.
 * Populates the reporter's name and email.
 *
 * @route GET /admin/reports/:id
 * @access Protected — admins only
 */
export async function getReportById(req, res) {
  try {
    const report = await withQueryTimeout(
      Report.findById(req.params.id).populate("user", "name email").lean(),
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    return res.status(200).json({ report });
  } catch (error) {
    console.error("Get report by ID error:", error.message);
    return res.status(500).json({ message: "Failed to fetch report" });
  }
}

/**
 * List all lost-item reports for admin oversight with pagination and filters.
 * Supports filtering by reportId, category, status, and date range.
 * search — matches itemDescription, category, location, or reporter name/email
 *   via indexed User pre-query (no JS-level collection scan).
 * reporterName — resolves matching user IDs from User collection then filters at DB level.
 *
 * @route GET /admin/reports
 * @access Protected — admins only
 */
export async function listAllReports(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 reports per page
    const skip = (page - 1) * limit;

    // Build query object based on filters
    const query = {};

    // Report ID filter (partial match on reportId string field)
    if (req.query.reportId) {
      query.reportId = { $regex: new RegExp(req.query.reportId, "i") };
    }

    // reporterName: look up matching user IDs (indexed) and filter at DB level
    if (req.query.reporterName) {
      const nameRegex = new RegExp(req.query.reporterName, "i");
      const matchingUsers = await withQueryTimeout(
        User.find({ $or: [{ name: nameRegex }, { email: nameRegex }] })
          .select("_id")
          .lean(),
      );
      query.user = { $in: matchingUsers.map((u) => u._id) };
    }

    // search: add $or covering item text fields + any matching user IDs
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      const matchingUsers = await withQueryTimeout(
        User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] })
          .select("_id")
          .lean(),
      );
      query.$or = [
        { itemDescription: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { location: { $regex: searchRegex } },
        ...(matchingUsers.length
          ? [{ user: { $in: matchingUsers.map((u) => u._id) } }]
          : []),
      ];
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.dateLost = {};
      if (req.query.startDate) {
        query.dateLost.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.dateLost.$lte = new Date(req.query.endDate);
      }
    }

    let reports, total;
    [reports, total] = await withQueryTimeout(
      Promise.all([
        Report.find(query)
          .populate("user", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Report.countDocuments(query),
      ]),
    );

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("List all reports error:", error.message);
    return res.status(500).json({ message: "Failed to list reports" });
  }
}
