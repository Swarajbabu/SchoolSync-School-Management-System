require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Notice = require("../models/Notice");
const Exam = require("../models/Exam");
const Event = require("../models/Event");
const Attendance = require("../models/Attendance");
const StaffAttendance = require("../models/StaffAttendance");
const Fee = require("../models/Fee");
const Material = require("../models/Material");
const SessionalMark = require("../models/SessionalMark");
const Timetable = require("../models/Timetable");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const seed = async () => {
  await connectDB();

  console.log("Cleaning up all existing collections...");
  await User.deleteMany({});
  await Notice.deleteMany({});
  await Exam.deleteMany({});
  await Event.deleteMany({});
  await Attendance.deleteMany({});
  await StaffAttendance.deleteMany({});
  await Fee.deleteMany({});
  await Material.deleteMany({});
  await SessionalMark.deleteMany({});
  await Timetable.deleteMany({});

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const currentMonthName = MONTHS[currentMonthIdx];
  const prevMonthName = MONTHS[(currentMonthIdx - 1 + 12) % 12];
  const prevPrevMonthName = MONTHS[(currentMonthIdx - 2 + 12) % 12];

  const formatMMDDYYYY = (d) =>
    `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;

  const formatDDMMYYYY = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const formatYYYYMMDD = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const todayStr = formatMMDDYYYY(now);

  // 1. ADMIN USER
  console.log("Creating System Admin...");
  const admin = await User.create({
    name: "System Admin",
    email: "admin@school.com",
    password: "admin123",
    role: "admin",
    adminId: "SYSTEM_ADMIN",
    accessLevel: "Full Control (Root)",
    dutyStation: "Central Administration",
    accessProtocol: "ADMIN_SECURE_V1",
    status: "Active",
  });

  // 2. TEACHERS / STAFF
  console.log("Creating Faculty & Staff...");
  const teachers = await User.create([
    {
      name: "Charu Sarswat",
      email: "charusaraswat639649@gmail.com",
      password: "teacher123",
      role: "teacher",
      teacherId: "TCH101",
      primarySubject: "Mathematics",
      qualification: "Ph.D. in Mathematics",
      employeeType: "Academic Faculty",
      experience: "8 Years",
      department: "Science & Mathematics",
      dutyStation: "Academic Block A",
      reportingTo: "Principal / Academic Dean",
      payrollId: "PAY_101",
      contractStatus: "PERMANENT",
      monthlySalary: 65000,
      accessProtocol: "TEACHER_SECURE_V1",
      status: "Active",
    },
    {
      name: "Dr. Rajesh Sharma",
      email: "rajesh.sharma@school.com",
      password: "teacher123",
      role: "teacher",
      teacherId: "TCH102",
      primarySubject: "Physics",
      qualification: "M.Sc. Physics, Ph.D.",
      employeeType: "Academic Faculty",
      experience: "10 Years",
      department: "Science",
      dutyStation: "Physics Laboratory",
      reportingTo: "HOD Science",
      payrollId: "PAY_102",
      contractStatus: "PERMANENT",
      monthlySalary: 60000,
      accessProtocol: "TEACHER_SECURE_V1",
      status: "Active",
    },
    {
      name: "Priya Verma",
      email: "priya.verma@school.com",
      password: "teacher123",
      role: "teacher",
      teacherId: "TCH103",
      primarySubject: "English Literature",
      qualification: "M.A. English, B.Ed.",
      employeeType: "Academic Faculty",
      experience: "6 Years",
      department: "Humanities & Languages",
      dutyStation: "Languages Wing",
      reportingTo: "HOD Humanities",
      payrollId: "PAY_103",
      contractStatus: "PERMANENT",
      monthlySalary: 52000,
      accessProtocol: "TEACHER_SECURE_V1",
      status: "Active",
    },
    {
      name: "Amit Patel",
      email: "amit.patel@school.com",
      password: "teacher123",
      role: "teacher",
      teacherId: "TCH104",
      primarySubject: "Computer Science",
      qualification: "M.Tech CSE, MCA",
      employeeType: "Academic Faculty",
      experience: "5 Years",
      department: "Computer Applications",
      dutyStation: "Computer Lab 1",
      reportingTo: "HOD IT",
      payrollId: "PAY_104",
      contractStatus: "PERMANENT",
      monthlySalary: 58000,
      accessProtocol: "TEACHER_SECURE_V1",
      status: "Active",
    },
    {
      name: "Sunita Rao",
      email: "sunita.rao@school.com",
      password: "teacher123",
      role: "teacher",
      teacherId: "TCH105",
      primarySubject: "Chemistry",
      qualification: "M.Sc. Organic Chemistry",
      employeeType: "Academic Faculty",
      experience: "7 Years",
      department: "Science",
      dutyStation: "Chemistry Wing",
      reportingTo: "HOD Science",
      payrollId: "PAY_105",
      contractStatus: "PERMANENT",
      monthlySalary: 55000,
      accessProtocol: "TEACHER_SECURE_V1",
      status: "Active",
    },
  ]);

  // 3. STUDENTS
  console.log("Creating Students across classes & sections...");
  const students = await User.create([
    // Class 10 - Section A
    {
      name: "Ankit",
      email: "g@gmail.com",
      password: "student123",
      role: "student",
      rollNo: "4",
      class: "10",
      section: "A",
      bloodGroup: "A+",
      guardianContact: "9675700000",
      fatherName: "Mr Neeraj",
      motherName: "Mrs Rekha",
      dob: "22/05/2009",
      religion: "HINDUISM",
      gender: "MALE",
      currentAddress: "Nagla bans post kumarpur Hathras",
      permanentAddress: "Nagla bans post kumarpur Hathras",
      enrollmentNo: "4",
      academicSession: "2025-2026",
      status: "Active",
    },
    {
      name: "Aarav Sharma",
      email: "aarav.sharma@school.com",
      password: "student123",
      role: "student",
      rollNo: "1001",
      class: "10",
      section: "A",
      bloodGroup: "O+",
      guardianContact: "9876543210",
      fatherName: "Sanjay Sharma",
      motherName: "Sunita Sharma",
      dob: "12/04/2009",
      religion: "HINDUISM",
      gender: "MALE",
      currentAddress: "Flat 402, Green Valley Apartments",
      permanentAddress: "Flat 402, Green Valley Apartments",
      enrollmentNo: "ENR-2024-1001",
      academicSession: "2025-2026",
      status: "Active",
    },
    {
      name: "Ananya Gupta",
      email: "ananya.gupta@school.com",
      password: "student123",
      role: "student",
      rollNo: "1002",
      class: "10",
      section: "A",
      bloodGroup: "B+",
      guardianContact: "9876543211",
      fatherName: "Ramesh Gupta",
      motherName: "Kavita Gupta",
      dob: "18/09/2009",
      religion: "HINDUISM",
      gender: "FEMALE",
      currentAddress: "House 55, Model Town",
      permanentAddress: "House 55, Model Town",
      enrollmentNo: "ENR-2024-1002",
      academicSession: "2025-2026",
      status: "Active",
    },
    {
      name: "Rohan Mehta",
      email: "rohan.mehta@school.com",
      password: "student123",
      role: "student",
      rollNo: "1003",
      class: "10",
      section: "A",
      bloodGroup: "AB+",
      guardianContact: "9876543214",
      fatherName: "Vikas Mehta",
      motherName: "Pooja Mehta",
      dob: "05/11/2009",
      religion: "HINDUISM",
      gender: "MALE",
      currentAddress: "Sector 14, Urban Estate",
      permanentAddress: "Sector 14, Urban Estate",
      enrollmentNo: "ENR-2024-1003",
      academicSession: "2025-2026",
      status: "Active",
    },
    {
      name: "Sneha Kapoor",
      email: "sneha.kapoor@school.com",
      password: "student123",
      role: "student",
      rollNo: "1004",
      class: "10",
      section: "A",
      bloodGroup: "A-",
      guardianContact: "9876543215",
      fatherName: "Deepak Kapoor",
      motherName: "Renu Kapoor",
      dob: "14/02/2009",
      religion: "HINDUISM",
      gender: "FEMALE",
      currentAddress: "Plot 89, Civil Lines",
      permanentAddress: "Plot 89, Civil Lines",
      enrollmentNo: "ENR-2024-1004",
      academicSession: "2025-2026",
      status: "Active",
    },

    // Class 10 - Section B
    {
      name: "Kabir Singh",
      email: "kabir.singh@school.com",
      password: "student123",
      role: "student",
      rollNo: "1011",
      class: "10",
      section: "B",
      bloodGroup: "O+",
      guardianContact: "9876543216",
      fatherName: "Harpreet Singh",
      motherName: "Jaswinder Kaur",
      dob: "30/08/2009",
      religion: "SIKHISM",
      gender: "MALE",
      currentAddress: "Block C, Defence Colony",
      permanentAddress: "Block C, Defence Colony",
      enrollmentNo: "ENR-2024-1011",
      academicSession: "2025-2026",
      status: "Active",
    },
    {
      name: "Diya Malhotra",
      email: "diya.malhotra@school.com",
      password: "student123",
      role: "student",
      rollNo: "1012",
      class: "10",
      section: "B",
      bloodGroup: "B+",
      guardianContact: "9876543217",
      fatherName: "Rajeev Malhotra",
      motherName: "Simran Malhotra",
      dob: "21/01/2009",
      religion: "HINDUISM",
      gender: "FEMALE",
      currentAddress: "Lake View Residency",
      permanentAddress: "Lake View Residency",
      enrollmentNo: "ENR-2024-1012",
      academicSession: "2025-2026",
      status: "Active",
    },

    // Class 3 - Section C
    {
      name: "Ayush",
      email: "a@gmail.com",
      password: "student123",
      role: "student",
      rollNo: "5",
      class: "3",
      section: "C",
      bloodGroup: "O+",
      guardianContact: "9875706630",
      fatherName: "Manish Kumar",
      motherName: "Sita Devi",
      dob: "11/03/2016",
      religion: "HINDUISM",
      gender: "MALE",
      currentAddress: "Lane 4, Gandhi Nagar",
      permanentAddress: "Lane 4, Gandhi Nagar",
      enrollmentNo: "5",
      academicSession: "2025-2026",
      status: "Active",
    },
    {
      name: "Tanvi Joshi",
      email: "tanvi.joshi@school.com",
      password: "student123",
      role: "student",
      rollNo: "3006",
      class: "3",
      section: "C",
      bloodGroup: "A+",
      guardianContact: "9875706631",
      fatherName: "Naveen Joshi",
      motherName: "Meenakshi Joshi",
      dob: "09/07/2016",
      religion: "HINDUISM",
      gender: "FEMALE",
      currentAddress: "Shanti Niketan Colony",
      permanentAddress: "Shanti Niketan Colony",
      enrollmentNo: "3006",
      academicSession: "2025-2026",
      status: "Active",
    },

    // Grade 12 - Section A
    {
      name: "Charu Sarswat",
      email: "charu@school.com",
      password: "student123",
      role: "student",
      rollNo: "2200330100078",
      class: "Grade 12",
      section: "A",
      bloodGroup: "B+",
      guardianContact: "9875706630",
      fatherName: "Ashok Sarswat",
      motherName: "Shashi Sarswat",
      dob: "15/06/2007",
      religion: "HINDUISM",
      gender: "FEMALE",
      currentAddress: "Park Avenue, City Center",
      permanentAddress: "Park Avenue, City Center",
      enrollmentNo: "2200330100078",
      academicSession: "2025-2026",
      status: "Active",
    },
    {
      name: "Ankit Kumar",
      email: "ankit@school.com",
      password: "student123",
      role: "student",
      rollNo: "LO1001",
      class: "Grade 12",
      section: "A",
      bloodGroup: "O-",
      guardianContact: "9875706632",
      fatherName: "Dinesh Kumar",
      motherName: "Anita Kumar",
      dob: "20/12/2006",
      religion: "HINDUISM",
      gender: "MALE",
      currentAddress: "Railway Colony Sector 2",
      permanentAddress: "Railway Colony Sector 2",
      enrollmentNo: "LO1001",
      academicSession: "2025-2026",
      status: "Active",
    },
  ]);

  // 4. STAFF ATTENDANCE
  console.log("Creating Staff Attendance records...");
  const staffAttendanceDocs = [];
  // Mark today's attendance for all teachers so Faculty Today = 100%
  teachers.forEach((t) => {
    staffAttendanceDocs.push({
      staff: t._id,
      date: todayStr,
      status: "present",
      markedBy: admin._id,
    });
  });

  // Also seed past 7 days for staff attendance history
  for (let i = 1; i <= 7; i++) {
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - i);
    // skip Sunday (day 0)
    if (pastDate.getDay() === 0) continue;
    const pDateStr = formatMMDDYYYY(pastDate);

    teachers.forEach((t, idx) => {
      // make one teacher occasionally late or on leave for realistic variety
      let status = "present";
      if (i === 2 && idx === 1) status = "late";
      if (i === 4 && idx === 3) status = "leave";

      staffAttendanceDocs.push({
        staff: t._id,
        date: pDateStr,
        status,
        markedBy: admin._id,
      });
    });
  }
  await StaffAttendance.insertMany(staffAttendanceDocs);

  // 5. STUDENT ATTENDANCE
  console.log("Creating Student Attendance records...");
  const studentAttendanceDocs = [];

  // Seed attendance for past 20 school days (including today)
  for (let dayOffset = 0; dayOffset < 20; dayOffset++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dayOffset);
    if (d.getDay() === 0) continue; // Skip Sunday

    const dateStr = formatMMDDYYYY(d);

    students.forEach((s, sIdx) => {
      // Deterministic realistic attendance (85% - 95% attendance rate)
      let status = "present";
      if ((dayOffset + sIdx) % 11 === 0) status = "absent";
      else if ((dayOffset + sIdx) % 17 === 0) status = "late";

      studentAttendanceDocs.push({
        student: s._id,
        class: s.class,
        section: s.section,
        date: dateStr,
        period: "Daily (Full Day)",
        status,
        markedBy: teachers[0]._id,
      });
    });
  }
  await Attendance.insertMany(studentAttendanceDocs);

  // 6. FEE RECORDS (Current Month, Last Month, Prior Month)
  console.log("Creating Fee records...");
  const feeDocs = [];
  const feeMonths = [
    { month: currentMonthName, year: String(currentYear) },
    { month: prevMonthName, year: String(currentYear) },
    { month: prevPrevMonthName, year: String(currentYear) },
  ];

  students.forEach((s, sIdx) => {
    const baseFee = s.class === "Grade 12" ? 6000 : s.class === "10" ? 4500 : 3200;

    feeMonths.forEach((fm, mIdx) => {
      let paid = baseFee;
      let status = "PAID";

      if (mIdx === 0) {
        // Current month: mix of paid, partial, pending
        if (sIdx % 3 === 0) {
          paid = baseFee;
          status = "PAID";
        } else if (sIdx % 3 === 1) {
          paid = Math.round(baseFee * 0.5);
          status = "PARTIAL";
        } else {
          paid = 0;
          status = "PENDING";
        }
      } else if (mIdx === 1) {
        // Last month: mostly paid, some partial
        if (sIdx % 4 === 0) {
          paid = Math.round(baseFee * 0.6);
          status = "PARTIAL";
        } else {
          paid = baseFee;
          status = "PAID";
        }
      } else {
        // Prior month: all paid
        paid = baseFee;
        status = "PAID";
      }

      feeDocs.push({
        student: s._id,
        class: s.class,
        section: s.section,
        month: fm.month,
        year: fm.year,
        totalAmount: baseFee,
        paidAmount: paid,
        settlementStatus: status,
      });
    });
  });
  await Fee.insertMany(feeDocs);

  // 7. ACADEMIC MATERIALS / DOCUMENTS
  console.log("Creating Academic Materials & Documents...");
  await Material.create([
    // Class 10
    {
      title: "Quadratic Equations - Complete Theory & Formula Sheet",
      targetClass: "10",
      section: "All Sections",
      category: "STUDY MATERIAL",
      subject: "Mathematics",
      link: "https://example.com/materials/class10-quadratic-equations.pdf",
      uploadedBy: teachers[0]._id,
    },
    {
      title: "Class 10 Mid-Term Mathematics Diagnostic Paper 2026",
      targetClass: "10",
      section: "All Sections",
      category: "PAPER",
      subject: "Mathematics",
      link: "https://example.com/materials/math-midterm-paper.pdf",
      uploadedBy: teachers[0]._id,
    },
    {
      title: "Weekly Practice Worksheet: Triangles & Trigonometry",
      targetClass: "10",
      section: "A",
      category: "HOMEWORK",
      subject: "Mathematics",
      link: "https://example.com/materials/math-hw-week4.pdf",
      uploadedBy: teachers[0]._id,
    },
    {
      title: "Light: Reflection & Refraction - Ray Diagrams Handbook",
      targetClass: "10",
      section: "All Sections",
      category: "STUDY MATERIAL",
      subject: "Physics",
      link: "https://example.com/materials/physics-ray-optics.pdf",
      uploadedBy: teachers[1]._id,
    },
    {
      title: "Class 10 Physics Sample Board Question Paper",
      targetClass: "10",
      section: "All Sections",
      category: "PAPER",
      subject: "Physics",
      link: "https://example.com/materials/physics-sample-paper.pdf",
      uploadedBy: teachers[1]._id,
    },
    {
      title: "English Literature: Act 3 Scene 2 Character Analysis",
      targetClass: "10",
      section: "A",
      category: "HOMEWORK",
      subject: "English Literature",
      link: "https://example.com/materials/english-essay-assignment.pdf",
      uploadedBy: teachers[2]._id,
    },
    {
      title: "Introduction to Python Programming & Data Structures",
      targetClass: "10",
      section: "All Sections",
      category: "STUDY MATERIAL",
      subject: "Computer Science",
      link: "https://example.com/materials/cs-python-intro.pdf",
      uploadedBy: teachers[3]._id,
    },

    // Grade 12
    {
      title: "Electromagnetic Waves & Wave Optics Comprehensive Guide",
      targetClass: "Grade 12",
      section: "All Sections",
      category: "STUDY MATERIAL",
      subject: "Physics",
      link: "https://example.com/materials/grade12-optics.pdf",
      uploadedBy: teachers[1]._id,
    },
    {
      title: "Organic Reaction Mechanisms & Named Reactions Summary",
      targetClass: "Grade 12",
      section: "All Sections",
      category: "STUDY MATERIAL",
      subject: "Chemistry",
      link: "https://example.com/materials/chemistry-organic-reactions.pdf",
      uploadedBy: teachers[4]._id,
    },
    {
      title: "Pre-Board Chemistry Model Test Paper 2026",
      targetClass: "Grade 12",
      section: "A",
      category: "PAPER",
      subject: "Chemistry",
      link: "https://example.com/materials/preboard-chemistry.pdf",
      uploadedBy: teachers[4]._id,
    },
    {
      title: "Calculus & Differential Equations Assignment #5",
      targetClass: "Grade 12",
      section: "A",
      category: "HOMEWORK",
      subject: "Mathematics",
      link: "https://example.com/materials/math-calculus-hw5.pdf",
      uploadedBy: teachers[0]._id,
    },

    // Class 3
    {
      title: "Basic Multiplication & Division Fun Activity Sheets",
      targetClass: "3",
      section: "All Sections",
      category: "STUDY MATERIAL",
      subject: "Mathematics",
      link: "https://example.com/materials/class3-math-fun.pdf",
      uploadedBy: teachers[0]._id,
    },
    {
      title: "Class 3 English Story Reading & Grammar Homework",
      targetClass: "3",
      section: "C",
      category: "HOMEWORK",
      subject: "English",
      link: "https://example.com/materials/class3-english-reading.pdf",
      uploadedBy: teachers[2]._id,
    },
    {
      title: "Environmental Studies: Living Things & Plant Life Worksheet",
      targetClass: "3",
      section: "All Sections",
      category: "PAPER",
      subject: "Environmental Studies",
      link: "https://example.com/materials/evs-test-paper.pdf",
      uploadedBy: teachers[4]._id,
    },
  ]);

  // 8. SESSIONAL MARKS / ACADEMIC RESULTS
  console.log("Creating Sessional Marks...");
  const marksDocs = [];
  const subjectsClass10 = [
    { subject: "Mathematics", teacher: "Charu Sarswat" },
    { subject: "Physics", teacher: "Dr. Rajesh Sharma" },
    { subject: "Chemistry", teacher: "Sunita Rao" },
    { subject: "English Literature", teacher: "Priya Verma" },
    { subject: "Computer Science", teacher: "Amit Patel" },
  ];

  const subjectsGrade12 = [
    { subject: "Mathematics", teacher: "Charu Sarswat" },
    { subject: "Physics", teacher: "Dr. Rajesh Sharma" },
    { subject: "Chemistry", teacher: "Sunita Rao" },
    { subject: "English", teacher: "Priya Verma" },
    { subject: "Computer Science", teacher: "Amit Patel" },
  ];

  const subjectsClass3 = [
    { subject: "Mathematics", teacher: "Charu Sarswat" },
    { subject: "English", teacher: "Priya Verma" },
    { subject: "Environmental Studies", teacher: "Sunita Rao" },
  ];

  students.forEach((s, sIdx) => {
    let subList = subjectsClass10;
    if (s.class === "Grade 12") subList = subjectsGrade12;
    if (s.class === "3") subList = subjectsClass3;

    ["1st Sessional", "2nd Sessional"].forEach((assessmentType, aIdx) => {
      subList.forEach((sub, subIdx) => {
        // Generate realistic marks between 60 and 96
        const baseMark = 72 + ((sIdx * 7 + subIdx * 5 + aIdx * 4) % 24);
        const marksObtained = Math.min(100, Math.max(45, baseMark));
        let remarks = "Consistently good conceptual understanding.";
        if (marksObtained >= 90) remarks = "Outstanding performance, top of the class!";
        else if (marksObtained < 65) remarks = "Needs focused revision on numerical problems.";

        marksDocs.push({
          student: s._id,
          class: s.class,
          section: s.section,
          assessmentType,
          subject: sub.subject,
          marksObtained,
          maxMarks: 100,
          remarks,
          year: String(currentYear),
        });
      });
    });
  });
  await SessionalMark.insertMany(marksDocs);

  // 9. TIMETABLE
  console.log("Creating Weekly Timetable grid...");
  const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const PERIODS = [
    "LEC.01", "LEC.02", "LEC.03", "LEC.04", "LEC.05", "LEC.06", "LEC.07", "LEC.08"
  ];

  const class10TimetablePlan = [
    { sub: "Mathematics", code: "MTH101", type: "Theory", fac: "Charu Sarswat", facCode: "TCH101", dept: "Mathematics" },
    { sub: "Physics", code: "PHY101", type: "Theory", fac: "Dr. Rajesh Sharma", facCode: "TCH102", dept: "Science" },
    { sub: "English Literature", code: "ENG101", type: "Theory", fac: "Priya Verma", facCode: "TCH103", dept: "Languages" },
    { sub: "Chemistry", code: "CHM101", type: "Theory", fac: "Sunita Rao", facCode: "TCH105", dept: "Science" },
    { sub: "Computer Science", code: "CSC101", type: "Practical", fac: "Amit Patel", facCode: "TCH104", dept: "IT" },
    { sub: "Physics Lab", code: "PHY101P", type: "Practical", fac: "Dr. Rajesh Sharma", facCode: "TCH102", dept: "Science" },
    { sub: "Mathematics Tutorial", code: "MTH101T", type: "Tutorial", fac: "Charu Sarswat", facCode: "TCH101", dept: "Mathematics" },
    { sub: "Library & Self Study", code: "LIB101", type: "Activity", fac: "Priya Verma", facCode: "TCH103", dept: "Languages" },
  ];

  const timetableDocs = [];
  // Populate Class 10 - Section A
  DAYS.forEach((day, dIdx) => {
    PERIODS.forEach((period, pIdx) => {
      // rotate subject index per day so schedule is varied
      const planItem = class10TimetablePlan[(pIdx + dIdx) % class10TimetablePlan.length];
      timetableDocs.push({
        class: "10",
        section: "A",
        day,
        period,
        subjectName: planItem.sub,
        subjectCode: planItem.code,
        subjectType: planItem.type,
        facultyName: planItem.fac,
        facultyCode: planItem.facCode,
        department: planItem.dept,
      });
    });
  });

  // Populate Grade 12 - Section A
  DAYS.forEach((day, dIdx) => {
    PERIODS.forEach((period, pIdx) => {
      const planItem = class10TimetablePlan[(pIdx + dIdx + 2) % class10TimetablePlan.length];
      timetableDocs.push({
        class: "Grade 12",
        section: "A",
        day,
        period,
        subjectName: planItem.sub,
        subjectCode: planItem.code.replace("101", "121"),
        subjectType: planItem.type,
        facultyName: planItem.fac,
        facultyCode: planItem.facCode,
        department: planItem.dept,
      });
    });
  });

  // Populate Class 3 - Section C
  const class3Plan = [
    { sub: "Mathematics", code: "MTH03", type: "Theory", fac: "Charu Sarswat", facCode: "TCH101", dept: "Mathematics" },
    { sub: "English Reading", code: "ENG03", type: "Theory", fac: "Priya Verma", facCode: "TCH103", dept: "Languages" },
    { sub: "Environmental Studies", code: "EVS03", type: "Theory", fac: "Sunita Rao", facCode: "TCH105", dept: "Science" },
    { sub: "Art & Craft", code: "ART03", type: "Activity", fac: "Priya Verma", facCode: "TCH103", dept: "Arts" },
    { sub: "Physical Education", code: "PED03", type: "Practical", fac: "Amit Patel", facCode: "TCH104", dept: "Sports" },
  ];
  DAYS.forEach((day, dIdx) => {
    PERIODS.slice(0, 5).forEach((period, pIdx) => {
      const planItem = class3Plan[(pIdx + dIdx) % class3Plan.length];
      timetableDocs.push({
        class: "3",
        section: "C",
        day,
        period,
        subjectName: planItem.sub,
        subjectCode: planItem.code,
        subjectType: planItem.type,
        facultyName: planItem.fac,
        facultyCode: planItem.facCode,
        department: planItem.dept,
      });
    });
  });

  await Timetable.insertMany(timetableDocs);

  // 10. NOTICES
  console.log("Creating Notices...");
  await Notice.create([
    {
      title: "ANNUAL SPORTS MEET 2026",
      content:
        "The Annual Sports Meet 2026 will be held at the main athletic stadium. Registrations for track and field events are now open. All students are encouraged to participate.",
      category: "Sports",
      audience: "EVERYONE",
      publishedBy: admin._id,
    },
    {
      title: "Parent-Teacher Meeting (PTM) for Term Assessment",
      content:
        "The Parent-Teacher Meeting for evaluating mid-term academic performance and attendance is scheduled for this upcoming Saturday from 9:00 AM to 1:00 PM.",
      category: "Academic",
      audience: "EVERYONE",
      publishedBy: admin._id,
    },
    {
      title: "Mid-Term Examination Datesheet & Admit Card Collection",
      content:
        "Admit cards for the upcoming Mid-Term Examinations will be distributed starting Monday. Please ensure all library clearances and outstanding fee dues are settled.",
      category: "Examination",
      audience: "STUDENT",
      publishedBy: admin._id,
    },
    {
      title: "Faculty Academic Review & Curriculum Moderation Meeting",
      content:
        "All departmental heads and faculty members are requested to attend the term review meeting in Conference Room 1 at 3:30 PM this Friday.",
      category: "Administration",
      audience: "TEACHER",
      publishedBy: admin._id,
    },
    {
      title: "Science Fair & STEM Innovation Expo 2026",
      content:
        "Submissions for science fair projects, working models, and robotics demonstrations must be submitted to the Science Department before the end of the month.",
      category: "Event",
      audience: "EVERYONE",
      publishedBy: admin._id,
    },
  ]);

  // 11. EXAMS
  console.log("Creating Exam Schedule...");
  // Upcoming exam dates relative to now
  const examDate1 = new Date(now);
  examDate1.setDate(now.getDate() + 7);
  const examDate2 = new Date(now);
  examDate2.setDate(now.getDate() + 15);
  const examDate3 = new Date(now);
  examDate3.setDate(now.getDate() + 25);
  const examDate4 = new Date(now);
  examDate4.setDate(now.getDate() + 40);

  await Exam.create([
    {
      examName: "UNIT TEST 2",
      targetClass: "10",
      examDate: formatDDMMYYYY(examDate1),
      description: "Mathematics & Science Unit Test 2",
      academicSession: `${currentYear}-${currentYear + 1}`,
    },
    {
      examName: "MID TERM EXAMINATION",
      targetClass: "Grade 12",
      examDate: formatDDMMYYYY(examDate2),
      description: "Full syllabus theory papers for Grade 12 Board candidates",
      academicSession: `${currentYear}-${currentYear + 1}`,
    },
    {
      examName: "PRIMARY DIAGNOSTIC ASSESSMENT",
      targetClass: "3",
      examDate: formatDDMMYYYY(examDate3),
      description: "Literacy, Numeracy and Environmental Studies Assessment",
      academicSession: `${currentYear}-${currentYear + 1}`,
    },
    {
      examName: "HALF YEARLY EXAMINATION",
      targetClass: "All Classes",
      examDate: formatDDMMYYYY(examDate4),
      description: "Comprehensive mid-year examinations for primary and secondary wings",
      academicSession: `${currentYear}-${currentYear + 1}`,
    },
  ]);

  // 12. EVENTS & HOLIDAYS
  console.log("Creating School Events & Holidays...");
  const eventDate1 = new Date(now);
  eventDate1.setDate(now.getDate() + 3);
  const eventDate2 = new Date(now);
  eventDate2.setDate(now.getDate() + 12);
  const eventDate3 = new Date(now);
  eventDate3.setDate(now.getDate() + 22);

  await Event.create([
    {
      title: "Annual Sports Meet & Athletic Championship",
      type: "event",
      date: formatYYYYMMDD(eventDate1),
      description: "Opening ceremony at 8:30 AM, Main Sports Complex.",
      createdBy: admin._id,
    },
    {
      title: "Winter Festival & Thanksgiving Holiday",
      type: "holiday",
      date: formatYYYYMMDD(eventDate2),
      description: "School closed. Administrative offices remain non-operational.",
      createdBy: admin._id,
    },
    {
      title: "Inter-School Science Fair 2026",
      type: "event",
      date: formatYYYYMMDD(eventDate3),
      description: "Science Auditorium - Exhibition of student research projects.",
      createdBy: admin._id,
    },
  ]);

  console.log("===================================================");
  console.log("🎉 Complete Mock Database Seeded Successfully!");
  console.log("===================================================");
  console.log(`✅ Admin: 1 record`);
  console.log(`✅ Teachers/Staff: ${teachers.length} records`);
  console.log(`✅ Students: ${students.length} records`);
  console.log(`✅ Staff Attendance: ${staffAttendanceDocs.length} records`);
  console.log(`✅ Student Attendance: ${studentAttendanceDocs.length} records`);
  console.log(`✅ Fees: ${feeDocs.length} records`);
  console.log(`✅ Materials: 14 records`);
  console.log(`✅ Sessional Marks: ${marksDocs.length} records`);
  console.log(`✅ Timetable Slots: ${timetableDocs.length} records`);
  console.log(`✅ Notices: 5 records`);
  console.log(`✅ Exams: 4 records`);
  console.log(`✅ Events/Holidays: 3 records`);
  console.log("---------------------------------------------------");
  console.log("🔑 Demo Logins:");
  console.log("Admin   -> admin@school.com / admin123");
  console.log("Teacher -> charusaraswat639649@gmail.com / teacher123");
  console.log("Student -> Roll: 4 (email: g@gmail.com) / student123");
  console.log("===================================================");

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
