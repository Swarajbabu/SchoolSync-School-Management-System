const User = require("../models/User");
const SessionalMark = require("../models/SessionalMark");

// @desc Load marks entry ledger for class/section/assessmentType/subject (READ-ONLY, no phantom writes)
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

    // Query existing marks without modifying the database on GET
    const studentIds = students.map((s) => s._id);
    const existingMarks = await SessionalMark.find({
      student: { $in: studentIds },
      class: cls,
      section,
      assessmentType,
      subject: subject.trim(),
      year: yr,
    });

    const marksMap = new Map();
    existingMarks.forEach((m) => marksMap.set(m.student.toString(), m));

    const ledger = students.map((s) => {
      const record = marksMap.get(s._id.toString());
      if (record) {
        return {
          _id: record._id,
          studentId: s._id,
          name: s.name,
          rollNo: s.rollNo,
          marksObtained: record.marksObtained,
          maxMarks: record.maxMarks,
          remarks: record.remarks || "",
          status: record.marksObtained >= record.maxMarks * 0.33 ? "PASS" : "FAIL",
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
        status: "NOT_GRADED",
        isGraded: false,
      };
    });

    res.json({ subject, totalStudents: students.length, ledger });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Finalize/save marks (Atomic bulk upsert with range validation)
// @route POST /api/marks/save
const saveMarks = async (req, res) => {
  try {
    const { class: cls, section, assessmentType, subject, year, entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "entries array required" });
    }

    const yr = year || new Date().getFullYear().toString();

    const ops = entries.map((e) => {
      const maxM = Math.max(1, Number(e.maxMarks) || 100);
      const obtM = Math.max(0, Math.min(maxM, Number(e.marksObtained) || 0));

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
    res.json({ message: "Marks finalized and saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all sessional marks for one student (Academic Results report)
// @route GET /api/marks/student/:id
const getStudentMarksReport = async (req, res) => {
  try {
    if (req.user?.role === "student" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Access denied. You can only view your own report card." });
    }
    const records = await SessionalMark.find({ student: req.params.id }).sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMarksLedger, saveMarks, getStudentMarksReport };
