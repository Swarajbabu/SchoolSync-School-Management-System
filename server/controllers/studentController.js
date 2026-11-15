const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Fee = require("../models/Fee");
const SessionalMark = require("../models/SessionalMark");
const Payment = require("../models/Payment");
const ClassModel = require("../models/Class");
const { logAction } = require("../utils/auditLogger");

// @desc Get all students (Admin and Teacher only) with search & pagination
// @route GET /api/students?page=&limit=&search=&class=&section=
const getStudents = async (req, res) => {
  try {
    const { page, limit, search, class: cls, section } = req.query;

    const filter = { role: "student" };
    if (cls && cls !== "All Classes") filter.class = cls;
    if (section && section !== "All Sections") filter.section = section;

    if (search && search.trim()) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ name: rx }, { email: rx }, { rollNo: rx }, { enrollmentNo: rx }];
    }

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [total, students] = await Promise.all([
        User.countDocuments(filter),
        User.find(filter)
          .select("-password -aadharNo -panCardNo")
          .sort({ rollNo: 1, name: 1 })
          .skip(skip)
          .limit(limitNum),
      ]);

      return res.json({
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum,
        students,
      });
    }

    const students = await User.find(filter)
      .select("-password -aadharNo -panCardNo")
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single student by id (Strictly scoped)
// @route GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const targetId = req.params.id;

    // Student self-scoping
    if (req.user?.role === "student" && req.user._id.toString() !== targetId) {
      return res.status(403).json({ message: "Access forbidden: you can only view your own student record" });
    }

    // Guardian child-scoping
    if (req.user?.role === "guardian") {
      const isLinked = (req.user.linkedStudents || []).some(
        (id) => id.toString() === targetId
      );
      if (!isLinked) {
        return res.status(403).json({ message: "Access forbidden: you can only view your linked student record" });
      }
    }

    const student = await User.findOne({ _id: targetId, role: "student" })
      .select("-password -aadharNo -panCardNo");

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid student identifier format" });
    }
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
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const student = await User.create({
      ...req.body,
      email: email.toLowerCase().trim(),
      role: "student",
      accessProtocol: "STUDENT_SECURE_V1",
      rollNo: rollNo ? rollNo.toString().trim() : "",
      status: "Active",
    });

    await logAction({
      action: "STUDENT_CREATED",
      performedBy: req.user._id,
      targetEntity: "User",
      targetId: student._id,
      details: { name: student.name, email: student.email, rollNo: student.rollNo, class: student.class },
      req,
    });

    const { password: pw, aadharNo, panCardNo, ...rest } = student.toObject();
    res.status(201).json(rest);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
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
    ).select("-password -aadharNo -panCardNo");

    if (!student) return res.status(404).json({ message: "Student not found" });

    await logAction({
      action: "STUDENT_UPDATED",
      performedBy: req.user._id,
      targetEntity: "User",
      targetId: student._id,
      details: updates,
      req,
    });

    res.json(student);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid student identifier format" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Update student guardian emergency details
// @route PUT /api/students/:id/guardian
const updateGuardian = async (req, res) => {
  try {
    const { fatherName, motherName, guardianContact } = req.body;
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: "student" },
      { fatherName, motherName, guardianContact },
      { new: true, runValidators: true }
    ).select("-password -aadharNo -panCardNo");

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid student identifier format" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a student and cascade-remove all child records
// @route DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Cascade clean up all related records
    await Promise.allSettled([
      Attendance.deleteMany({ student: req.params.id }),
      Fee.deleteMany({ student: req.params.id }),
      Payment.deleteMany({ student: req.params.id }),
      SessionalMark.deleteMany({ student: req.params.id }),
    ]);

    await logAction({
      action: "STUDENT_DELETED",
      performedBy: req.user._id,
      targetEntity: "User",
      targetId: req.params.id,
      details: { name: student.name, email: student.email, rollNo: student.rollNo },
      req,
    });

    res.json({ message: "Student profile and all associated academic records removed" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid student identifier format" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Get distinct classes and their sections from database (Class collection first, then student fallback)
// @route GET /api/students/classes-sections
const getClassesAndSections = async (req, res) => {
  try {
    // 1. Try first-class Class collection
    const classDocs = await ClassModel.find().sort({ name: 1 });
    if (classDocs && classDocs.length > 0) {
      const result = classDocs.map((c) => ({
        class: c.name,
        sections: c.sections && c.sections.length > 0 ? c.sections : ["A", "B"],
      }));
      return res.json(result);
    }

    // 2. Fallback to deriving from student users
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
  updateGuardian,
  deleteStudent,
  getClassesAndSections,
};
