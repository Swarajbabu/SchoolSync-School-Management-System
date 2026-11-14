import { useEffect, useState } from "react";
import { FiPlus, FiX, FiCalendar, FiClock, FiAward } from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import useClassesAndSections from "../context/useClassesAndSections";

const parseExamCountdown = (str) => {
  const parts = (str || "").split("/").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "Scheduled";
  const [d, m, y] = parts;
  const time = new Date(y, m - 1, d).getTime();
  const daysDiff = Math.ceil((time - Date.now()) / (1000 * 60 * 60 * 24));
  return daysDiff > 0 ? `In ${daysDiff} days` : daysDiff === 0 ? "Today" : "Concluded";
};

const ExamSchedule = () => {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const { classes } = useClassesAndSections();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ examName: "", targetClass: "", examDate: "", description: "" });
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/exams");
      setExams(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load exam schedule" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/exams", form);
      setToast({ type: "success", message: "Exam scheduled successfully!" });
      setShowModal(false);
      setForm({ examName: "", targetClass: "", examDate: "", description: "" });
      load();
    } catch (err) {
      setToast({ type: "error", message: "Failed to schedule exam" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this exam schedule entry?")) return;
    try {
      await api.delete(`/exams/${id}`);
      setToast({ type: "success", message: "Exam removed" });
      load();
    } catch (err) {
      setToast({ type: "error", message: "Delete failed" });
    }
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="breadcrumb">
        {isStudent
          ? "Learner Portal • Academic Hub • Exam Schedules"
          : "Academic Operations • Examination Management • Master Schedule"}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {isStudent ? `Class ${user?.class || "10"} Examination Datesheet` : "Examination Schedules"}
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0", fontSize: "14px" }}>
            {isStudent
              ? `Scheduled diagnostic assessments and term examinations for Class ${user?.class || "10"}-${user?.section || "A"}`
              : "Institutional datesheets and class examination timetables for Academic Session 2025–2026"}
          </p>
        </div>

        {user?.role === "admin" && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> Schedule Exam
          </button>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div className="stat-inline">
            <div className="label">
              {isStudent ? `Class ${user?.class || "10"} Assessments` : "Upcoming Assessments"}
            </div>
            <div className="value">{exams.length} Scheduled Exams</div>
          </div>
          <div className="stat-inline">
            <div className="label">Academic Session</div>
            <div className="value">2025–2026 Session</div>
          </div>
          {isStudent ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="badge badge-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>
                Class {user?.class || "10"} - Section {user?.section || "A"}
              </span>
            </div>
          ) : (
            <div className="small-muted">
              {user?.role === "admin" ? "Administrative schedule editor active" : "Faculty inspection view"}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Loading exam schedule...</div>
      ) : exams.length === 0 ? (
        <div className="card empty-state" style={{ marginTop: 16 }}>
          <h3>No examinations scheduled for Class {isStudent ? user?.class || "10" : "the current term"}.</h3>
          <p>{isStudent ? "Check back later when exam datesheets are published by the administration." : "Use the 'Schedule Exam' button to create new assessments."}</p>
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Target Class</th>
                <th>Exam Date</th>
                <th>Description</th>
                <th>{isStudent ? "Timeline Status" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((ex) => (
                <tr key={ex._id}>
                  <td>
                    <span className="badge badge-primary" style={{ fontWeight: 700 }}>{ex.examName}</span>
                  </td>
                  <td>
                    <span className="class-wing-badge">
                      {ex.targetClass === "All Classes" ? "All Wings" : `Class ${ex.targetClass}`}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                      <FiCalendar /> {ex.examDate}
                    </span>
                  </td>
                  <td>{ex.description || "—"}</td>
                  <td>
                    {isStudent ? (
                      <span className="countdown-pill">
                        <FiClock style={{ marginRight: 4 }} />
                        {parseExamCountdown(ex.examDate)}
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        {(user?.role === "admin" || user?.role === "teacher") && (
                          <Link to="/sessional-marks" className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "12px" }}>
                            Enter Marks
                          </Link>
                        )}
                        {user?.role === "admin" && (
                          <button
                            className="btn-icon absent"
                            onClick={() => handleDelete(ex._id)}
                            aria-label={`Delete exam ${ex.examName}`}
                          >
                            <FiX aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <span>Schedule New Exam</span>
              <button
                className="btn-icon"
                style={{ marginLeft: "auto" }}
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-fields">
                <div className="field">
                  <label>Exam Name</label>
                  <input name="examName" value={form.examName} onChange={handleChange} required placeholder="e.g. Unit Test 2, Mid-Term" />
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Target Class</label>
                    <select
                      name="targetClass"
                      value={form.targetClass}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Class...</option>
                      <option value="All Classes">All Classes</option>
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>
                          Class {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Exam Date</label>
                    <input
                      name="examDate"
                      placeholder="DD/MM/YYYY"
                      value={form.examDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Syllabus topics or examination notes..."
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSchedule;
