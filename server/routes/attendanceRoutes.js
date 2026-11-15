const express = require("express");
const router = express.Router();
const {
  getRollList,
  saveAttendance,
  getAttendanceSummary,
  getStudentAttendanceReport,
} = require("../controllers/attendanceController");
const { protect, authorize, verifyTeacherAssignment } = require("../middleware/auth");

router.use(protect);

router.get("/roll", authorize("admin", "teacher"), verifyTeacherAssignment, getRollList);
router.post("/save", authorize("admin", "teacher"), verifyTeacherAssignment, saveAttendance);
router.get("/summary", verifyTeacherAssignment, getAttendanceSummary);
router.get("/student/:id", getStudentAttendanceReport);

module.exports = router;
