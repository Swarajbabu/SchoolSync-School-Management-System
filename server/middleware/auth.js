const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Timetable = require("../models/Timetable");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User not found. Token invalid." });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Usage: authorize("admin", "teacher")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Role '${req.user?.role}' is not allowed to access this resource` });
    }
    next();
  };
};

// Verify teacher is assigned to the requested class & section
const verifyTeacherAssignment = async (req, res, next) => {
  // Admin has full institutional access
  if (req.user?.role === "admin") {
    return next();
  }

  if (req.user?.role === "teacher") {
    const targetClass = req.query.class || req.body.class;
    const targetSection = req.query.section || req.body.section;

    if (!targetClass || !targetSection) {
      return res.status(400).json({ message: "class and section parameters are required" });
    }

    const teacherName = (req.user.name || "").trim();
    const teacherId = (req.user.teacherId || "").trim();
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const conditions = [];
    if (teacherId) conditions.push({ facultyCode: teacherId });
    if (teacherName) conditions.push({ facultyName: new RegExp(`^${escapeRegex(teacherName)}$`, "i") });

    if (conditions.length === 0) {
      return res.status(403).json({
        message: "Access denied. Faculty member has no active department code or teaching assignment.",
      });
    }

    const assigned = await Timetable.findOne({
      class: targetClass,
      section: targetSection,
      $or: conditions,
    });

    if (!assigned) {
      return res.status(403).json({
        message: `Access denied. You are not assigned to Class ${targetClass} - Section ${targetSection}.`,
      });
    }

    return next();
  }

  next();
};

module.exports = { protect, authorize, verifyTeacherAssignment };
