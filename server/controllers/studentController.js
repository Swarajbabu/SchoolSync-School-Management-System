const User = require("../models/User");

// @desc Get all students
// @route GET /api/students
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password").sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single student by id
// @route GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Add a new student (Admin)
// @route POST /api/students
const addStudent = async (req, res) => {
  try {
    const { name, email, password, rollNo } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const student = await User.create({
      ...req.body,
      role: "student",
      accessProtocol: "STUDENT_SECURE_V1",
      rollNo: rollNo || "",
    });

    const { password: pw, ...rest } = student.toObject();
    res.status(201).json(rest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update a student's details
// @route PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.role;

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: "student" },
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a student
// @route DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get distinct classes and their sections from database
// @route GET /api/students/classes-sections
const getClassesAndSections = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      class: { $exists: true, $nin: ["", "Unassigned", null] },
    }).select("class section");

    const map = {};

    students.forEach((s) => {
      const cls = String(s.class).trim();
      const sec = s.section ? String(s.section).trim() : "";
      if (!cls) return;
      if (!map[cls]) {
        map[cls] = new Set();
      }
      if (sec) {
        map[cls].add(sec);
      }
    });

    const result = Object.keys(map)
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10);
        const numB = parseInt(b.replace(/\D/g, ""), 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
        return a.localeCompare(b);
      })
      .map((cls) => ({
        class: cls,
        sections: Array.from(map[cls]).sort(),
      }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  getClassesAndSections,
};
