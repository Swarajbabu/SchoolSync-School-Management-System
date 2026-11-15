const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "ATTENDANCE_RECORDED",
        "MARKS_UPDATED",
        "FEE_PAYMENT_COLLECTED",
        "STUDENT_CREATED",
        "STUDENT_UPDATED",
        "STUDENT_DELETED",
        "STAFF_CREATED",
        "STAFF_UPDATED",
        "TIMETABLE_ASSIGNED",
        "EXAM_SCHEDULED",
        "NOTICE_PUBLISHED",
      ],
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetEntity: { type: String, required: true }, // "Attendance", "SessionalMark", "Fee", "User"
    targetId: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "127.0.0.1" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
