const User = require("../models/User");
const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
const { logAction } = require("../utils/auditLogger");

// @desc Get fee ledger for a class/section/month/year (Read-only, does not pollute DB on GET)
// @route GET /api/fees?class=&section=&month=&year=
const getFeeLedger = async (req, res) => {
  try {
    const { class: cls, section, month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year query parameters are required" });
    }

    const filter = { role: "student" };
    if (cls && cls !== "All Classes") filter.class = cls;
    if (section && section !== "All Sections") filter.section = section;

    const students = await User.find(filter).select("name rollNo class section");
    const studentIds = students.map((s) => s._id);

    // Read existing fee records for this period (NO WRITES ON GET)
    const existingRecords = await Fee.find({
      student: { $in: studentIds },
      month,
      year: String(year),
    });

    const feeMap = new Map();
    existingRecords.forEach((rec) => {
      feeMap.set(rec.student.toString(), rec);
    });

    const ledger = students.map((s) => {
      const record = feeMap.get(s._id.toString());
      if (record) {
        return {
          _id: record._id,
          studentId: s._id,
          name: s.name,
          rollNo: s.rollNo,
          totalAmount: record.totalAmount,
          paidAmount: record.paidAmount,
          balanceDue: Math.max(0, record.totalAmount - record.paidAmount),
          settlementStatus: record.settlementStatus,
        };
      }
      return {
        _id: null,
        studentId: s._id,
        name: s.name,
        rollNo: s.rollNo,
        totalAmount: 1500, // Standard institutional tuition default
        paidAmount: 0,
        balanceDue: 1500,
        settlementStatus: "PENDING",
      };
    });

    const actualRevenue = ledger.reduce((sum, l) => sum + l.paidAmount, 0);
    res.json({ actualRevenue, ledger });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get fee history and dues for the logged-in student
// @route GET /api/fees/my-fees
const getMyFees = async (req, res) => {
  try {
    const studentId = req.user._id;
    const records = await Fee.find({ student: studentId }).sort({ createdAt: -1 });
    const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalDue = Math.max(0, totalAmount - totalPaid);

    let status = "PENDING";
    if (records.length === 0) {
      status = "NO_INVOICES";
    } else if (totalDue === 0 && totalAmount > 0) {
      status = "PAID";
    } else if (totalPaid > 0) {
      status = "PARTIAL";
    }

    res.json({
      records,
      totalPaid,
      totalAmount,
      totalDue,
      status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update or create a fee record with strict financial validation and discrete payment transaction logging
// @route PUT /api/fees/:id
const updateFeeRecord = async (req, res) => {
  try {
    const { studentId, month, year, totalAmount, paidAmount, paymentMethod, remarks } = req.body;

    let existingDoc = null;
    if (req.params.id && req.params.id !== "null" && req.params.id !== "undefined") {
      try {
        existingDoc = await Fee.findById(req.params.id);
      } catch (err) {}
    }

    const effectiveTotal = totalAmount !== undefined ? totalAmount : existingDoc ? existingDoc.totalAmount : undefined;
    const numTotal = Number(effectiveTotal);
    const numPaid = Number(paidAmount);

    if (isNaN(numTotal) || numTotal < 0) {
      return res.status(400).json({ message: "Total invoice amount cannot be negative or invalid" });
    }

    if (isNaN(numPaid) || numPaid < 0) {
      return res.status(400).json({ message: "Paid amount cannot be negative" });
    }

    // Strict Overpayment Guard
    if (numPaid > numTotal) {
      return res.status(400).json({
        message: `Payment amount (${numPaid}) exceeds total invoice dues (${numTotal}). Overpayment rejected.`,
      });
    }

    const settlementStatus =
      numPaid >= numTotal && numTotal > 0 ? "PAID" : numPaid > 0 ? "PARTIAL" : "PENDING";

    let record;
    let studentRef = studentId;

    if (req.params.id && req.params.id !== "null" && req.params.id !== "undefined") {
      record = await Fee.findByIdAndUpdate(
        req.params.id,
        {
          totalAmount: numTotal,
          paidAmount: numPaid,
          settlementStatus,
        },
        { new: true, runValidators: true }
      );
      if (record) studentRef = record.student;
    } else if (studentId && month && year) {
      const student = await User.findById(studentId);
      record = await Fee.findOneAndUpdate(
        { student: studentId, month, year: String(year) },
        {
          student: studentId,
          class: student?.class || "10",
          section: student?.section || "A",
          month,
          year: String(year),
          totalAmount: numTotal,
          paidAmount: numPaid,
          settlementStatus,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
    }

    if (!record) return res.status(404).json({ message: "Fee record not found" });

    // Discrete Payment Transaction Logging
    if (numPaid > 0) {
      const timestamp = Date.now();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const receiptNumber = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${randomSuffix}`;
      const transactionId = `TXN-${timestamp}-${randomSuffix}`;

      await Payment.create({
        fee: record._id,
        student: studentRef,
        amount: numPaid,
        paymentMethod: paymentMethod || "Cash",
        transactionId,
        receiptNumber,
        receivedBy: req.user._id,
        remarks: remarks || "Tuition fee settlement",
        paidAt: new Date(),
      });

      // Material Audit Trail
      await logAction({
        action: "FEE_PAYMENT_COLLECTED",
        performedBy: req.user._id,
        targetEntity: "Fee",
        targetId: record._id,
        details: { student: studentRef, amount: numPaid, receiptNumber, settlementStatus },
        req,
      });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get complete fee history for one student
// @route GET /api/fees/student/:id
const getStudentFeeHistory = async (req, res) => {
  try {
    const targetStudentId = req.params.id;

    // Scoping for student
    if (req.user?.role === "student" && req.user._id.toString() !== targetStudentId) {
      return res.status(403).json({ message: "Access denied. You can only view your own fee history." });
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

    const records = await Fee.find({ student: targetStudentId }).sort({ createdAt: -1 });
    const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalDue = Math.max(0, totalAmount - totalPaid);
    res.json({ records, totalPaid, totalAmount, totalDue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get discrete payment ledger / transaction history
// @route GET /api/fees/payments/history
const getPaymentHistory = async (req, res) => {
  try {
    const filter = {};

    if (req.user?.role === "student") {
      filter.student = req.user._id;
    } else if (req.user?.role === "guardian") {
      filter.student = { $in: req.user.linkedStudents || [] };
    } else if (req.query.studentId) {
      filter.student = req.query.studentId;
    }

    const payments = await Payment.find(filter)
      .populate("student", "name rollNo class section")
      .populate("receivedBy", "name")
      .sort({ paidAt: -1 })
      .limit(100);

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFeeLedger,
  getMyFees,
  updateFeeRecord,
  getStudentFeeHistory,
  getPaymentHistory,
};
