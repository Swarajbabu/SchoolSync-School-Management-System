const Exam = require("../models/Exam");

// @desc Get scheduled exams (role-scoped for students to their enrolled class)
// @route GET /api/exams
const getExams = async (req, res) => {
  try {
    const filter = {};

    // Strict role enforcement for students
    if (req.user?.role === "student") {
      const studentClass = req.user.class || "10";
      // Students can ONLY view exams targeted to their own class or school-wide ("All Classes")
      filter.targetClass = { $in: [studentClass, "All Classes"] };
    } else if (req.query.targetClass && req.query.targetClass !== "All Classes") {
      // Admin and Teacher can filter by targetClass if query provided
      filter.targetClass = req.query.targetClass;
    }

    const exams = await Exam.find(filter).sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid exam identifier format" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a new exam schedule entry (Admin only)
// @route POST /api/exams
const createExam = async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json(exam);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid exam identifier format" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete an exam schedule entry (Admin only)
// @route DELETE /api/exams/:id
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json({ message: "Exam removed" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid exam identifier format" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExams, createExam, deleteExam };
