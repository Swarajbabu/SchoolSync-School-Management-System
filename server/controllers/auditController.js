const AuditLog = require("../models/AuditLog");

// @desc Get audit logs (Admin only)
// @route GET /api/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (action) filter.action = action;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10));

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .populate("performedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(100, parseInt(limit, 10))),
    ]);

    res.json({ total, page: parseInt(page, 10), logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAuditLogs };
