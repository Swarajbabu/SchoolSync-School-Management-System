const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // "1", "2", ... "10", "12"
    sections: [{ type: String, trim: true }], // ["A", "B", "C"]
    capacityPerSection: { type: Number, default: 40 },
    academicWing: {
      type: String,
      enum: ["Primary", "Middle", "Secondary", "Senior Secondary"],
      default: "Secondary",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
