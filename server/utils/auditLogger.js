const AuditLog = require("../models/AuditLog");

const logAction = async ({ action, performedBy, targetEntity, targetId, details, req }) => {
  try {
    const ipAddress = req
      ? req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1"
      : "127.0.0.1";

    await AuditLog.create({
      action,
      performedBy,
      targetEntity,
      targetId: targetId ? targetId.toString() : "",
      details: details || {},
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    });
  } catch (err) {
    // Non-blocking logger failure should not break main request
    console.error("Audit log error:", err.message);
  }
};

module.exports = { logAction };
