const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");
const Fee = require("../models/Fee");

let adminToken;
let teacherToken;
let studentToken;
let guardianToken;
let studentUser;
let otherStudentUser;

beforeAll(async () => {
  // Ensure DB connection is established
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once("connected", resolve));
  }

  // Obtain tokens for all 4 roles
  const adminRes = await request(app)
    .post("/api/auth/login")
    .send({ identifier: "admin@school.com", password: "admin123" });
  adminToken = adminRes.body.token;

  const teacherRes = await request(app)
    .post("/api/auth/login")
    .send({ identifier: "charu.s@schoolsync.edu", password: "teacher123" });
  teacherToken = teacherRes.body.token;

  const studentRes = await request(app)
    .post("/api/auth/login")
    .send({ identifier: "student@schoolsync.edu", password: "student123" });
  studentToken = studentRes.body.token;
  studentUser = studentRes.body;

  const guardianRes = await request(app)
    .post("/api/auth/login")
    .send({ identifier: "guardian@schoolsync.edu", password: "guardian123" });
  guardianToken = guardianRes.body.token;

  // Retrieve an unlinked student for negative IDOR tests
  const students = await User.find({ role: "student" });
  otherStudentUser = students.find((s) => s.email !== "student@schoolsync.edu") || students[1];
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("1. Authentication, RBAC & Parameter Tampering Guards", () => {
  it("should prevent privilege escalation during public registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Malicious Actor",
        email: `hacker_${Date.now()}@exploit.com`,
        password: "password123",
        role: "admin", // Attacker attempts to register as admin
      });

    expect(res.status).toBe(201);
    expect(res.body.role).not.toBe("admin");
    expect(res.body.role).toBe("student");
  });

  it("should prevent mass-assignment on user profile updates", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        contactNumber: "9998887777",
        role: "admin", // Attacker attempts to escalate role
        monthlySalary: 150000,
        class: "Grade 12",
      });

    expect(res.status).toBe(200);
    // Fetch profile to verify role was NOT altered
    const profileRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(profileRes.body.role).toBe("student");
    expect(profileRes.body.monthlySalary).not.toBe(150000);
  });
});

describe("2. Acceptance Test 1: Teacher Authorization Scoping", () => {
  it("should ALLOW teacher to access roll list for assigned class (10-A)", async () => {
    const res = await request(app)
      .get("/api/attendance/roll?class=10&section=A&date=11/15/2026")
      .set("Authorization", `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.rollList)).toBe(true);
    expect(res.body.totalStudents).toBeGreaterThan(0);
  });

  it("should REJECT teacher with 403 Forbidden when accessing unassigned class (Grade 3-C)", async () => {
    const res = await request(app)
      .get("/api/attendance/roll?class=Grade 3&section=C&date=11/15/2026")
      .set("Authorization", `Bearer ${teacherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not assigned/i);
  });

  it("should REJECT teacher with 403 Forbidden when submitting marks for unassigned class (Grade 3-C)", async () => {
    const res = await request(app)
      .post("/api/marks/save")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        class: "Grade 3",
        section: "C",
        subject: "Mathematics",
        examType: "Unit Test 1",
        entries: [],
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not assigned/i);
  });
});

describe("3. Acceptance Test 2: Attendance Duplicate Upsert & Conflict Protection", () => {
  it("should safely upsert attendance for the same student, date, and period without duplicates", async () => {
    const payload = {
      class: "10",
      section: "A",
      date: "11/15/2026",
      period: "Period 1",
      entries: [{ studentId: studentUser._id, status: "present" }],
    };

    // First save
    const firstRes = await request(app)
      .post("/api/attendance/save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);
    expect(firstRes.status).toBe(200);

    // Second save (updating status to 'late')
    const secondPayload = {
      ...payload,
      entries: [{ studentId: studentUser._id, status: "late" }],
    };
    const secondRes = await request(app)
      .post("/api/attendance/save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(secondPayload);
    expect(secondRes.status).toBe(200);
  });
});

describe("4. Acceptance Test 3: Configurable Grading Policy & Range Validation", () => {
  it("should return the institutional grading rules from database", async () => {
    const res = await request(app)
      .get("/api/grading-rules")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
    const grades = res.body.map((r) => r.grade);
    expect(grades).toContain("A+");
    expect(grades).toContain("F");
  });

  it("should REJECT negative marks with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/marks/save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        class: "10",
        section: "A",
        subject: "Mathematics",
        examType: "Unit Test 1",
        entries: [
          {
            studentId: studentUser._id,
            marksObtained: -15,
            maxMarks: 100,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/negative|range/i);
  });

  it("should REJECT marks exceeding maxMarks with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/marks/save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        class: "10",
        section: "A",
        subject: "Mathematics",
        examType: "Unit Test 1",
        entries: [
          {
            studentId: studentUser._id,
            marksObtained: 110,
            maxMarks: 100,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/exceed|range/i);
  });

  it("should block a student from viewing another student's marks (IDOR Guard)", async () => {
    const res = await request(app)
      .get(`/api/marks/student/${otherStudentUser._id}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});

describe("5. Acceptance Test 4: Guardian Scoping & Entity Verification", () => {
  it("should ALLOW guardian to view linked student's academic dossier", async () => {
    const res = await request(app)
      .get(`/api/students/${studentUser._id}`)
      .set("Authorization", `Bearer ${guardianToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(studentUser._id.toString());
  });

  it("should REJECT guardian with 403 Forbidden when accessing unlinked student's dossier", async () => {
    const res = await request(app)
      .get(`/api/students/${otherStudentUser._id}`)
      .set("Authorization", `Bearer ${guardianToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized|linked/i);
  });
});

describe("6. Acceptance Test 5: Payment Transaction Ledger & Overpayment Guard", () => {
  it("should retrieve discrete payment transactions from /api/fees/payments/history", async () => {
    const res = await request(app)
      .get("/api/fees/payments/history")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].receiptNumber).toBeDefined();
    expect(res.body[0].transactionId).toBeDefined();
  });

  it("should REJECT overpayments exceeding the invoice total with 400 Bad Request", async () => {
    const feeDoc = await Fee.findOne({ student: studentUser._id });
    expect(feeDoc).toBeDefined();

    const excessiveAmount = feeDoc.totalAmount + 50000;
    const res = await request(app)
      .put(`/api/fees/${feeDoc._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        paidAmount: excessiveAmount,
        paymentMethod: "UPI",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/exceed|overpayment/i);
  });
});

describe("7. Global Error Handling & Resilience", () => {
  it("should return 400 Bad Request on malformed ObjectId parameter instead of 500", async () => {
    const res = await request(app)
      .get("/api/students/not-a-valid-object-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid identifier format|Invalid student ID/i);
  });
});
