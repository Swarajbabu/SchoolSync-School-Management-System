import { useState, useEffect } from "react";
import { FiDownload, FiCheckCircle } from "react-icons/fi";
import api from "../api/axios";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import useClassesAndSections from "../context/useClassesAndSections";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ClassFees = () => {
  const { user } = useAuth();
  const { classes, getSectionsForClass } = useClassesAndSections();
  const now = new Date();
  const [filters, setFilters] = useState({
    class: "",
    section: "",
    month: MONTHS[now.getMonth()],
    year: now.getFullYear(),
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Set default class & section when classes are loaded from DB
  useEffect(() => {
    if (classes.length > 0 && !filters.class) {
      const defaultClass = classes[0];
      const sections = getSectionsForClass(defaultClass);
      setFilters((prev) => ({
        ...prev,
        class: defaultClass,
        section: sections[0] || "",
      }));
    }
  }, [classes]);

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleClassChange = (e) => {
    const selectedClass = e.target.value;
    const availableSections = getSectionsForClass(selectedClass);
    setFilters({
      ...filters,
      class: selectedClass,
      section: availableSections[0] || "",
    });
  };

  const load = async () => {
    if (!filters.class) {
      setToast({ type: "error", message: "Please select a target class" });
      return;
    }
    setLoading(true);
    try {
      const { data: resp } = await api.get("/fees", { params: filters });
      setData(resp);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load fee ledger" });
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (row) => {
    try {
      await api.put(`/fees/${row._id}`, {
        totalAmount: row.totalAmount || 0,
        paidAmount: row.totalAmount || 0,
        settlementStatus: "PAID",
      });
      setToast({ type: "success", message: "Payment updated!" });
      load();
    } catch (err) {
      setToast({ type: "error", message: "Update failed" });
    }
  };

  const pending = data ? data.ledger.filter((l) => l.settlementStatus !== "PAID").length : 0;
  const cleared = data ? data.ledger.length - pending : 0;

  const handleDownloadDefaulters = () => {
    if (!data) return;

    const defaulters = data.ledger.filter((l) => l.settlementStatus !== "PAID");
    if (defaulters.length === 0) {
      setToast({
        type: "error",
        message: "No defaulters found for this filter — nothing to download.",
      });
      return;
    }

    const header = ["Roll No", "Student Name", "Payable", "Paid", "Balance Due", "Status"];
    const rows = defaulters.map((d) => [
      d.rollNo || "N/A",
      d.name,
      d.totalAmount,
      d.paidAmount,
      d.balanceDue,
      d.settlementStatus,
    ]);

    const escapeCell = (cell) => `"${String(cell).replace(/"/g, '""')}"`;
    const csvContent = [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Defaulters_${filters.class || "All"}-${filters.section || "All"}_${
      filters.month
    }_${filters.year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({
      type: "success",
      message: `Downloaded ${defaulters.length} defaulter record(s).`,
    });
  };

  const currentSections = getSectionsForClass(filters.class);

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <h1 className="page-title">Class Fees</h1>
      <p className="welcome-sub">Student tuition ledger and collection records</p>

      <div className="card">
        <div className="toolbar">
          <div className="field">
            <label>Target Class</label>
            <select name="class" value={filters.class} onChange={handleClassChange}>
              <option value="">Select Class...</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Section</label>
            <select
              name="section"
              value={filters.section}
              onChange={handleChange}
              disabled={!filters.class}
            >
              <option value="">Select Section...</option>
              {currentSections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Billing Month</label>
            <select name="month" value={filters.month} onChange={handleChange}>
              {MONTHS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Academic Year</label>
            <select name="year" value={filters.year} onChange={handleChange}>
              {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Load Ledger"}
          </button>
        </div>
      </div>

      {!data ? (
        <div className="card empty-state">
          <h3>Select Class and Section above to view the fee ledger.</h3>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="toolbar" style={{ justifyContent: "space-between" }}>
              <div className="stat-inline">
                <span className="label">Total expected</span>
                <span className="value">₹{data.expectedRevenue?.toLocaleString() ?? 0}</span>
              </div>
              <div className="stat-inline">
                <span className="label">Actual collected</span>
                <span className="value">₹{data.actualRevenue?.toLocaleString() ?? 0}</span>
              </div>
              <div className="stat-inline">
                <span className="label">Cleared</span>
                <span className="value">{cleared} students</span>
              </div>
              <div className="stat-inline">
                <span className="label">Pending</span>
                <span className="value">{pending} students</span>
              </div>
              <button className="btn btn-outline" onClick={handleDownloadDefaulters}>
                <FiDownload /> Defaulter report
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student Identity</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Settlement Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                      No students found in this class/section.
                    </td>
                  </tr>
                ) : (
                  data.ledger.map((row) => (
                    <tr key={row._id}>
                      <td>
                        <div className="cell-name">{row.name}</div>
                        <div className="cell-sub">ID: {row.rollNo || "N/A"}</div>
                      </td>
                      <td>₹{row.totalAmount}</td>
                      <td>₹{row.paidAmount}</td>
                      <td>₹{row.balanceDue}</td>
                      <td>
                        <span
                          className={`badge ${
                            row.settlementStatus === "PAID"
                              ? "badge-green"
                              : row.settlementStatus === "PARTIAL"
                              ? "badge-yellow"
                              : "badge-red"
                          }`}
                        >
                          {row.settlementStatus}
                        </span>
                      </td>
                      <td>
                        {row.settlementStatus !== "PAID" && (
                          <button className="btn btn-outline" onClick={() => markPaid(row)}>
                            <FiCheckCircle /> Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ClassFees;
