const express = require("express");
const router = express.Router();
const {
  getStudents,
  getStudentById,
  addStudent,
  updateStudent,
  updateGuardian,
  deleteStudent,
  getClassesAndSections,
} = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.get("/classes-sections", getClassesAndSections);
router.get("/", authorize("admin", "teacher"), getStudents);
router.get("/:id", getStudentById);
router.post("/", authorize("admin"), addStudent);
router.put("/:id/guardian", authorize("admin", "teacher"), updateGuardian);
router.put("/:id", authorize("admin", "teacher"), updateStudent);
router.delete("/:id", authorize("admin"), deleteStudent);

module.exports = router;
