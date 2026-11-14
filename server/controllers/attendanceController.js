const User = require("../models/User");
const Attendance = require("../models/Attendance");

// @desc Load roll list for a class/section on a given date (with current status if marked)
// @route GET /api/attendance/roll?class=&section=&date=&period=
const getRollList = async (req, res) => {
  try {
    const { class: cls, section, date, period } = req.query;
    if (!cls || !section) {
      return res.status(400).json({ message: "class and section are required" });
    }

    const students = await User.find({ role: "student", class: cls, section }).select(
      "-password"
    );

    const records = await Attendance.find({
      class: cls,
      section,
      date,
      period: period || "Daily (Full Day)",
    });

    const recordMap = {};
    records.forEach((r) => (recordMap[r.student.toString()] = r.status));

    const rollList = students.map((s) => ({
      _id: s._id,
      name: s.name,
      rollNo: s.rollNo,
      status: recordMap[s._id.toString()] || "present",
    }));

    res.json({ totalStudents: students.length, rollList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Save/finalize attendance for a class on a date (bulk upsert)
// @route POST /api/attendance/save
const saveAttendance = async (req, res) => {
  try {
    const { class: cls, section, date, period, entries } = req.body;
    // entries: [{ studentId, status }]

    if (!cls || !section || !date || !Array.isArray(entries)) {
      return res.status(400).json({ message: "class, section, date and entries[] are required" });
    }

    const ops = entries.map((e) => ({
      updateOne: {
        filter: {
          student: e.studentId,
          date,
          period: period || "Daily (Full Day)",
        },
        update: {
          $set: {
            class: cls,
            section,
            status: e.status,
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);
    res.json({ message: "Attendance saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Attendance sheet/summary for a class/section for a month+year (calendar view)
// @route GET /api/attendance/summary?class=&section=&month=&year=
const getAttendanceSummary = async (req, res) => {
  try {
    let { class: cls, section, month, year } = req.query;

    // Strict role enforcement: Students can ONLY query their own enrolled class & section
    if (req.user?.role === "student") {
      cls = req.user.class || cls;
      section = req.user.section || section;
    }

    if (!cls || !section) {
      return res.status(400).json({ message: "class and section are required" });
    }

    // If student, query ONLY the student themselves
    const studentFilter = { role: "student", class: cls, section };
    if (req.user?.role === "student") {
      studentFilter._id = req.user._id;
    }

    const students = await User.find(studentFilter).select("name rollNo");

    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);

    const attendanceFilter = {
      class: cls,
      section,
      date: {
        $gte: `${String(monthIndex + 1).padStart(2, "0")}/01/${year}`,
        $lte: `${String(monthIndex + 1).padStart(2, "0")}/${String(end.getDate()).padStart(
          2,
          "0"
        )}/${year}`,
      },
    };

    if (req.user?.role === "student") {
      attendanceFilter.student = req.user._id;
    }

    const records = await Attendance.find(attendanceFilter);

    const sheet = students.map((s) => {
      const dayStatuses = {};
      records
        .filter((r) => r.student.toString() === s._id.toString())
        .forEach((r) => {
          const day = r.date.split("/")[1];
          dayStatuses[day] = r.status;
        });
      return { studentId: s._id, name: s.name, rollNo: s.rollNo, days: dayStatuses };
    });

    res.json({ daysInMonth: end.getDate(), sheet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Detailed attendance report for one student
// @route GET /api/attendance/student/:id
const getStudentAttendanceReport = async (req, res) => {
  try {
    // If student, ensure they can only inspect their own attendance report
    if (req.user?.role === "student" && req.user._id.toString() !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Access denied. You can only view your own attendance record." });
    }

    const records = await Attendance.find({ student: req.params.id });

    // Robust chronological descending sort (newest first) across cross-year MM/DD/YYYY strings
    records.sort((a, b) => {
      const [ma, da, ya] = (a.date || "").split("/").map(Number);
      const [mb, db, yb] = (b.date || "").split("/").map(Number);
      const timeA = new Date(ya || 2026, (ma || 1) - 1, da || 1).getTime();
      const timeB = new Date(yb || 2026, (mb || 1) - 1, db || 1).getTime();
      return timeB - timeA;
    });

    // Exclude holidays from conducted sessions, count present + late as attended
    const instructionalRecords = records.filter((r) => r.status !== "holiday");
    const totalConducted = instructionalRecords.length;
    const totalPresent = instructionalRecords.filter((r) => r.status === "present").length;
    const totalLate = instructionalRecords.filter((r) => r.status === "late").length;
    const totalAttended = totalPresent + totalLate;
    const totalAbsent = instructionalRecords.filter((r) => r.status === "absent").length;
    const percentage =
      totalConducted > 0 ? ((totalAttended / totalConducted) * 100).toFixed(1) : "0.0";

    res.json({
      records,
      totalPresent,
      totalLate,
      totalAttended,
      totalAbsent,
      totalRecords: totalConducted,
      percentage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRollList,
  saveAttendance,
  getAttendanceSummary,
  getStudentAttendanceReport,
};
