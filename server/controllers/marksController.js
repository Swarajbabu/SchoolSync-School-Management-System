const User = require("../models/User");
const SessionalMark = require("../models/SessionalMark");
const GradingPolicy = require("../models/GradingPolicy");
const { logAction } = require("../utils/auditLogger");

// Grade calculation helper
const calculateGradeDetails = (obtained, maxMarks, policies) => {
  const max = Math.max(1, Number(maxMarks) || 100);
  const obt = Number(obtained) || 0;
  const pct = (obt / max) * 100;

  if (policies && policies.length > 0) {
    const match = policies.find((p) => pct >= p.minPercentage && pct <= p.maxPercentage);
    if (match) {
      return {
        grade: match.grade,
        gradePoint: match.gradePoint,
        status: match.isPass ? "PASS" : "FAIL",
        percentage: Number(pct.toFixed(1)),
      };
    }
  }

  // Fallback CBSE default scale
  if (pct >= 90) return { grade: "A+", gradePoint: 10, status: "PASS", percentage: Number(pct.toFixed(1)) };
  if (pct >= 80) return { grade: "A", gradePoint: 9, status: "PASS", percentage: Number(pct.toFixed(1)) };
  if (pct >= 70) return { grade: "B", gradePoint: 8, status: "PASS", percentage: Number(pct.toFixed(1)) };
  if (pct >= 60) return { grade: "C", gradePoint: 7, status: "PASS", percentage: Number(pct.toFixed(1)) };
  if (pct >= 50) return { grade: "D", gradePoint: 6, status: "PASS", percentage: Number(pct.toFixed(1)) };
  if (pct >= 33) return { grade: "E", gradePoint: 4, status: "PASS", percentage: Number(pct.toFixed(1)) };
  return { grade: "F", gradePoint: 0, status: "FAIL", percentage: Number(pct.toFixed(1)) };
};

// @desc Load marks entry ledger for class/section/assessmentType/subject (READ-ONLY)
// @route GET /api/marks?class=&section=&assessmentType=&subject=
const getMarksLedger = async (req, res) => {
  try {
    const { class: cls, section, assessmentType, subject, year } = req.query;
    if (!cls || !section || !assessmentType || !subject) {
      return res.status(400).json({ message: "class, section, assessmentType, subject required" });
    }

    const students = await User.find({ role: "student", class: cls, section })
      .select("name rollNo")
      .sort({ rollNo: 1, name: 1 });

    const yr = year || new Date().getFullYear().toString();
    const studentIds = students.map((s) => s._id);

    const [existingMarks, policies] = await Promise.all([
      SessionalMark.find({
        student: { $in: studentIds },
        class: cls,
        section,
        assessmentType,
        subject: subject.trim(),
        year: yr,
      }),
      GradingPolicy.find().sort({ minPercentage: -1 }),
    ]);

    const marksMap = new Map();
    existingMarks.forEach((m) => marksMap.set(m.student.toString(), m));

    const ledger = students.map((s) => {
      const record = marksMap.get(s._id.toString());
      if (record) {
        const gradeInfo = calculateGradeDetails(record.marksObtained, record.maxMarks, policies);
        return {
          _id: record._id,
          studentId: s._id,
          name: s.name,
          rollNo: s.rollNo,
          marksObtained: record.marksObtained,
          maxMarks: record.maxMarks,
          remarks: record.remarks || "",
          grade: gradeInfo.grade,
          gradePoint: gradeInfo.gradePoint,
          percentage: gradeInfo.percentage,
          status: gradeInfo.status,
          isGraded: true,
        };
      }
      return {
        _id: null,
        studentId: s._id,
        name: s.name,
        rollNo: s.rollNo,
        marksObtained: 0,
        maxMarks: 100,
        remarks: "",
        grade: "N/A",
        gradePoint: 0,
        percentage: 0,
        status: "NOT_GRADED",
        isGraded: false,
      };
    });

    res.json({ subject, totalStudents: students.length, ledger });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Finalize/save marks (Atomic bulk upsert with strict validation)
// @route POST /api/marks/save
const saveMarks = async (req, res) => {
  try {
    const { class: cls, section, assessmentType, subject, year, entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "entries array required" });
    }

    const yr = year || new Date().getFullYear().toString();

    // Strict Range Validation
    for (const e of entries) {
      const maxM = Number(e.maxMarks) || 100;
      const obtM = Number(e.marksObtained);

      if (isNaN(obtM) || obtM < 0) {
        return res.status(400).json({
          message: `Marks obtained cannot be negative or invalid for student ${e.studentId}`,
        });
      }
      if (obtM > maxM) {
        return res.status(400).json({
          message: `Marks obtained (${obtM}) cannot exceed maximum marks (${maxM}) for student ${e.studentId}`,
        });
      }
    }

    const ops = entries.map((e) => {
      const maxM = Number(e.maxMarks) || 100;
      const obtM = Number(e.marksObtained);

      return {
        updateOne: {
          filter: {
            student: e.studentId,
            class: cls,
            section,
            assessmentType,
            subject: subject.trim(),
            year: yr,
          },
          update: {
            $set: {
              student: e.studentId,
              class: cls,
              section,
              assessmentType,
              subject: subject.trim(),
              year: yr,
              marksObtained: obtM,
              maxMarks: maxM,
              remarks: (e.remarks || "").toString().trim(),
            },
          },
          upsert: true,
        },
      };
    });

    await SessionalMark.bulkWrite(ops);

    // Audit Logging
    await logAction({
      action: "MARKS_UPDATED",
      performedBy: req.user._id,
      targetEntity: "SessionalMark",
      details: { class: cls, section, subject, assessmentType, recordsUpdated: ops.length },
      req,
    });

    res.json({ message: "Marks finalized and saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all sessional marks for one student (Academic Results report)
// @route GET /api/marks/student/:id
const getStudentMarksReport = async (req, res) => {
  try {
    const targetStudentId = req.params.id;

    // Scoping for student
    if (req.user?.role === "student" && req.user._id.toString() !== targetStudentId) {
      return res.status(403).json({ message: "Access denied. You can only view your own report card." });
    }

    // Scoping for guardian
    if (req.user?.role === "guardian") {
      const isLinked = (req.user.linkedStudents || []).some(
        (id) => id.toString() === targetStudentId
      );
      if (!isLinked) {
        return res.status(403).json({ message: "Access denied. Student is not linked to your guardian account." });
      }
    }

    const [records, policies] = await Promise.all([
      SessionalMark.find({ student: targetStudentId }).sort({ createdAt: -1 }),
      GradingPolicy.find().sort({ minPercentage: -1 }),
    ]);

    const enriched = records.map((r) => {
      const gradeInfo = calculateGradeDetails(r.marksObtained, r.maxMarks, policies);
      return {
        ...r.toObject(),
        grade: gradeInfo.grade,
        gradePoint: gradeInfo.gradePoint,
        percentage: gradeInfo.percentage,
        status: gradeInfo.status,
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMarksLedger, saveMarks, getStudentMarksReport };
