const User = require("../models/User");
const Exam = require("../models/Exam");
const Notice = require("../models/Notice");
const Fee = require("../models/Fee");
const Attendance = require("../models/Attendance");
const StaffAttendance = require("../models/StaffAttendance");
const Timetable = require("../models/Timetable");
const SessionalMark = require("../models/SessionalMark");
const Material = require("../models/Material");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

// @desc Get role-scoped summary telemetry for the Command Dashboard
// @route GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const role = req.user?.role || "student";
    const now = new Date();
    const todayStr = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(
      now.getDate()
    ).padStart(2, "0")}/${now.getFullYear()}`;
    const dayOfWeek = DAYS[now.getDay()];
    // On Sunday, show Monday's schedule for upcoming preparation
    const effectiveDay = dayOfWeek === "SUNDAY" ? "MONDAY" : dayOfWeek;

    // ==========================================
    // 1. ADMIN TELEMETRY (INSTITUTIONAL CONTROL)
    // ==========================================
    if (role === "admin") {
      const totalStudents = await User.countDocuments({ role: "student" });
      const totalStaff = await User.countDocuments({ role: "teacher" });
      const totalExams = await Exam.countDocuments();
      const totalNotices = await Notice.countDocuments();

      // Faculty Today = % of staff marked present today
      const presentToday = await StaffAttendance.countDocuments({
        date: todayStr,
        status: "present",
      });
      const facultyAttendancePercent =
        totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0;

      // Month Revenue / Fee Arrears for the current month & year
      const monthName = MONTHS[now.getMonth()];
      const year = String(now.getFullYear());
      const monthFees = await Fee.find({ month: monthName, year });
      const monthRevenue = monthFees.reduce((sum, f) => sum + f.paidAmount, 0);
      const feeArrears = monthFees.reduce(
        (sum, f) => sum + (f.totalAmount - f.paidAmount),
        0
      );

      // All-time totals
      const allFees = await Fee.find();
      const totalCollection = allFees.reduce((sum, f) => sum + f.paidAmount, 0);
      const totalPending = allFees.reduce(
        (sum, f) => sum + (f.totalAmount - f.paidAmount),
        0
      );

      return res.json({
        role: "admin",
        totalStudents,
        totalStaff,
        totalExams,
        totalNotices,
        facultyAttendancePercent,
        monthRevenue,
        feeArrears,
        totalCollection,
        totalPending,
      });
    }

    // ==========================================
    // 2. TEACHER TELEMETRY (ACADEMIC FACULTY)
    // ==========================================
    if (role === "teacher") {
      const teacherName = (req.user.name || "").trim();
      const teacherId = (req.user.teacherId || "").trim();
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const conditions = [];
      if (teacherId) {
        conditions.push({ facultyCode: teacherId });
      }
      if (teacherName) {
        conditions.push({ facultyName: new RegExp(`^${escapeRegex(teacherName)}$`, "i") });
      }

      // Find all timetable slots assigned to this teacher
      const teacherSlots = conditions.length > 0 ? await Timetable.find({ $or: conditions }) : [];

      // Extract unique classes (e.g., ["10-A", "12-A"])
      const assignedClasses = [
        ...new Set(teacherSlots.map((s) => `${s.class}-${s.section}`)),
      ];

      // Extract unique subjects
      const mySubjects = [
        ...new Set(
          teacherSlots.map((s) => s.subjectName).filter((sub) => sub && sub.trim())
        ),
      ];

      // Today's lectures
      const todayLectures = teacherSlots
        .filter((s) => s.day === effectiveDay)
        .sort((a, b) => a.period.localeCompare(b.period));

      // Check how many of assigned classes have attendance marked for today
      let pendingAttendanceCount = 0;
      for (const clsSec of assignedClasses) {
        const [cls, sec] = clsSec.split("-");
        const count = await Attendance.countDocuments({
          class: cls,
          section: sec,
          date: todayStr,
        });
        if (count === 0) pendingAttendanceCount++;
      }

      const materialsUploaded = await Material.countDocuments({
        uploadedBy: req.user._id,
      });

      const totalNotices = await Notice.countDocuments({
        $or: [
          { audience: { $in: ["EVERYONE", "TEACHER"] } },
          { publishedBy: req.user._id },
        ],
      });

      const totalExams = await Exam.countDocuments();

      return res.json({
        role: "teacher",
        assignedClassesCount: assignedClasses.length,
        assignedClasses,
        mySubjects,
        todayLecturesCount: todayLectures.length,
        todayLectures,
        effectiveDay,
        pendingAttendanceCount,
        materialsUploaded,
        totalNotices,
        totalExams,
      });
    }

    // ==========================================
    // 3. STUDENT TELEMETRY (LEARNER PORTAL)
    // ==========================================
    if (role === "student") {
      const studentId = req.user._id;
      const studentClass = req.user.class || "10";
      const studentSection = req.user.section || "A";

      // Attendance telemetry (holidays excluded, present + late counted)
      const allAttendance = await Attendance.find({ student: studentId });
      const instructionalRecords = allAttendance.filter((r) => r.status !== "holiday");
      const totalClassesConducted = instructionalRecords.length;
      const totalClassesAttended = instructionalRecords.filter(
        (r) => r.status === "present" || r.status === "late"
      ).length;
      const attendancePercent =
        totalClassesConducted > 0
          ? Math.round((totalClassesAttended / totalClassesConducted) * 100)
          : 0;

      // Fee telemetry
      const fees = await Fee.find({ student: studentId });
      const totalFeeAmount = fees.reduce((sum, f) => sum + f.totalAmount, 0);
      const totalFeePaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
      const feeDues = Math.max(0, totalFeeAmount - totalFeePaid);
      let feeStatus = "PENDING";
      if (fees.length === 0) {
        feeStatus = "NO_INVOICES";
      } else if (feeDues === 0 && totalFeeAmount > 0) {
        feeStatus = "PAID";
      } else if (totalFeePaid > 0) {
        feeStatus = "PARTIAL";
      }

      // Academic performance / Marks
      const marks = await SessionalMark.find({ student: studentId });
      const totalObtained = marks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
      const totalMax = marks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
      const averageMarksPercent =
        totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

      // Today's classes for student's enrolled class & section
      const todayLectures = await Timetable.find({
        class: studentClass,
        section: studentSection,
        day: effectiveDay,
      }).sort({ period: 1 });

      // Upcoming exams for this student's class (filtering out past/concluded exams)
      const allClassExams = await Exam.find({
        targetClass: { $in: [studentClass, "All Classes"] },
      });
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const upcomingExams = allClassExams.filter((exam) => {
        if (!exam.examDate) return true;
        const clean = String(exam.examDate).trim();
        let target = null;
        if (clean.includes("-")) {
          const parts = clean.split("-").map(Number);
          if (parts[0] > 1000) target = new Date(parts[0], parts[1] - 1, parts[2]);
          else target = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (clean.includes("/")) {
          const parts = clean.split("/").map(Number);
          if (parts[0] <= 12 && parts[1] > 12) target = new Date(parts[2], parts[0] - 1, parts[1]);
          else target = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          target = new Date(clean);
        }
        if (!target || isNaN(target.getTime())) return true;
        target.setHours(0, 0, 0, 0);
        return target.getTime() >= todayStart.getTime();
      });
      const upcomingExamsCount = upcomingExams.length;

      // Notices for students
      const totalNotices = await Notice.countDocuments({
        audience: { $in: ["EVERYONE", "STUDENT"] },
      });

      return res.json({
        role: "student",
        enrolledClass: studentClass,
        enrolledSection: studentSection,
        rollNo: req.user.rollNo || "N/A",
        attendancePercent,
        totalClassesAttended,
        totalClassesConducted,
        feeDues,
        totalFeePaid,
        totalFeeAmount,
        feeStatus,
        averageMarksPercent,
        gradedSubjectsCount: marks.length,
        todayLecturesCount: todayLectures.length,
        todayLectures,
        effectiveDay,
        upcomingExamsCount,
        totalNotices,
      });
    }

    res.status(400).json({ message: "Unrecognized user role" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats };
