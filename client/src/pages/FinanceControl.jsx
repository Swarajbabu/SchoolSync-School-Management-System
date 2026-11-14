import { useEffect, useState } from "react";
import { FiSearch, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import api from "../api/axios";
import Toast from "../components/Toast";
import useClassesAndSections from "../context/useClassesAndSections";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const FinanceControl = () => {
  const { classes, getSectionsForClass } = useClassesAndSections();
  const [tab, setTab] = useState("fees"); // fees | salary
  const now = new Date();
  const [filters, setFilters] = useState({
    month: MONTHS[now.getMonth()],
    year: now.getFullYear(),
    class: "All Classes",
    section: "All Sections",
  });
  const [feeData, setFeeData] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  // Edit payment modal state
  const [editPayment, setEditPayment] = useState(null);
  const [paidInput, setPaidInput] = useState("");

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const loadFees = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/fees", { params: filters });
      setFeeData(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load fee ledger" });
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/staff");
      setStaffList(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load staff salary ledger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "fees") loadFees();
    else loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const totalRevenue = feeData ? feeData.actualRevenue : 0;
  const totalExpenses = staffList.reduce((s, t) => s + (t.monthlySalary || 0), 0);

  const openEditModal = (row) => {
    setEditPayment(row);
    setPaidInput(String(row.paidAmount || 0));
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!editPayment) return;
    const numericPaid = Number(paidInput);
    if (isNaN(numericPaid) || numericPaid < 0) {
      setToast({ type: "error", message: "Please enter a valid payment amount" });
      return;
    }

    try {
      await api.put(`/fees/${editPayment._id}`, {
        totalAmount: editPayment.totalAmount,
        paidAmount: numericPaid,
        settlementStatus: numericPaid >= editPayment.totalAmount ? "PAID" : numericPaid > 0 ? "PARTIAL" : "UNPAID",
      });
      setToast({ type: "success", message: `Updated payment for ${editPayment.name}` });
      setEditPayment(null);
      loadFees();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Payment update failed" });
    }
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <h1 className="page-title">Finance Control</h1>
      <p className="welcome-sub">Academic revenue and institutional payroll ledger</p>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="stat-card">
          <div className="stat-label">Fee collections</div>
          <div className="stat-value">₹{totalRevenue.toLocaleString()}</div>
          <div className="stat-meta">Total collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Payroll commitments</div>
          <div className="stat-value">₹{totalExpenses.toLocaleString()}</div>
          <div className="stat-meta">Monthly staff salaries</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 16, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          <button
            onClick={() => setTab("fees")}
            style={{
              background: "none",
              border: "none",
              padding: "8px 4px",
              fontWeight: 500,
              fontSize: 13.5,
              color: tab === "fees" ? "var(--primary)" : "var(--text-muted)",
              borderBottom: tab === "fees" ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            Student fee ledger
          </button>
          <button
            onClick={() => setTab("salary")}
            style={{
              background: "none",
              border: "none",
              padding: "8px 4px",
              fontWeight: 500,
              fontSize: 13.5,
              color: tab === "salary" ? "var(--primary)" : "var(--text-muted)",
              borderBottom: tab === "salary" ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            Staff salary ledger
          </button>
        </div>

        {tab === "fees" ? (
          <div className="toolbar">
            <div className="field">
              <label>Month</label>
              <select name="month" value={filters.month} onChange={handleChange}>
                {MONTHS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Year</label>
              <select name="year" value={filters.year} onChange={handleChange}>
                {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Class</label>
              <select
                name="class"
                value={filters.class}
                onChange={(e) => {
                  const val = e.target.value;
                  const secs = val === "All Classes" ? [] : getSectionsForClass(val);
                  setFilters({
                    ...filters,
                    class: val,
                    section: "All Sections",
                  });
                }}
              >
                <option value="All Classes">All Classes</option>
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
                disabled={filters.class === "All Classes"}
              >
                <option value="All Sections">All Sections</option>
                {filters.class !== "All Classes" &&
                  getSectionsForClass(filters.class).map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={loadFees}>
              <FiSearch /> Filter records
            </button>
          </div>
        ) : (
          <div className="field" style={{ maxWidth: 280 }}>
            <div className="login-input">
              <FiSearch />
              <input
                placeholder="Search staff ledger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-text">Loading ledger records...</div>
      ) : tab === "fees" ? (
        !feeData || feeData.ledger.length === 0 ? (
          <div className="card empty-state">
            <h3>No fee records found for this filter.</h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Total due</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeData.ledger.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <div className="cell-name">{row.name}</div>
                      <div className="cell-sub">Roll No: {row.rollNo || "—"}</div>
                    </td>
                    <td>₹{Number(row.totalAmount || 0).toLocaleString()}</td>
                    <td>₹{Number(row.paidAmount || 0).toLocaleString()}</td>
                    <td>₹{Number(row.balanceDue || 0).toLocaleString()}</td>
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
                      <button className="btn btn-outline" onClick={() => openEditModal(row)}>
                        <FiEdit2 /> Edit payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : staffList.length === 0 ? (
        <div className="card empty-state">
          <h3>No staff salary records found.</h3>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Monthly salary</th>
                <th>Contract status</th>
              </tr>
            </thead>
            <tbody>
              {staffList
                .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
                .map((s) => (
                  <tr key={s._id}>
                    <td className="cell-name">{s.name}</td>
                    <td>{s.teacherId || "—"}</td>
                    <td>{s.department || "General"}</td>
                    <td>₹{Number(s.monthlySalary || 0).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-green">{s.contractStatus || "Active"}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT PAYMENT MODAL */}
      {editPayment && (
        <div className="modal-backdrop" onClick={() => setEditPayment(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiEdit2 aria-hidden="true" /> Update fee payment
              </span>
              <button
                type="button"
                className="btn-icon"
                style={{ marginLeft: "auto" }}
                onClick={() => setEditPayment(null)}
                aria-label="Close dialog"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSavePayment}>
              <div className="modal-fields">
                <div className="field">
                  <label>Student</label>
                  <input value={`${editPayment.name} (${editPayment.rollNo || "No Roll"})`} disabled />
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Total dues</label>
                    <input value={`₹${editPayment.totalAmount}`} disabled />
                  </div>
                  <div className="field">
                    <label>Paid amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={editPayment.totalAmount}
                      required
                      value={paidInput}
                      onChange={(e) => setPaidInput(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Computed balance</label>
                  <input
                    value={`₹${Math.max(0, editPayment.totalAmount - (Number(paidInput) || 0))}`}
                    disabled
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditPayment(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceControl;
