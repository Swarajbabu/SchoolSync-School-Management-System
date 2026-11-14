import { useState, useEffect } from "react";
import { FiDollarSign, FiCheckCircle, FiAlertCircle, FiClock, FiPrinter, FiDownload } from "react-icons/fi";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

const MyFees = () => {
  const { user } = useAuth();
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchMyFees = async () => {
    try {
      const { data } = await api.get("/fees/my-fees");
      setFeeData(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to retrieve student billing history" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFees();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="loading-text">Loading student fee records...</div>;
  }

  const records = feeData?.records || [];
  const totalPaid = feeData?.totalPaid || 0;
  const totalDue = feeData?.totalDue || 0;
  const totalAmount = feeData?.totalAmount || 0;
  const status = feeData?.status || "PENDING";

  return (
    <div className="fee-management-root">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* HEADER STRIP */}
      <div className="command-header">
        <div className="command-title-block">
          <div className="breadcrumb-line">
            <span className="crumb-root">Student Accounts</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">My Fee Ledger &amp; Invoices</span>
          </div>
          <h1 className="page-title">Personal Fee Ledger</h1>
          <p className="command-meta">
            Academic Session 2025–2026 • Verified institutional billing and payment settlement receipts.
          </p>
        </div>

        <div className="command-quick-actions">
          <button className="btn btn-outline" onClick={handlePrint}>
            <FiPrinter aria-hidden="true" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* METRICS PULSE */}
      <div className="metrics-strip">
        <div className="metric-tile">
          <div className="metric-header">
            <span className="metric-tag">Total Invoiced</span>
            <div className="metric-icon-wrap" style={{ background: "#eff6ff", color: "var(--primary)" }}>
              <FiDollarSign aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">${totalAmount.toLocaleString()}</div>
          <div className="metric-footer">
            <span>Cumulative institutional fees for active term</span>
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-header">
            <span className="metric-tag">Amount Paid</span>
            <div className="metric-icon-wrap" style={{ background: "#f0fdf4", color: "var(--green)" }}>
              <FiCheckCircle aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">${totalPaid.toLocaleString()}</div>
          <div className="metric-footer">
            <span className="status-dot green" aria-hidden="true" />
            <span>Verified accounts department deposits</span>
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-header">
            <span className="metric-tag">Balance Due</span>
            <div
              className="metric-icon-wrap"
              style={{
                background: totalDue > 0 ? "#fef2f2" : "#f0fdf4",
                color: totalDue > 0 ? "var(--red)" : "var(--green)",
              }}
            >
              {totalDue > 0 ? <FiAlertCircle aria-hidden="true" /> : <FiCheckCircle aria-hidden="true" />}
            </div>
          </div>
          <div className="metric-value" style={{ color: totalDue > 0 ? "var(--red)" : "var(--green)" }}>
            ${totalDue.toLocaleString()}
          </div>
          <div className="metric-footer">
            <span className={`status-dot ${totalDue > 0 ? "red" : "green"}`} aria-hidden="true" />
            <span>{totalDue > 0 ? "Outstanding balance required" : "Zero arrears outstanding"}</span>
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-header">
            <span className="metric-tag">Settlement Status</span>
            <div className="metric-icon-wrap" style={{ background: "#f8fafc", color: "var(--text-secondary)" }}>
              <FiClock aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value" style={{ fontSize: "1.4rem" }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 12px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 700,
                background: status === "PAID" ? "#f0fdf4" : status === "PARTIAL" ? "#fffbeb" : "#fef2f2",
                color: status === "PAID" ? "#166534" : status === "PARTIAL" ? "#b45309" : "#991b1b",
                border: `1px solid ${status === "PAID" ? "#bbf7d0" : status === "PARTIAL" ? "#fde68a" : "#fecaca"}`,
              }}
            >
              {status}
            </span>
          </div>
          <div className="metric-footer">
            <span>Enrolled: Class {user?.class || "10"} • Sec {user?.section || "A"} • Roll #{user?.rollNo || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* DETAILED FEE INVOICES TABLE */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <div className="card-title-group">
            <FiDollarSign className="card-icon" aria-hidden="true" />
            <div>
              <h2 className="card-heading">Monthly Fee Invoices &amp; Settlement History</h2>
              <span className="card-subhead">Itemized invoice ledger generated from the Central Bursar Office</span>
            </div>
          </div>
        </div>

        <div className="card-content" style={{ padding: 0 }}>
          {records.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
              No fee statements on file for your account.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Billing Period</th>
                    <th>Class / Section</th>
                    <th>Invoice Total</th>
                    <th>Amount Paid</th>
                    <th>Balance Due</th>
                    <th>Settlement Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const balance = r.totalAmount - r.paidAmount;
                    const isPaid = balance === 0;
                    return (
                      <tr key={r._id}>
                        <td>
                          <strong>{r.month} {r.year}</strong>
                        </td>
                        <td>Class {r.class} - {r.section}</td>
                        <td>${r.totalAmount.toLocaleString()}</td>
                        <td style={{ color: "var(--green)", fontWeight: 600 }}>
                          ${r.paidAmount.toLocaleString()}
                        </td>
                        <td style={{ color: balance > 0 ? "var(--red)" : "var(--text-secondary)", fontWeight: 600 }}>
                          ${balance.toLocaleString()}
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: isPaid ? "#f0fdf4" : r.paidAmount > 0 ? "#fffbeb" : "#fef2f2",
                              color: isPaid ? "#166534" : r.paidAmount > 0 ? "#b45309" : "#991b1b",
                              border: `1px solid ${isPaid ? "#bbf7d0" : r.paidAmount > 0 ? "#fde68a" : "#fecaca"}`,
                            }}
                          >
                            {r.settlementStatus || (isPaid ? "PAID" : "PENDING")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyFees;
