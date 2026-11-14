const User = require("../models/User");
const Fee = require("../models/Fee");

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

// @desc Update or create a fee record (Atomic payment update with server-side status calculation)
// @route PUT /api/fees/:id
const updateFeeRecord = async (req, res) => {
  try {
    const { studentId, month, year, totalAmount, paidAmount } = req.body;

    const numTotal = Math.max(0, Number(totalAmount) || 0);
    const numPaid = Math.max(0, Math.min(numTotal, Number(paidAmount) || 0));
    const settlementStatus =
      numPaid >= numTotal && numTotal > 0 ? "PAID" : numPaid > 0 ? "PARTIAL" : "PENDING";

    let record;
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
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get complete fee history for one student (all months/years)
// @route GET /api/fees/student/:id
const getStudentFeeHistory = async (req, res) => {
  try {
    if (req.user?.role === "student" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Access denied. You can only view your own fee history." });
    }
    const records = await Fee.find({ student: req.params.id }).sort({
      createdAt: -1,
    });
    const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalDue = Math.max(0, totalAmount - totalPaid);
    res.json({ records, totalPaid, totalAmount, totalDue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFeeLedger,
  getMyFees,
  updateFeeRecord,
  getStudentFeeHistory,
};
