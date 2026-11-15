const express = require("express");
const router = express.Router();
const { getMarksLedger, saveMarks, getStudentMarksReport } = require("../controllers/marksController");
const { protect, authorize, verifyTeacherAssignment } = require("../middleware/auth");

router.get("/student/:id", protect, getStudentMarksReport);

router.use(protect, authorize("admin", "teacher"));

router.get("/", verifyTeacherAssignment, getMarksLedger);
router.post("/save", verifyTeacherAssignment, saveMarks);

module.exports = router;
