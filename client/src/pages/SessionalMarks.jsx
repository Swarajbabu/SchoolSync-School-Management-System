import { useState, useEffect } from "react";
import api from "../api/axios";
import Toast from "../components/Toast";
import useClassesAndSections from "../context/useClassesAndSections";

const SESSIONAL_TYPES = ["1st Sessional", "2nd Sessional", "Final Exam"];
const STANDARD_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "English",
  "Computer Science",
  "Biology",
  "Social Science",
  "Hindi",
];

const SessionalMarks = () => {
  const { classes, getSectionsForClass } = useClassesAndSections();
  const [filters, setFilters] = useState({
    class: "",
    section: "",
    assessmentType: "1st Sessional",
    subject: "Mathematics",
  });
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    if (filters.class && filters.section && filters.subject) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.class, filters.section, filters.subject, filters.assessmentType]);

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
    if (!filters.class || !filters.section || !filters.subject) {
      setToast({ type: "error", message: "Fill Class, Section and Subject first" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/marks", { params: filters });
      setLedger(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load marks ledger" });
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (studentId, field, value) => {
    setLedger({
      ...ledger,
      ledger: ledger.ledger.map((row) =>
        row.studentId === studentId
          ? {
              ...row,
              [field]: value,
              status:
                field === "marksObtained"
                  ? Number(value) >= row.maxMarks * 0.33
                    ? "PASS"
                    : "FAIL"
                  : row.status,
            }
          : row
      ),
    });
  };

  const finalize = async () => {
    setSaving(true);
    try {
      const entries = ledger.ledger.map((r) => ({
        studentId: r.studentId,
        marksObtained: Math.max(0, Math.min(Number(r.maxMarks) || 100, Number(r.marksObtained) || 0)),
        maxMarks: Number(r.maxMarks) || 100,
        remarks: r.remarks || "",
      }));

      await api.post("/marks/save", {
        class: filters.class,
        section: filters.section,
        assessmentType: filters.assessmentType,
        subject: filters.subject,
        entries,
      });

      setToast({ type: "success", message: "Marks finalized and saved successfully!" });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sessional-marks-root">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="command-header">
        <div className="command-title-block">
          <div className="breadcrumb-line">
            <span className="crumb-root">Academic Operations</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Sessional Assessment Grading</span>
          </div>
          <h1 className="page-title">Sessional Marks Console</h1>
          <p className="command-meta">
            Grade continuous internal assessments, diagnostic exams, and term scorecards.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="toolbar" style={{ flexWrap: "wrap", gap: 14 }}>
          <div className="field">
            <label>Target Class</label>
            <select name="class" value={filters.class} onChange={handleClassChange} style={{ minWidth: 140 }}>
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
              style={{ minWidth: 130 }}
            >
              <option value="">Select Section...</option>
              {getSectionsForClass(filters.class).map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Assessment Type</label>
            <select
              name="assessmentType"
              value={filters.assessmentType}
              onChange={handleChange}
              style={{ minWidth: 160 }}
            >
              {SESSIONAL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Subject</label>
            <select
              name="subject"
              value={filters.subject}
              onChange={handleChange}
              style={{ minWidth: 160 }}
            >
              {STANDARD_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: "auto" }}>
            <button className="btn btn-primary" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Load Entry Ledger"}
            </button>
          </div>
        </div>
      </div>

      {!ledger ? (
        <div className="card empty-state">
          <h3>Select Assessment and Class details to begin marking.</h3>
          <p>Make sure classes and students are correctly registered in the system.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="toolbar" style={{ justifyContent: "space-between" }}>
              <div className="stat-inline">
                <div className="label">Current Subject Board</div>
                <div className="value">{filters.subject} ({filters.assessmentType})</div>
              </div>
              <div className="stat-inline">
                <div className="label">Evaluation Target</div>
                <div className="value">Class {filters.class} - {filters.section}</div>
              </div>
              <div className="stat-inline">
                <div className="label">Total Roster</div>
                <div className="value">{ledger.totalStudents} Students</div>
              </div>
              <div className="small-muted">Passing threshold: 33%</div>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Student Name</th>
                  <th>Marks Obtained</th>
                  <th>Maximum Marks</th>
                  <th>Calculated Standing</th>
                  <th>Faculty Remarks</th>
                </tr>
              </thead>
              <tbody>
                {ledger.ledger.map((row) => (
                  <tr key={row.studentId}>
                    <td>
                      <span className="code-font" style={{ background: "var(--bg-surface-subtle)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                        #{row.rollNo || "N/A"}
                      </span>
                    </td>
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={row.maxMarks || 100}
                        className="marks-input"
                        value={row.marksObtained}
                        onChange={(e) => updateRow(row.studentId, "marksObtained", e.target.value)}
                      />
                    </td>
                    <td>{row.maxMarks}</td>
                    <td>
                      <span className={`badge ${row.status === "PASS" ? "badge-green" : "badge-red"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <input
                        className="remark-input"
                        placeholder="Faculty feedback..."
                        value={row.remarks || ""}
                        onChange={(e) => updateRow(row.studentId, "remarks", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 16,
              background: "#ffffff",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Marks submitted will update student scorecards and cumulative GPA performance metrics.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setLedger(null)}>
                Dismiss
              </button>
              <button className="btn btn-primary" onClick={finalize} disabled={saving}>
                {saving ? "Saving Grades..." : "Finalize & Save Marks"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SessionalMarks;
