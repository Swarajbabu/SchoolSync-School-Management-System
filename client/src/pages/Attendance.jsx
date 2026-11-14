import { useState, useEffect } from "react";
import { FiSearch, FiCheck, FiX, FiClock, FiCheckCircle, FiUserCheck, FiUsers, FiSave, FiAward } from "react-icons/fi";
import api from "../api/axios";
import Toast from "../components/Toast";
import { Link, useSearchParams } from "react-router-dom";
import useClassesAndSections from "../context/useClassesAndSections";

const today = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(
    2,
    "0"
  )}/${d.getFullYear()}`;
};

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const { classes, getSectionsForClass } = useClassesAndSections();
  const [filters, setFilters] = useState({
    date: today(),
    class: searchParams.get("class") || "",
    section: searchParams.get("section") || "",
    period: "Daily (Full Day)",
  });
  const [rollList, setRollList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const qClass = searchParams.get("class");
    const qSection = searchParams.get("section");
    if (qClass && qSection) {
      setFilters((prev) => ({
        ...prev,
        class: qClass,
        section: qSection,
      }));
    } else if (classes.length > 0 && !filters.class) {
      const defaultClass = classes[0];
      const sections = getSectionsForClass(defaultClass);
      setFilters((prev) => ({
        ...prev,
        class: defaultClass,
        section: sections[0] || "",
      }));
    }
  }, [classes, searchParams]);

  useEffect(() => {
    if (filters.class && filters.section) {
      loadRollList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.class, filters.section, filters.date, filters.period]);

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

  const loadRollList = async () => {
    if (!filters.class || !filters.section) {
      setToast({ type: "error", message: "Enter Class and Section first" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/attendance/roll", {
        params: {
          class: filters.class,
          section: filters.section,
          date: filters.date,
          period: filters.period,
        },
      });
      setRollList(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load roll list" });
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (studentId, status) => {
    setRollList({
      ...rollList,
      rollList: rollList.rollList.map((s) => (s._id === studentId ? { ...s, status } : s)),
    });
  };

  const markAllPresent = () => {
    setRollList({
      ...rollList,
      rollList: rollList.rollList.map((s) => ({ ...s, status: "present" })),
    });
  };

  const finalizeAndSave = async () => {
    setSaving(true);
    try {
      const entries = rollList.rollList.map((s) => ({ studentId: s._id, status: s.status }));
      await api.post("/attendance/save", {
        class: filters.class,
        section: filters.section,
        date: filters.date,
        period: filters.period,
        entries,
      });
      setToast({ type: "success", message: "Roll call saved successfully!" });
    } catch (err) {
      setToast({ type: "error", message: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  // Compute live roll call tallies
  const roster = rollList?.rollList || [];
  const presentCount = roster.filter((s) => s.status === "present").length;
  const absentCount = roster.filter((s) => s.status === "absent").length;
  const lateCount = roster.filter((s) => s.status === "late").length;
  const presentRate = roster.length > 0 ? Math.round((presentCount / roster.length) * 100) : 0;

  return (
    <div className="attendance-page-root">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* COMMAND HEADER */}
      <div className="command-header">
        <div className="command-title-block">
          <div className="breadcrumb-line">
            <span className="crumb-root">Academic Operations</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Daily Roll-Call &amp; Presence</span>
          </div>
          <h1 className="page-title">Daily Roll-Call Registry</h1>
          <p className="command-meta">
            Live classroom attendance logging with multi-period tracking and institutional auditing.
          </p>
        </div>

        {rollList && (
          <div className="command-quick-actions">
            <button
              className="btn btn-outline"
              onClick={markAllPresent}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <FiCheck aria-hidden="true" />
              <span>Mark All Present</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={finalizeAndSave}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <FiSave aria-hidden="true" />
              <span>{saving ? "Saving..." : "Finalize & Save Roll"}</span>
            </button>
          </div>
        )}
      </div>

      {/* FILTER CONTROLS CARD */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="toolbar" style={{ flexWrap: "wrap", gap: 16 }}>
          <div className="field">
            <label>Session Date</label>
            <input
              type="text"
              name="date"
              placeholder="MM/DD/YYYY"
              value={filters.date}
              onChange={handleChange}
              style={{ minWidth: 140 }}
            />
          </div>
          <div className="field">
            <label>Academic Class</label>
            <select name="class" value={filters.class} onChange={handleClassChange} style={{ minWidth: 150 }}>
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
              style={{ minWidth: 140 }}
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
            <label>Instructional Period</label>
            <select name="period" value={filters.period} onChange={handleChange} style={{ minWidth: 160 }}>
              <option>Daily (Full Day)</option>
              <option>Period 1</option>
              <option>Period 2</option>
              <option>Period 3</option>
              <option>Period 4</option>
            </select>
          </div>
          <div style={{ marginTop: "auto" }}>
            <button className="btn btn-primary" onClick={loadRollList} disabled={loading}>
              <FiSearch /> {loading ? "Loading..." : "Load Class Roll"}
            </button>
          </div>
        </div>
      </div>

      {!rollList ? (
        <div className="card empty-state">
          <h3>Select a class and section above to start roll call.</h3>
          <p>The student roster for the active academic term will appear here.</p>
        </div>
      ) : (
        <>
          {/* LIVE TELEMETRY TILES */}
          <div className="metrics-strip" style={{ marginBottom: 20 }}>
            <div className="metric-tile">
              <div className="metric-header">
                <span className="metric-tag">Enrolled Roster</span>
                <div className="metric-icon-wrap" style={{ background: "#eff6ff", color: "var(--primary)" }}>
                  <FiUsers aria-hidden="true" />
                </div>
              </div>
              <div className="metric-value">{roster.length}</div>
              <div className="metric-footer">
                <span>Class {filters.class}-{filters.section}</span>
              </div>
            </div>

            <div className="metric-tile">
              <div className="metric-header">
                <span className="metric-tag">Marked Present</span>
                <div className="metric-icon-wrap" style={{ background: "#f0fdf4", color: "var(--green)" }}>
                  <FiCheckCircle aria-hidden="true" />
                </div>
              </div>
              <div className="metric-value" style={{ color: "var(--green)" }}>
                {presentCount}
              </div>
              <div className="metric-footer">
                <span className="status-dot green" aria-hidden="true" />
                <span>{presentRate}% present in class</span>
              </div>
            </div>

            <div className="metric-tile">
              <div className="metric-header">
                <span className="metric-tag">Marked Absent</span>
                <div
                  className="metric-icon-wrap"
                  style={{
                    background: absentCount > 0 ? "#fef2f2" : "#f0fdf4",
                    color: absentCount > 0 ? "var(--red)" : "var(--green)",
                  }}
                >
                  <FiX aria-hidden="true" />
                </div>
              </div>
              <div className="metric-value" style={{ color: absentCount > 0 ? "var(--red)" : "var(--text-secondary)" }}>
                {absentCount}
              </div>
              <div className="metric-footer">
                <span className={`status-dot ${absentCount > 0 ? "red" : "green"}`} aria-hidden="true" />
                <span>{absentCount > 0 ? "Absences logged" : "Zero absences"}</span>
              </div>
            </div>

            <div className="metric-tile">
              <div className="metric-header">
                <span className="metric-tag">Marked Late</span>
                <div className="metric-icon-wrap" style={{ background: "#fffbeb", color: "var(--yellow)" }}>
                  <FiClock aria-hidden="true" />
                </div>
              </div>
              <div className="metric-value" style={{ color: "var(--yellow)" }}>
                {lateCount}
              </div>
              <div className="metric-footer">
                <span>Tardy arrivals</span>
              </div>
            </div>
          </div>

          {/* STUDENT ROSTER TABLE */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Student Profile</th>
                  <th>Recorded State</th>
                  <th>Attendance Toggle</th>
                  <th style={{ textAlign: "right" }}>Student Dossier</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s) => {
                  const initials = s.name
                    ? s.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "ST";

                  return (
                    <tr key={s._id}>
                      <td>
                        <span
                          className="code-font"
                          style={{
                            background: "var(--bg-surface-subtle)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          #{s.rollNo || "N/A"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            className="avatar"
                            style={{
                              width: 36,
                              height: 36,
                              fontSize: 12,
                              fontWeight: 700,
                              background: "var(--primary-light)",
                              color: "var(--primary)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="cell-name">{s.name}</div>
                            <div className="cell-sub">{s.email || `Roll #${s.rollNo}`}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.status === "present"
                              ? "badge-green"
                              : s.status === "absent"
                              ? "badge-red"
                              : "badge-yellow"
                          }`}
                          style={{ textTransform: "capitalize", fontWeight: 700 }}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "inline-flex", gap: 6, background: "var(--bg-surface-subtle)", padding: 4, borderRadius: 8, border: "1px solid var(--border)" }}>
                          <button
                            className={`btn ${s.status === "present" ? "btn-primary" : "btn-outline"}`}
                            style={{
                              padding: "4px 10px",
                              fontSize: 12,
                              background: s.status === "present" ? "var(--green)" : "transparent",
                              borderColor: s.status === "present" ? "var(--green)" : "transparent",
                              color: s.status === "present" ? "#ffffff" : "var(--text-secondary)",
                            }}
                            onClick={() => setStatus(s._id, "present")}
                            title="Mark Present"
                          >
                            <FiCheck /> Present
                          </button>
                          <button
                            className={`btn ${s.status === "absent" ? "btn-primary" : "btn-outline"}`}
                            style={{
                              padding: "4px 10px",
                              fontSize: 12,
                              background: s.status === "absent" ? "var(--red)" : "transparent",
                              borderColor: s.status === "absent" ? "var(--red)" : "transparent",
                              color: s.status === "absent" ? "#ffffff" : "var(--text-secondary)",
                            }}
                            onClick={() => setStatus(s._id, "absent")}
                            title="Mark Absent"
                          >
                            <FiX /> Absent
                          </button>
                          <button
                            className={`btn ${s.status === "late" ? "btn-primary" : "btn-outline"}`}
                            style={{
                              padding: "4px 10px",
                              fontSize: 12,
                              background: s.status === "late" ? "var(--yellow)" : "transparent",
                              borderColor: s.status === "late" ? "var(--yellow)" : "transparent",
                              color: s.status === "late" ? "#ffffff" : "var(--text-secondary)",
                            }}
                            onClick={() => setStatus(s._id, "late")}
                            title="Mark Late"
                          >
                            <FiClock /> Late
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={`/students/${s._id}/report`}
                          className="btn btn-outline"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 10px" }}
                        >
                          <FiAward aria-hidden="true" />
                          <span>Report Card</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* BOTTOM PERSISTENT ACTION DOCK */}
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
              Changes must be saved to update the student attendance records and parent notification logs.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setRollList(null)}>
                Dismiss
              </button>
              <button className="btn btn-primary" onClick={finalizeAndSave} disabled={saving}>
                <FiSave /> {saving ? "Saving Roll Call..." : "Finalize & Save Roll"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;
