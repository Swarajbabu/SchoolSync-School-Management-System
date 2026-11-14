const User = require("../models/User");
const Fee = require("../models/Fee");

// @desc Get fee ledger for a class/section/month/year (creates default rows if missing)
// @route GET /api/fees?class=&section=&month=&year=
const getFeeLedger = async (req, res) => {
  try {
    const { class: cls, section, month, year } = req.query;

    const filter = { role: "student" };
    if (cls && cls !== "All Classes") filter.class = cls;
    if (section && section !== "All Sections") filter.section = section;

    const students = await User.find(filter).select("name rollNo class section");

    const ledger = await Promise.all(
      students.map(async (s) => {
        const record = await Fee.findOneAndUpdate(
          { student: s._id, month, year },
          {
            $setOnInsert: {
              student: s._id,
              class: s.class,
              section: s.section,
              month,
              year,
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return {
          _id: record._id,
          studentId: s._id,
          name: s.name,
          rollNo: s.rollNo,
          totalAmount: record.totalAmount,
          paidAmount: record.paidAmount,
          balanceDue: record.totalAmount - record.paidAmount,
          settlementStatus: record.settlementStatus,
        };
      })
    );

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
    const totalDue = totalAmount - totalPaid;
    res.json({
      records,
      totalPaid,
      totalAmount,
      totalDue,
      status: totalDue === 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "PENDING",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update a fee record (payment update)
// @route PUT /api/fees/:id
const updateFeeRecord = async (req, res) => {
  try {
    const { totalAmount, paidAmount, settlementStatus } = req.body;
    const record = await Fee.findByIdAndUpdate(
      req.params.id,
      { totalAmount, paidAmount, settlementStatus },
      { new: true, runValidators: true }
    );
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
    const totalDue = records.reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0);
    res.json({ records, totalPaid, totalDue });
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
