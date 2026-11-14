import { useState, useEffect } from "react";
import { FiPrinter, FiDownload, FiCheckCircle, FiXCircle, FiCalendar, FiClock } from "react-icons/fi";
import api from "../api/axios";
import Toast from "../components/Toast";
import useClassesAndSections from "../context/useClassesAndSections";
import { useAuth } from "../context/AuthContext";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AttendanceLog = () => {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const { classes, getSectionsForClass } = useClassesAndSections();
  const now = new Date();
  const [filters, setFilters] = useState({
    class: isStudent ? user?.class || "10" : "",
    section: isStudent ? user?.section || "A" : "",
    month: MONTHS[now.getMonth()],
    year: now.getFullYear(),
  });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isStudent && user?.class && user.class !== "Unassigned") {
      setFilters((prev) => ({
        ...prev,
        class: user.class,
        section: user.section || "A",
      }));
    } else if (!isStudent && classes.length > 0 && !filters.class) {
      const defaultClass = classes[0];
      const sections = getSectionsForClass(defaultClass);
      setFilters((prev) => ({
        ...prev,
        class: defaultClass,
        section: sections[0] || "",
      }));
    }
  }, [classes, user, isStudent]);

  useEffect(() => {
    if (filters.class && filters.section) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.class, filters.section, filters.month, filters.year]);

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

  const shiftMonth = (dir) => {
    const idx = MONTHS.indexOf(filters.month);
    let newIdx = idx + dir;
    let year = Number(filters.year);
    if (newIdx < 0) {
      newIdx = 11;
      year -= 1;
    } else if (newIdx > 11) {
      newIdx = 0;
      year += 1;
    }
    setFilters({ ...filters, month: MONTHS[newIdx], year });
  };

  const shiftYear = (dir) => setFilters({ ...filters, year: Number(filters.year) + dir });

  const load = async () => {
    if (!filters.class || !filters.section) {
      setToast({ type: "error", message: "Enter Class and Section first" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/attendance/summary", { params: filters });
      setSummary(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load attendance sheet" });
    } finally {
      setLoading(false);
    }
  };

  const statusMark = (status) => {
    if (status === "present") return { text: "✓", color: "var(--green)" };
    if (status === "absent") return { text: "✕", color: "var(--red)" };
    if (status === "late") return { text: "L", color: "var(--yellow)" };
    if (status === "holiday") return { text: "★", color: "var(--primary)" };
    return { text: "-", color: "var(--text-muted)" };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSheet = () => {
    if (!summary || summary.sheet.length === 0) {
      setToast({ type: "error", message: "Load an attendance sheet first — nothing to download." });
      return;
    }

    const dayNumbers = Array.from({ length: summary.daysInMonth }, (_, i) =>
      String(i + 1).padStart(2, "0")
    );
    const header = ["Student", ...dayNumbers];
    const rows = summary.sheet.map((row) => [
      row.name,
      ...dayNumbers.map((d) => row.days[d] || "-"),
    ]);

    const escapeCell = (cell) => `"${String(cell).replace(/"/g, '""')}"`;
    const csvContent = [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AttendanceSheet_${filters.class || "All"}-${filters.section || "All"}_${
      filters.month
    }_${filters.year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({ type: "success", message: "Attendance sheet downloaded!" });
  };

  // Student-specific metrics calculation
  const studentRow = isStudent && summary?.sheet?.length > 0 ? summary.sheet[0] : null;
  const daysMap = studentRow?.days || {};
  const presentDays = Object.values(daysMap).filter((s) => s === "present").length;
  const absentDays = Object.values(daysMap).filter((s) => s === "absent").length;
  const recordedDays = presentDays + absentDays;
  const monthAttPct =
    recordedDays > 0 ? ((presentDays / recordedDays) * 100).toFixed(1) : "100.0";

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="breadcrumb">
        {isStudent
          ? "Learner Portal • Academic Records • My Attendance Sheet"
          : "Students Attendance Management • Students Attendance • Students Attendance Summary"}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {isStudent ? "My Attendance Sheet" : "Class Attendance Sheet"}
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0", fontSize: "14px" }}>
            {isStudent
              ? `Personal monthly attendance records for ${user?.name} (Class ${user?.class || "10"}-${user?.section || "A"}, Roll #${user?.rollNo || "N/A"})`
              : "Institutional monthly roll-call matrix across class sections"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-icon" onClick={handlePrint} title="Print attendance sheet" aria-label="Print attendance sheet">
            <FiPrinter aria-hidden="true" />
          </button>
          <button className="btn-icon" onClick={handleDownloadSheet} title="Download as CSV" aria-label="Download attendance sheet as CSV">
            <FiDownload aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* STUDENT PERSONAL TELEMETRY SUMMARY */}
      {isStudent && (
        <div className="metrics-strip" style={{ marginTop: 16 }}>
          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Monthly Attendance</span>
              <div
                className="metric-icon-wrap"
                style={{
                  background: Number(monthAttPct) >= 75 ? "#f0fdf4" : "#fef2f2",
                  color: Number(monthAttPct) >= 75 ? "var(--green)" : "var(--red)",
                }}
              >
                <FiCheckCircle aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value" style={{ color: Number(monthAttPct) >= 75 ? "var(--text-primary)" : "var(--red)" }}>
              {monthAttPct}%
            </div>
            <div className="metric-footer">
              <span className={`status-dot ${Number(monthAttPct) >= 75 ? "green" : "red"}`} aria-hidden="true" />
              <span>{Number(monthAttPct) >= 75 ? "Compliant (≥ 75%)" : "Warning: Below 75% required"}</span>
            </div>
          </div>

          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Sessions Held</span>
              <div className="metric-icon-wrap" style={{ background: "#eff6ff", color: "var(--primary)" }}>
                <FiCalendar aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value">{recordedDays}</div>
            <div className="metric-footer">
              <span className="status-dot green" aria-hidden="true" />
              <span>Conducted in {filters.month} {filters.year}</span>
            </div>
          </div>

          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Days Present</span>
              <div className="metric-icon-wrap" style={{ background: "#f0fdf4", color: "var(--green)" }}>
                <FiCheckCircle aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value" style={{ color: "var(--green)" }}>{presentDays}</div>
            <div className="metric-footer">
              <span className="status-dot green" aria-hidden="true" />
              <span>Sessions marked present</span>
            </div>
          </div>

          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Days Absent</span>
              <div
                className="metric-icon-wrap"
                style={{
                  background: absentDays > 0 ? "#fef2f2" : "#f0fdf4",
                  color: absentDays > 0 ? "var(--red)" : "var(--green)",
                }}
              >
                <FiXCircle aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value" style={{ color: absentDays > 0 ? "var(--red)" : "var(--text-secondary)" }}>
              {absentDays}
            </div>
            <div className="metric-footer">
              <span className={`status-dot ${absentDays > 0 ? "red" : "green"}`} aria-hidden="true" />
              <span>{absentDays > 0 ? "Unexcused absences" : "No absences recorded"}</span>
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR STRIP */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            {isStudent ? (
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span className="badge badge-primary" style={{ padding: "6px 12px", fontSize: "13px" }}>
                  Class {user?.class || "10"} - Section {user?.section || "A"}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Roll #{user?.rollNo || "N/A"}
                </span>
              </div>
            ) : (
              <>
                <div className="field">
                  <label>Class</label>
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
                    {getSectionsForClass(filters.class).map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="field">
              <label>Select Month</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="btn-icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
                <strong>{filters.month}</strong>
                <button className="btn-icon" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
              </div>
            </div>
            <div className="field">
              <label>Select Year</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="btn-icon" onClick={() => shiftYear(-1)} aria-label="Previous year">‹</button>
                <strong>{filters.year}</strong>
                <button className="btn-icon" onClick={() => shiftYear(1)} aria-label="Next year">›</button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span className="badge badge-green">Present (✓)</span>
            <span className="badge badge-red">Absent (✕)</span>
            <span className="badge badge-primary">Holiday (★)</span>
            <button className="btn btn-outline" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh Sheet"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Loading attendance sheet...</div>
      ) : !summary ? (
        <div className="card empty-state">
          <h3>Load sheet to view attendance records.</h3>
        </div>
      ) : summary.sheet.length === 0 ? (
        <div className="card empty-state">
          <h3>No attendance records found for this period.</h3>
          <p>Try switching to another month or year using the controls above.</p>
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>{isStudent ? "Student Name" : "Students"}</th>
                {Array.from({ length: summary.daysInMonth }, (_, i) => (
                  <th key={i} style={{ minWidth: "32px", textAlign: "center" }}>
                    {String(i + 1).padStart(2, "0")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.sheet.map((row) => (
                <tr key={row.studentId}>
                  <td className="cell-name">
                    <strong>{row.name}</strong>
                    {isStudent && (
                      <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>
                        Class {user?.class}-{user?.section} • Roll #{user?.rollNo}
                      </span>
                    )}
                  </td>
                  {Array.from({ length: summary.daysInMonth }, (_, i) => {
                    const day = String(i + 1).padStart(2, "0");
                    const mark = statusMark(row.days[day]);
                    return (
                      <td
                        key={i}
                        style={{
                          textAlign: "center",
                          color: mark.color,
                          fontWeight: 700,
                          background: mark.text === "✓" ? "#f0fdf4" : mark.text === "✕" ? "#fef2f2" : "transparent",
                        }}
                      >
                        {mark.text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceLog;
