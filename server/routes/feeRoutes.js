const express = require("express");
const router = express.Router();
const {
  getFeeLedger,
  getMyFees,
  updateFeeRecord,
  getStudentFeeHistory,
  getPaymentHistory,
} = require("../controllers/feeController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.get("/my-fees", getMyFees);
router.get("/payments/history", getPaymentHistory);
router.get("/student/:id", authorize("admin", "teacher"), getStudentFeeHistory);
router.get("/", authorize("admin"), getFeeLedger);
router.put("/:id", authorize("admin"), updateFeeRecord);

module.exports = router;
