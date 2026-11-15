const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["Theory", "Practical", "Elective"], default: "Theory" },
    department: { type: String, default: "General Academics" },
    applicableClasses: [{ type: String }], // ["10", "12"]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
