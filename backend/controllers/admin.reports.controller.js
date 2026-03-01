import Report from "../models/report.model.js";

// Get a single report by ID for admin details page
export async function getReportById(req, res) {
  try {
    const report = await Report.findById(req.params.id)
      .populate("user", "name email")
      .lean();
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    return res.status(200).json({ report });
  } catch (error) {
    console.error("Get report by ID error:", error.message);
    return res.status(500).json({ message: "Failed to fetch report" });
  }
}

// List all reports for admin with pagination and filters
export async function listAllReports(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 reports per page
    const skip = (page - 1) * limit;

    // Build query object based on filters
    const query = {};

    // Search filter (search in itemDescription, category, location, reporter name/email)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { itemDescription: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { location: { $regex: searchRegex } },
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

    // Populate user for search in reporter fields
    let reports, total;
    if (req.query.search) {
      // Need to populate user and filter in JS for reporter fields
      const allReports = await Report.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean();
      const filteredReports = allReports.filter((report) => {
        const search = req.query.search.toLowerCase();
        return (
          report.user?.name?.toLowerCase().includes(search) ||
          report.user?.email?.toLowerCase().includes(search) ||
          report.itemDescription?.toLowerCase().includes(search) ||
          report.category?.toLowerCase().includes(search) ||
          report.location?.toLowerCase().includes(search)
        );
      });
      total = filteredReports.length;
      reports = filteredReports.slice(skip, skip + limit);
    } else {
      [reports, total] = await Promise.all([
        Report.find(query)
          .populate("user", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Report.countDocuments(query),
      ]);
    }

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
