const GradingPolicy = require("../models/GradingPolicy");

// Standard institutional CBSE default scale
const DEFAULT_POLICIES = [
  { grade: "A+", minPercentage: 90, maxPercentage: 100, gradePoint: 10, isPass: true, remarks: "Outstanding" },
  { grade: "A", minPercentage: 80, maxPercentage: 89.99, gradePoint: 9, isPass: true, remarks: "Excellent" },
  { grade: "B", minPercentage: 70, maxPercentage: 79.99, gradePoint: 8, isPass: true, remarks: "Very Good" },
  { grade: "C", minPercentage: 60, maxPercentage: 69.99, gradePoint: 7, isPass: true, remarks: "Good" },
  { grade: "D", minPercentage: 50, maxPercentage: 59.99, gradePoint: 6, isPass: true, remarks: "Satisfactory" },
  { grade: "E", minPercentage: 33, maxPercentage: 49.99, gradePoint: 4, isPass: true, remarks: "Marginal Pass" },
  { grade: "F", minPercentage: 0, maxPercentage: 32.99, gradePoint: 0, isPass: false, remarks: "Needs Improvement (Fail)" },
];

// @desc Get active grading policy rules
// @route GET /api/grading-rules
const getGradingRules = async (req, res) => {
  try {
    let rules = await GradingPolicy.find().sort({ minPercentage: -1 });
    if (!rules || rules.length === 0) {
      await GradingPolicy.insertMany(DEFAULT_POLICIES);
      rules = await GradingPolicy.find().sort({ minPercentage: -1 });
    }
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create or update a grading policy rule (Admin only)
// @route POST /api/grading-rules
const createOrUpdateRule = async (req, res) => {
  try {
    const { grade, minPercentage, maxPercentage, gradePoint, isPass, remarks } = req.body;
    if (!grade || minPercentage === undefined || maxPercentage === undefined) {
      return res.status(400).json({ message: "grade, minPercentage, and maxPercentage are required" });
    }

    const rule = await GradingPolicy.findOneAndUpdate(
      { grade: grade.toUpperCase().trim() },
      {
        grade: grade.toUpperCase().trim(),
        minPercentage: Number(minPercentage),
        maxPercentage: Number(maxPercentage),
        gradePoint: Number(gradePoint) || 0,
        isPass: Boolean(isPass),
        remarks: remarks || "",
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGradingRules, createOrUpdateRule };
