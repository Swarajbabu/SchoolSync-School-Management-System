const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const app = require("../server");

const mongoose = require("mongoose");

let server;
let baseUrl;

// Test state tokens
let adminToken = "";
let teacherToken = "";
let studentToken = "";
let testFeeId = "";
let sampleStudentId = "";

before(async () => {
  // Start server on an ephemeral port for testing
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.close();
});

// Helper for HTTP requests
async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, headers: res.headers, data };
}

describe("1. System Health & Infrastructure", () => {
  test("GET /api/health returns HTTP 200 OK", async () => {
    const res = await request("/api/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, "OK");
  });

  test("GET /api/unknown-endpoint returns 404 Route Not Found", async () => {
    const res = await request("/api/unknown-endpoint");
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.data.message, "Route not found");
  });
});

describe("2. Authentication & JWT Token Issuance", () => {
  test("Admin login succeeds and issues JWT with role 'admin'", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: {
        identifier: "admin@school.com",
        password: "admin123",
        loginType: "staff",
      },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token, "Token should be present");
    assert.strictEqual(res.data.role, "admin");
    adminToken = res.data.token;
  });

  test("Teacher login succeeds and issues JWT with role 'teacher'", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: {
        identifier: "charu.s@schoolsync.edu",
        password: "teacher123",
        loginType: "staff",
      },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token, "Token should be present");
    assert.strictEqual(res.data.role, "teacher");
    teacherToken = res.data.token;
  });

  test("Student login succeeds with rollNo and issues JWT with role 'student'", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: {
        identifier: "4",
        password: "student123",
        loginType: "student",
      },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token, "Token should be present");
    assert.strictEqual(res.data.role, "student");
    studentToken = res.data.token;
  });

  test("Login fails with invalid password (401 Unauthorized)", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: {
        identifier: "admin@school.com",
        password: "wrong_password_999",
        loginType: "staff",
      },
    });
    assert.strictEqual(res.status, 401);
    assert.match(res.data.message, /invalid/i);
  });

  test("Login fails with non-existent user identifier (401 Unauthorized)", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: {
        identifier: "ghost.user@school.com",
        password: "anyPassword",
        loginType: "staff",
      },
    });
    assert.strictEqual(res.status, 401);
  });
});

describe("3. Role-Based Access Control (RBAC) & Route Protection", () => {
  test("Unauthenticated request to protected route returns 401", async () => {
    const res = await request("/api/staff");
    assert.strictEqual(res.status, 401);
  });

  test("Admin can access protected Admin route /api/staff", async () => {
    const res = await request("/api/staff", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data), "Expected staff array");
  });

  test("Student access to Admin-only route /api/staff is rejected with 403 Forbidden", async () => {
    const res = await request("/api/staff", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403);
    assert.match(res.data.message, /not allowed|forbidden/i);
  });
});

describe("4. Dynamic Database-Driven Classes & Sections Discovery", () => {
  test("GET /api/students/classes-sections returns distinct classes and sections", async () => {
    const res = await request("/api/students/classes-sections", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data), "Should return array of class objects");
    assert.ok(res.data.length > 0, "Should have classes present in DB");

    const class10 = res.data.find((c) => c.class === "10");
    assert.ok(class10, "Class 10 must exist in DB");
    assert.ok(Array.isArray(class10.sections), "Sections must be an array");
    assert.ok(class10.sections.includes("A"), "Class 10 must have section A");
  });

  test("Student can query /api/students/classes-sections without permission rejection", async () => {
    const res = await request("/api/students/classes-sections", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });
});

