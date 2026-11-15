const express = require("express");
const router = express.Router();
const { getGradingRules, createOrUpdateRule } = require("../controllers/gradingPolicyController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, getGradingRules);
router.post("/", protect, authorize("admin"), createOrUpdateRule);

module.exports = router;
