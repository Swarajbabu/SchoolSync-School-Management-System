const mongoose = require("mongoose");

const gradingPolicySchema = new mongoose.Schema(
  {
    grade: { type: String, required: true, trim: true }, // "A+", "A", "B", etc.
    minPercentage: { type: Number, required: true, min: 0, max: 100 },
    maxPercentage: { type: Number, required: true, min: 0, max: 100 },
    gradePoint: { type: Number, default: 0 },
    isPass: { type: Boolean, default: true },
    remarks: { type: String, default: "" },
  },
  { timestamps: true }
);

gradingPolicySchema.index({ minPercentage: 1, maxPercentage: 1 });

module.exports = mongoose.model("GradingPolicy", gradingPolicySchema);
