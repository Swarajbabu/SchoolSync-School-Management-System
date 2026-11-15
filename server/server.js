const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const staffAttendanceRoutes = require("./routes/staffAttendanceRoutes");
const feeRoutes = require("./routes/feeRoutes");
const marksRoutes = require("./routes/marksRoutes");
const examRoutes = require("./routes/examRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const materialRoutes = require("./routes/materialRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const eventRoutes = require("./routes/eventRoutes");
const gradingPolicyRoutes = require("./routes/gradingPolicyRoutes");
const auditRoutes = require("./routes/auditRoutes");

const app = express();

// Production Security Guard
if (!process.env.JWT_SECRET) {
  // If not explicitly provided in environment, generate an ephemeral cryptographic key so server boots safely
  process.env.JWT_SECRET = require("crypto").randomBytes(32).toString("hex");
  console.log("🔒 Generated ephemeral cryptographically secure JWT_SECRET for session isolation.");
} else if (
  process.env.NODE_ENV === "production" &&
  (process.env.JWT_SECRET.includes("change_me") ||
    process.env.JWT_SECRET === "eduplus_super_secret_key_change_me")
) {
  console.error("❌ FATAL: Cannot start server in production with default or insecure JWT_SECRET!");
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL
      ? process.env.CLIENT_URL === "*"
        ? true
        : process.env.CLIENT_URL.includes(",")
        ? process.env.CLIENT_URL.split(",").map((s) => s.trim())
        : process.env.CLIENT_URL
      : true,
    credentials: true,
  })
);

app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true, limit: "6mb" }));

// Root Route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to SchoolSync API 🚀",
    status: "Running",
    health: "/api/health",
    documentation: "SchoolSync ERP Backend",
  });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SchoolSync API is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/staff-attendance", staffAttendanceRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/grading-rules", gradingPolicyRoutes);
app.use("/api/audit-logs", auditRoutes);

// Serve static frontend assets in production (Full-stack unified deployment)
const clientDistPath = path.join(__dirname, "../client/dist");
const fs = require("fs");

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get("*", (req, res, next) => {
    // If request starts with /api, pass to API 404 handler
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// 404 Handler for API routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `Invalid identifier format: ${err.value}`,
      error: "CastError",
    });
  }
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    return res.status(400).json({
      message: messages.join(", ") || "Validation failed",
      error: "ValidationError",
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate resource field value entered",
      error: "DuplicateKeyError",
    });
  }

  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 SchoolSync server running on port ${PORT}`);
  });
}

module.exports = app;