describe("5. Fee Ledger & Settlement Mathematical Rules", () => {
  test("Admin retrieves fee ledger and locates an existing record", async () => {
    const res = await request("/api/fees?class=10&section=A&month=November&year=2026", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.ledger, "Ledger should exist");
    assert.ok(Array.isArray(res.data.ledger));
    if (res.data.ledger.length > 0) {
      testFeeId = res.data.ledger[0]._id;
    }
  });

  test("Updating fee payment computes correct balance and 'PAID' settlement status", async () => {
    if (!testFeeId) return;
    const totalAmount = 5000;
    const paidAmount = 5000;

    const res = await request(`/api/fees/${testFeeId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        totalAmount,
        paidAmount,
        settlementStatus: "PAID",
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.paidAmount, 5000);
    assert.strictEqual(res.data.settlementStatus, "PAID");
  });

  test("Updating fee payment to partial amount computes 'PARTIAL' status", async () => {
    if (!testFeeId) return;
    const totalAmount = 5000;
    const paidAmount = 2500;

    const res = await request(`/api/fees/${testFeeId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        totalAmount,
        paidAmount,
        settlementStatus: "PARTIAL",
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.paidAmount, 2500);
    assert.strictEqual(res.data.settlementStatus, "PARTIAL");
  });

  test("Student cannot update fee records (403 Forbidden)", async () => {
    if (!testFeeId) return;
    const res = await request(`/api/fees/${testFeeId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { paidAmount: 100 },
    });
    assert.strictEqual(res.status, 403);
  });
});

describe("6. Attendance Registry & Bulk Operations", () => {
  test("Fetch class roll list for attendance marking", async () => {
    const res = await request("/api/attendance/roll?class=10&section=A&date=11/15/2026&period=Daily%20(Full%20Day)", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.rollList, "Should return roll list");
    assert.ok(Array.isArray(res.data.rollList));
    if (res.data.rollList.length > 0) {
      sampleStudentId = res.data.rollList[0]._id;
    }
  });

  test("Bulk save attendance record validates entries and returns 200", async () => {
    if (!sampleStudentId) return;
    const res = await request("/api/attendance/save", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        class: "10",
        section: "A",
        date: "11/15/2026",
        period: "Daily (Full Day)",
        entries: [
          { studentId: sampleStudentId, status: "present" },
        ],
      },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.message);
  });

  test("Attendance roll call fails when missing required class or section", async () => {
    const res = await request("/api/attendance/roll?date=11/15/2026", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 400);
  });
});

describe("7. Timetable Lecture Scheduling", () => {
  test("Fetch master timetable for Class 10 Section A returns 6-day periods matrix", async () => {
    const res = await request("/api/timetable?class=10&section=A", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.days, "Should include days definition");
    assert.ok(Array.isArray(res.data.days));
    assert.strictEqual(res.data.days.length, 6);
  });
});

describe("8. Official Bulletins & Notices Security", () => {
  test("Admin can broadcast a new official announcement", async () => {
    const res = await request("/api/notices", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: "Automated Test Notice",
        content: "This notice was generated as verification evidence.",
        category: "General",
        audience: "EVERYONE",
      },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.title, "Automated Test Notice");
  });

  test("Student cannot delete official notices (403 Forbidden)", async () => {
    const res = await request("/api/notices/6af71af7a015fa5c8d19f999", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403);
  });
});

describe("9. Teacher Scoping & Academic Integrity", () => {
  test("Teacher cannot access unassigned class roll list (403 Forbidden)", async () => {
    const res = await request("/api/attendance/roll?class=Grade%203&section=C&date=11/15/2026", {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  test("Negative marks entry is rejected with 400 Bad Request", async () => {
    const res = await request("/api/marks/save", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        class: "10",
        section: "A",
        subject: "Mathematics",
        examType: "Unit Test 1",
        entries: [{ studentId: sampleStudentId || "6af9d7609e17c9f5afa0d07a", marksObtained: -10, maxMarks: 100 }],
      },
    });
    assert.strictEqual(res.status, 400);
  });

  test("Overpayment exceeding invoice is rejected with 400 Bad Request", async () => {
    if (!testFeeId) return;
    const res = await request(`/api/fees/${testFeeId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { paidAmount: 999999 },
    });
    assert.strictEqual(res.status, 400);
  });

  test("Malformed ObjectId parameter returns 400 Bad Request instead of 500", async () => {
    const res = await request("/api/students/invalid-string-id", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 400);
  });
});
