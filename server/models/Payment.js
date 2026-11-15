const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    fee: { type: mongoose.Schema.Types.ObjectId, ref: "Fee", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Bank Transfer", "Online", "Cheque"],
      default: "Cash",
    },
    transactionId: { type: String, required: true, unique: true },
    receiptNumber: { type: String, required: true, unique: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    remarks: { type: String, default: "" },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, paidAt: -1 });
paymentSchema.index({ fee: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
