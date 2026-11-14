import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiBriefcase,
  FiBell,
  FiUserCheck,
  FiPlus,
  FiX,
  FiCheck,
  FiBookOpen,
  FiAward,
  FiDollarSign,
  FiUsers,
  FiClock,
  FiArrowRight,
  FiTrendingUp,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import useClassesAndSections from "../context/useClassesAndSections";

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const parseExamDate = (str) => {
  const parts = (str || "").split("/").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return { day: "--", month: "--", time: 0, raw: str };
  const [d, m, y] = parts;
  const time = new Date(y, m - 1, d).getTime();
  const daysDiff = Math.ceil((time - Date.now()) / (1000 * 60 * 60 * 24));
  return {
    day: String(d).padStart(2, "0"),
    month: MONTH_ABBR[m - 1] || "--",
    time,
    daysDiff,
    raw: str,
  };
};

const parseEventDate = (str) => {
  const parts = (str || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return { day: "--", month: "--", time: 0 };
  const [y, m, d] = parts;
  return {
    day: String(d).padStart(2, "0"),
    month: MONTH_ABBR[m - 1] || "--",
    time: new Date(y, m - 1, d).getTime(),
  };
};

const getSubjectColor = (subjectName = "") => {
  const sub = (subjectName || "").toLowerCase();
  if (sub.includes("math")) return { border: "#2563eb", bg: "#eff6ff", text: "#1e40af" };
  if (sub.includes("physic")) return { border: "#0284c7", bg: "#f0f9ff", text: "#0369a1" };
  if (sub.includes("chem")) return { border: "#7c3aed", bg: "#f5f3ff", text: "#6d28d9" };
  if (sub.includes("eng") || sub.includes("liter")) return { border: "#d97706", bg: "#fffbeb", text: "#b45309" };
  if (sub.includes("comp") || sub.includes("cs") || sub.includes("it")) return { border: "#059669", bg: "#ecfdf5", text: "#047857" };
  return { border: "#64748b", bg: "#f1f5f9", text: "#334155" };
};

const Dashboard = () => {
  const { user } = useAuth();
  const { classes } = useClassesAndSections();
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [events, setEvents] = useState([]);
  const [latestNotice, setLatestNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Quick modals on dashboard
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    content: "",
    category: "General",
    audience: "EVERYONE",
  });
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    examName: "",
    targetClass: "",
    examDate: "",
    description: "",
  });

  const loadDashboard = async () => {
    try {
      const [statsRes, examsRes, eventsRes, noticesRes] = await Promise.allSettled([
        api.get("/dashboard/stats"),
        api.get("/exams"),
        api.get("/events"),
        api.get("/notices"),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);

      const now = Date.now();
      if (examsRes.status === "fulfilled") {
        const parsedExams = examsRes.value.data
          .map((ex) => ({ ...ex, ...parseExamDate(ex.examDate) }))
          .sort((a, b) => a.time - b.time);
        const upcomingExams = parsedExams.filter((e) => e.time >= now);
        setExams((upcomingExams.length ? upcomingExams : parsedExams).slice(0, 4));
      }

      if (eventsRes.status === "fulfilled") {
        const parsedEvents = eventsRes.value.data
          .map((ev) => ({ ...ev, ...parseEventDate(ev.date) }))
          .sort((a, b) => a.time - b.time);
        const upcomingEvents = parsedEvents.filter((e) => e.time >= now);
        setEvents((upcomingEvents.length ? upcomingEvents : parsedEvents).slice(0, 3));
      }

      if (noticesRes.status === "fulfilled") {
        setLatestNotice(noticesRes.value.data[0] || null);
      }
    } catch (err) {
      console.error("Dashboard hydration error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handlePostNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post("/notices", noticeForm);
      setToast({ type: "success", message: "Announcement published" });
      setShowNoticeModal(false);
      setNoticeForm({ title: "", content: "", category: "General", audience: "EVERYONE" });
      loadDashboard();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to post notice" });
    }
  };

  const handleScheduleExam = async (e) => {
    e.preventDefault();
    try {
      await api.post("/exams", examForm);
      setToast({ type: "success", message: "Exam scheduled" });
      setShowExamModal(false);
      setExamForm({ examName: "", targetClass: "", examDate: "", description: "" });
      loadDashboard();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to schedule exam" });
    }
  };

  if (loading) {
    return <div className="loading-text">Loading institutional telemetry...</div>;
  }

  const role = stats?.role || user?.role || "student";

  // ==========================================
  // RENDER 1: TEACHER / FACULTY DASHBOARD
  // ==========================================
  if (role === "teacher") {
    const todayLectures = stats?.todayLectures || [];
    const effectiveDay = stats?.effectiveDay || "Today";
    const assignedClasses = stats?.assignedClasses || [];
    const pendingAtt = stats?.pendingAttendanceCount ?? 0;

    return (
      <div className="dashboard-root">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        {/* FACULTY COMMAND STRIP */}
        <div className="command-header">
          <div className="command-title-block">
            <div className="breadcrumb-line">
              <span className="crumb-root">Academic Faculty</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-active">Teacher Command Hub</span>
            </div>
            <h1 className="page-title">Faculty Academic Portal</h1>
            <p className="command-meta">
              Welcome, {user?.name} • Department of {user?.department || "Academic Sciences"} • Schedule for {effectiveDay}
            </p>
          </div>

          <div className="command-quick-actions">
            <Link to="/attendance" className="btn btn-outline">
              <FiUserCheck aria-hidden="true" />
              <span>Mark Roll Call</span>
            </Link>
            <button className="btn btn-primary" onClick={() => setShowNoticeModal(true)}>
              <FiPlus aria-hidden="true" />
              <span>Broadcast Bulletin</span>
            </button>
          </div>
        </div>

        {/* FACULTY METRICS STRIP */}
        <div className="metrics-strip">
          {/* Metric 1: Assigned Classes */}
          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Class Load</span>
              <div className="metric-icon-wrap" style={{ background: "#eff6ff", color: "var(--primary)" }}>
                <FiUsers aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value">{stats?.assignedClassesCount ?? 0}</div>
            <div className="metric-footer">
              <span className="status-dot green" aria-hidden="true" />
              <span>{assignedClasses.length > 0 ? assignedClasses.map(c => `Class ${c}`).join(", ") : "Active Classes"}</span>
            </div>
          </div>

          {/* Metric 2: Today's Assigned Lectures */}
          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Today's Schedule</span>
              <div className="metric-icon-wrap" style={{ background: "#f0fdf4", color: "var(--green)" }}>
                <FiClock aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value">{stats?.todayLecturesCount ?? 0}</div>
            <div className="metric-footer">
              <span className="status-dot green" aria-hidden="true" />
              <span>Lectures on {effectiveDay}</span>
            </div>
          </div>

          {/* Metric 3: Roll Call Status */}
          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Daily Attendance</span>
              <div
                className="metric-icon-wrap"
                style={{
                  background: pendingAtt > 0 ? "#fffbeb" : "#f0fdf4",
                  color: pendingAtt > 0 ? "var(--yellow)" : "var(--green)",
                }}
              >
                <FiUserCheck aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value" style={{ fontSize: "1.4rem" }}>
              {pendingAtt > 0 ? `${pendingAtt} Pending` : "Complete"}
            </div>
            <div className="metric-footer">
              <span className={`status-dot ${pendingAtt > 0 ? "yellow" : "green"}`} aria-hidden="true" />
              <span>{pendingAtt > 0 ? "Classes need roll call today" : "All rosters signed today"}</span>
            </div>
          </div>

          {/* Metric 4: Materials Uploaded */}
          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Course Materials</span>
              <div className="metric-icon-wrap" style={{ background: "#f8fafc", color: "var(--primary)" }}>
                <FiBookOpen aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value">{stats?.materialsUploaded ?? 0}</div>
            <div className="metric-footer">
              <span className="status-dot green" aria-hidden="true" />
              <span>Published syllabus &amp; notes</span>
            </div>
          </div>
        </div>

        {/* WORKSPACE DUAL STREAM */}
        <div className="workspace-grid">
          {/* LEFT COLUMN: Teaching Schedule & Academic Tools */}
          <div className="primary-stream">
            {/* Today's Teaching Schedule Card */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiClock className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">Today's Teaching Timetable ({effectiveDay})</h3>
                    <span className="card-subhead">
                      Faculty teaching periods assigned to {user?.name}
                    </span>
                  </div>
                </div>
                <Link to="/manage-timetable" className="card-action-link">
                  <span>Weekly Matrix</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>

              <div className="card-content">
                {todayLectures.length === 0 ? (
                  <div className="empty-lecture-state">
                    <FiClock className="empty-icon" aria-hidden="true" />
                    <p>No lectures scheduled for {effectiveDay}. You have duty free prep hours.</p>
                  </div>
                ) : (
                  <div className="lecture-timeline-list">
                    {todayLectures.map((lec) => {
                      const color = getSubjectColor(lec.subjectName);
                      return (
                        <div
                          className="lecture-slot-card"
                          key={lec._id || lec.period}
                          style={{ borderLeft: `4px solid ${color.border}` }}
                        >
                          <div
                            className="slot-badge"
                            style={{ background: color.bg, borderColor: `${color.border}40` }}
                          >
                            <span className="slot-period" style={{ color: color.text }}>{lec.period}</span>
                            <span className="slot-type">{lec.subjectType || "Theory"}</span>
                          </div>
                          <div className="slot-info">
                            <div className="slot-subject">{lec.subjectName}</div>
                            <div className="slot-details">
                              <span className="slot-code">Class {lec.class}-{lec.section}</span>
                              <span className="slot-dot">•</span>
                              <span className="slot-faculty">{lec.department || "Academic Wing"}</span>
                            </div>
                          </div>
                          <Link
                            to={`/attendance?class=${lec.class}&section=${lec.section}`}
                            className="btn btn-outline"
                            style={{ padding: "4px 10px", fontSize: "12px", marginLeft: "auto" }}
                          >
                            <FiUserCheck aria-hidden="true" />
                            <span>Roll Call</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Fast Faculty Dispatch Grid */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiBriefcase className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">Faculty Quick Actions</h3>
                    <span className="card-subhead">Daily academic evaluation and management tasks</span>
                  </div>
                </div>
              </div>
              <div className="dispatch-buttons-grid">
                <Link to="/attendance" className="dispatch-tile">
                  <FiUserCheck className="dispatch-icon" aria-hidden="true" />
                  <div className="dispatch-label">Mark Daily Roll Call</div>
                  <div className="dispatch-hint">Record daily attendance</div>
                </Link>
                <Link to="/sessional-marks" className="dispatch-tile">
                  <FiAward className="dispatch-icon" aria-hidden="true" />
                  <div className="dispatch-label">Grade Sessionals</div>
                  <div className="dispatch-hint">Input sessional test scores</div>
                </Link>
                <Link to="/academic-results" className="dispatch-tile">
                  <FiAward className="dispatch-icon" aria-hidden="true" />
                  <div className="dispatch-label">Student Report Cards</div>
                  <div className="dispatch-hint">Review class transcripts</div>
                </Link>
                <Link to="/academic-materials" className="dispatch-tile">
                  <FiBookOpen className="dispatch-icon" aria-hidden="true" />
                  <div className="dispatch-label">Upload Materials</div>
                  <div className="dispatch-hint">Publish notes &amp; syllabus</div>
                </Link>
              </div>
            </div>

            {/* Upcoming Academic Exams */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiAward className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">Scheduled School Examinations</h3>
                    <span className="card-subhead">Institutional datesheets for test paper preparation</span>
                  </div>
                </div>
                <Link to="/exam-schedule" className="card-action-link">
                  <span>View Datesheets</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>

              <div className="card-content">
                {exams.length === 0 ? (
                  <p className="empty-muted">No examinations scheduled currently.</p>
                ) : (
                  <div className="exam-table-compact">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Examination</th>
                          <th>Target Class</th>
                          <th>Timeline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exams.map((ex) => (
                          <tr key={ex._id}>
                            <td>
                              <div className="date-compact-pill">
                                <span className="date-day">{ex.day}</span>
                                <span className="date-month">{ex.month}</span>
                              </div>
                            </td>
                            <td>
                              <div className="exam-name-primary">{ex.examName}</div>
                              <div className="exam-desc-secondary">{ex.description}</div>
                            </td>
                            <td>
                              <span className="class-wing-badge">Class {ex.targetClass}</span>
                            </td>
                            <td>
                              <span className="countdown-pill">
                                {ex.daysDiff > 0 ? `In ${ex.daysDiff} days` : ex.daysDiff === 0 ? "Today" : "Concluded"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Bulletins & Terminal Info */}
          <div className="secondary-stream">
            {/* Official Bulletin Board */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiBell className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">Faculty Circulars &amp; Notices</h3>
                    <span className="card-subhead">Official notices and department memos</span>
                  </div>
                </div>
                <Link to="/notices" className="card-action-link">
                  <span>Archive</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>

              <div className="card-content">
                {!latestNotice ? (
                  <p className="empty-muted">No notices posted for this term.</p>
                ) : (
                  <div className="bulletin-featured-card">
                    <div className="bulletin-meta-top">
                      <span className="bulletin-category-chip">{latestNotice.category || "General"}</span>
                      <span className="bulletin-audience-chip">
                        Audience: {latestNotice.audience || "EVERYONE"}
                      </span>
                    </div>
                    <h4 className="bulletin-title">{latestNotice.title}</h4>
                    <p className="bulletin-body">{latestNotice.content}</p>
                    <div className="bulletin-footer">
                      <span className="bulletin-status-dot" aria-hidden="true" />
                      <span>Published by Central Administration</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Campus Events */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiCalendar className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">Academic Calendar</h3>
                    <span className="card-subhead">Upcoming institutional dates</span>
                  </div>
                </div>
              </div>

              <div className="card-content">
                {events.length === 0 ? (
                  <p className="empty-muted">No campus events scheduled.</p>
                ) : (
                  <div className="events-timeline">
                    {events.map((ev) => (
                      <div className="event-item-row" key={ev._id}>
                        <div className="event-date-chip">
                          <span className="d">{ev.day}</span>
                          <span className="m">{ev.month}</span>
                        </div>
                        <div className="event-details">
                          <div className="event-title-line">
                            <span className="event-title">{ev.title}</span>
                            <span className={`event-type-pill ${ev.type === "holiday" ? "holiday" : "event"}`}>
                              {ev.type === "holiday" ? "Recess" : "Campus Event"}
                            </span>
                          </div>
                          <div className="event-desc">{ev.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Faculty Terminal Info */}
            <div className="workspace-card terminal-card">
              <div className="terminal-header">
                <FiShield className="terminal-icon" aria-hidden="true" />
                <div className="terminal-title">Faculty Security Dossier</div>
              </div>
              <div className="terminal-rows">
                <div className="term-row">
                  <span className="term-label">Employee ID</span>
                  <span className="term-val code-font">{user?.teacherId || "TCH_FACULTY"}</span>
                </div>
                <div className="term-row">
                  <span className="term-label">Duty Station</span>
                  <span className="term-val">{user?.dutyStation || "Main Academic Wing"}</span>
                </div>
                <div className="term-row">
                  <span className="term-label">Designation</span>
                  <span className="term-val role-highlight">ACADEMIC FACULTY</span>
                </div>
                <div className="term-row">
                  <span className="term-label">Security Protocol</span>
                  <span className="term-val status-green">● FACULTY_SECURE_V1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NOTICE MODAL */}
        {showNoticeModal && renderNoticeModal()}
      </div>
    );
  }

  // ==========================================
  // RENDER 2: STUDENT / LEARNER DASHBOARD
  // ==========================================
  if (role === "student") {
    const todayLectures = stats?.todayLectures || [];
    const effectiveDay = stats?.effectiveDay || "Today";
    const attPct = stats?.attendancePercent ?? 100;
    const avgMarks = stats?.averageMarksPercent ?? 0;
    const feeStatus = stats?.feeStatus || "PENDING";
    const feeDues = stats?.feeDues ?? 0;

    return (
      <div className="dashboard-root">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        {/* STUDENT WELCOME STRIP */}
        <div className="command-header">
          <div className="command-title-block">
            <div className="breadcrumb-line">
              <span className="crumb-root">Student Portal</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-active">Learner Dashboard</span>
            </div>
            <h1 className="page-title">Student Learning Center</h1>
            <p className="command-meta">
              Welcome back, {user?.name} • Class {stats?.enrolledClass || "10"}-{stats?.enrolledSection || "A"} • Roll #{stats?.rollNo || "N/A"} • Session 2025–2026
            </p>
          </div>

          <div className="command-quick-actions">
            <Link to="/academic-results" className="btn btn-outline">
              <FiAward aria-hidden="true" />
              <span>My Scorecard</span>
            </Link>
            <Link to="/my-fees" className="btn btn-primary">
              <FiDollarSign aria-hidden="true" />
              <span>Fee Invoices</span>
            </Link>
          </div>
        </div>

        {/* STUDENT METRICS STRIP */}
        <div className="metrics-strip">
          {/* Metric 1: My Attendance Rate */}
          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Attendance Rate</span>
              <div
                className="metric-icon-wrap"
                style={{
                  background: attPct >= 75 ? "#f0fdf4" : "#fef2f2",
                  color: attPct >= 75 ? "var(--green)" : "var(--red)",
                }}
              >
                <FiUserCheck aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value" style={{ color: attPct >= 75 ? "var(--text-primary)" : "var(--red)" }}>
              {attPct}%
            </div>
            <div className="metric-footer">
              <span className={`status-dot ${attPct >= 75 ? "green" : "red"}`} aria-hidden="true" />
              <span>
                {attPct >= 75 ? "Compliant with 75% requirement" : "Warning: Below 75% threshold"}
              </span>
            </div>
          </div>

          {/* Metric 2: Academic Performance / Average */}
          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Academic Average</span>
              <div className="metric-icon-wrap" style={{ background: "#eff6ff", color: "var(--primary)" }}>
                <FiAward aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value">{avgMarks}%</div>
            <div className="metric-footer">
              <span className="status-dot green" aria-hidden="true" />
              <span>Across {stats?.gradedSubjectsCount ?? 0} sessional evaluations</span>
            </div>
          </div>

          {/* Metric 3: Fee Status */}
          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Fee Settlement</span>
              <div
                className="metric-icon-wrap"
                style={{
                  background: feeDues === 0 ? "#f0fdf4" : "#fef2f2",
                  color: feeDues === 0 ? "var(--green)" : "var(--red)",
                }}
              >
                <FiDollarSign aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value" style={{ fontSize: "1.4rem" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: 700,
                  background: feeStatus === "PAID" ? "#f0fdf4" : feeStatus === "PARTIAL" ? "#fffbeb" : "#fef2f2",
                  color: feeStatus === "PAID" ? "#166534" : feeStatus === "PARTIAL" ? "#b45309" : "#991b1b",
                  border: `1px solid ${feeStatus === "PAID" ? "#bbf7d0" : feeStatus === "PARTIAL" ? "#fde68a" : "#fecaca"}`,
                }}
              >
                {feeStatus}
              </span>
            </div>
            <div className="metric-footer">
              <span className={`status-dot ${feeDues === 0 ? "green" : "red"}`} aria-hidden="true" />
              <span>{feeDues > 0 ? `$${feeDues.toLocaleString()} Pending Dues` : "All dues settled"}</span>
            </div>
          </div>

          {/* Metric 4: Scheduled Lectures */}
          <div className="metric-tile">
            <div className="metric-header">
              <span className="metric-tag">Classes Today</span>
              <div className="metric-icon-wrap" style={{ background: "#f8fafc", color: "var(--primary)" }}>
                <FiClock aria-hidden="true" />
              </div>
            </div>
            <div className="metric-value">{stats?.todayLecturesCount ?? 0}</div>
            <div className="metric-footer">
              <span className="status-dot green" aria-hidden="true" />
              <span>Lectures for {effectiveDay}</span>
            </div>
          </div>
        </div>

        {/* STUDENT WORKSPACE DUAL STREAM */}
        <div className="workspace-grid">
          {/* LEFT COLUMN: My Classes Today & Academic Shortcuts */}
          <div className="primary-stream">
            {/* My Classes Today */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiClock className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">My Classes Today ({effectiveDay})</h3>
                    <span className="card-subhead">
                      Class {stats?.enrolledClass}-{stats?.enrolledSection} daily schedule
                    </span>
                  </div>
                </div>
                <Link to="/manage-timetable" className="card-action-link">
                  <span>Weekly Matrix</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>

              <div className="card-content">
                {todayLectures.length === 0 ? (
                  <div className="empty-lecture-state">
                    <FiClock className="empty-icon" aria-hidden="true" />
                    <p>No classes scheduled for {effectiveDay}. Enjoy your study break.</p>
                  </div>
                ) : (
                  <div className="lecture-timeline-list">
                    {todayLectures.map((lec) => {
                      const color = getSubjectColor(lec.subjectName);
                      return (
                        <div
                          className="lecture-slot-card"
                          key={lec._id || lec.period}
                          style={{ borderLeft: `4px solid ${color.border}` }}
                        >
                          <div
                            className="slot-badge"
                            style={{ background: color.bg, borderColor: `${color.border}40` }}
                          >
                            <span className="slot-period" style={{ color: color.text }}>{lec.period}</span>
                            <span className="slot-type">{lec.subjectType || "Theory"}</span>
                          </div>
                          <div className="slot-info">
                            <div className="slot-subject">{lec.subjectName}</div>
                            <div className="slot-details">
                              <span className="slot-code">{lec.subjectCode}</span>
                              <span className="slot-dot">•</span>
                              <span className="slot-faculty">Prof. {lec.facultyName}</span>
                              {lec.department && (
                                <>
                                  <span className="slot-dot">•</span>
                                  <span className="slot-dept">{lec.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Student Action Tiles */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiBookOpen className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">Learner Shortcuts</h3>
                    <span className="card-subhead">Quick access to student resources and documents</span>
                  </div>
                </div>
              </div>
              <div className="dispatch-buttons-grid">
                <Link to="/academic-results" className="dispatch-tile">
                  <FiAward className="dispatch-icon" aria-hidden="true" />
                  <div className="dispatch-label">My Scorecard</div>
                  <div className="dispatch-hint">View grades &amp; transcripts</div>
                </Link>
                <Link to="/attendance-log" className="dispatch-tile">
                  <FiUserCheck className="dispatch-icon" aria-hidden="true" />
                  <div className="dispatch-label">Attendance Sheet</div>
                  <div className="dispatch-hint">Review monthly attendance</div>
                </Link>
                <Link to="/academic-materials" className="dispatch-tile">
                  <FiBookOpen className="dispatch-icon" aria-hidden="true" />
                  <div className="dispatch-label">Study Materials</div>
                  <div className="dispatch-hint">Download notes &amp; papers</div>
                </Link>
                <Link to="/my-fees" className="dispatch-tile">
                  <FiDollarSign className="dispatch-icon" aria-hidden="true" />
                  <div className="dispatch-label">Fee Invoices &amp; Receipts</div>
                  <div className="dispatch-hint">Verify payment clearance</div>
                </Link>
              </div>
            </div>

            {/* Upcoming Class Exams */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiAward className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">Upcoming Examinations for Class {stats?.enrolledClass}</h3>
                    <span className="card-subhead">Official test schedules &amp; datesheets</span>
                  </div>
                </div>
                <Link to="/exam-schedule" className="card-action-link">
                  <span>View Full Schedule</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>

              <div className="card-content">
                {exams.length === 0 ? (
                  <p className="empty-muted">No examinations scheduled currently.</p>
                ) : (
                  <div className="exam-table-compact">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Exam Name</th>
                          <th>Description</th>
                          <th>Countdown</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exams.map((ex) => (
                          <tr key={ex._id}>
                            <td>
                              <div className="date-compact-pill">
                                <span className="date-day">{ex.day}</span>
                                <span className="date-month">{ex.month}</span>
                              </div>
                            </td>
                            <td>
                              <div className="exam-name-primary">{ex.examName}</div>
                            </td>
                            <td>
                              <div className="exam-desc-secondary">{ex.description || "Official assessment"}</div>
                            </td>
                            <td>
                              <span className="countdown-pill">
                                {ex.daysDiff > 0 ? `In ${ex.daysDiff} days` : ex.daysDiff === 0 ? "Today" : "Concluded"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Notices, Events & Student Dossier */}
          <div className="secondary-stream">
            {/* Student Noticeboard */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiBell className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">Student Bulletins</h3>
                    <span className="card-subhead">Institutional notices for students</span>
                  </div>
                </div>
                <Link to="/notices" className="card-action-link">
                  <span>Notice Archive</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>

              <div className="card-content">
                {!latestNotice ? (
                  <p className="empty-muted">No notices posted for your section.</p>
                ) : (
                  <div className="bulletin-featured-card">
                    <div className="bulletin-meta-top">
                      <span className="bulletin-category-chip">{latestNotice.category || "General"}</span>
                      <span className="bulletin-audience-chip">
                        Audience: {latestNotice.audience || "EVERYONE"}
                      </span>
                    </div>
                    <h4 className="bulletin-title">{latestNotice.title}</h4>
                    <p className="bulletin-body">{latestNotice.content}</p>
                    <div className="bulletin-footer">
                      <span className="bulletin-status-dot" aria-hidden="true" />
                      <span>Official Institutional Dispatch</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Campus Events */}
            <div className="workspace-card">
              <div className="card-header-bar">
                <div className="card-title-group">
                  <FiCalendar className="card-icon" aria-hidden="true" />
                  <div>
                    <h3 className="card-heading">Campus Calendar</h3>
                    <span className="card-subhead">Holidays &amp; campus activities</span>
                  </div>
                </div>
              </div>

              <div className="card-content">
                {events.length === 0 ? (
                  <p className="empty-muted">No campus events scheduled.</p>
                ) : (
                  <div className="events-timeline">
                    {events.map((ev) => (
                      <div className="event-item-row" key={ev._id}>
                        <div className="event-date-chip">
                          <span className="d">{ev.day}</span>
                          <span className="m">{ev.month}</span>
                        </div>
                        <div className="event-details">
                          <div className="event-title-line">
                            <span className="event-title">{ev.title}</span>
                            <span className={`event-type-pill ${ev.type === "holiday" ? "holiday" : "event"}`}>
                              {ev.type === "holiday" ? "Recess" : "Campus Event"}
                            </span>
                          </div>
                          <div className="event-desc">{ev.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Student Dossier */}
            <div className="workspace-card terminal-card">
              <div className="terminal-header">
                <FiShield className="terminal-icon" aria-hidden="true" />
                <div className="terminal-title">Enrolled Student Dossier</div>
              </div>
              <div className="terminal-rows">
                <div className="term-row">
                  <span className="term-label">Roll Number</span>
                  <span className="term-val code-font">{stats?.rollNo || user?.rollNo || "N/A"}</span>
                </div>
                <div className="term-row">
                  <span className="term-label">Class &amp; Section</span>
                  <span className="term-val">Class {stats?.enrolledClass || "10"}-{stats?.enrolledSection || "A"}</span>
                </div>
                <div className="term-row">
                  <span className="term-label">Guardian Contact</span>
                  <span className="term-val">{user?.guardianContact || "Verified"}</span>
                </div>
                <div className="term-row">
                  <span className="term-label">Blood Group</span>
                  <span className="term-val">{user?.bloodGroup || "N/A"}</span>
                </div>
                <div className="term-row">
                  <span className="term-label">Enrollment Status</span>
                  <span className="term-val status-green">● Active &amp; Enrolled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 3: ADMIN / EXECUTIVE DASHBOARD (DEFAULT)
  // ==========================================
  const monthRev = stats?.monthRevenue || 0;
  const arrears = stats?.feeArrears || 0;
  const totalDues = monthRev + arrears;
  const feeClearancePct = totalDues > 0 ? Math.round((monthRev / totalDues) * 100) : 100;

  return (
    <div className="dashboard-root">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* EXECUTIVE HEADER / COMMAND STRIP */}
      <div className="command-header">
        <div className="command-title-block">
          <div className="breadcrumb-line">
            <span className="crumb-root">Academic Control</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Enterprise Command Overview</span>
          </div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="command-meta">
            SchoolSync Institutional Core • Real-time database telemetry for academic, faculty &amp; finance streams.
          </p>
        </div>

        <div className="command-quick-actions">
          <button className="btn btn-outline" onClick={() => setShowExamModal(true)}>
            <FiCalendar aria-hidden="true" />
            <span>Schedule Exam</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowNoticeModal(true)}>
            <FiPlus aria-hidden="true" />
            <span>Broadcast Bulletin</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE METRICS PULSE */}
      <div className="metrics-strip">
        {/* Metric 1: Students */}
        <div className="metric-tile">
          <div className="metric-header">
            <span className="metric-tag">Active Registry</span>
            <div className="metric-icon-wrap" style={{ background: "#eff6ff", color: "var(--primary)" }}>
              <FiUsers aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">{stats?.totalStudents ?? 0}</div>
          <div className="metric-footer">
            <span className="status-dot green" aria-hidden="true" />
            <span>Enrolled Students across all active wings</span>
          </div>
        </div>

        {/* Metric 2: Faculty Attendance */}
        <div className="metric-tile">
          <div className="metric-header">
            <span className="metric-tag">Faculty Operations</span>
            <div className="metric-icon-wrap" style={{ background: "#f0fdf4", color: "var(--green)" }}>
              <FiUserCheck aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">{stats?.facultyAttendancePercent ?? 0}%</div>
          <div className="metric-footer">
            <span className="status-dot green" aria-hidden="true" />
            <span>{stats?.facultyAttendancePercent === 100 ? "100% Full Attendance On Duty" : "Daily check-in active"}</span>
          </div>
        </div>

        {/* Metric 3: Financial Health Bar */}
        <div className="metric-tile metric-tile-wide">
          <div className="metric-header">
            <span className="metric-tag">Monthly Fee Settlement</span>
            <div className="metric-icon-wrap" style={{ background: "#fffbeb", color: "var(--yellow)" }}>
              <FiDollarSign aria-hidden="true" />
            </div>
          </div>
          <div className="finance-progress-summary">
            <div className="finance-figures">
              <span className="figure-cleared">${monthRev.toLocaleString()}</span>
              <span className="figure-sep">/</span>
              <span className="figure-total">${totalDues.toLocaleString()}</span>
              <span className="figure-badge">{feeClearancePct}% Settled</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, feeClearancePct))}%` }}
              />
            </div>
            <div className="finance-meta-row">
              <span className="meta-left">Cleared Collections: ${monthRev.toLocaleString()}</span>
              <span className="meta-right">Outstanding Arrears: ${arrears.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ASYMMETRIC DUAL WORKSPACE */}
      <div className="workspace-grid">
        {/* LEFT COLUMN: Operations & Exams */}
        <div className="primary-stream">
          {/* Upcoming Examinations Card */}
          <div className="workspace-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <FiAward className="card-icon" aria-hidden="true" />
                <div>
                  <h3 className="card-heading">Upcoming Examinations</h3>
                  <span className="card-subhead">Session 2026-2027 Assessment Cycle</span>
                </div>
              </div>
              <Link to="/exam-schedule" className="card-action-link">
                <span>View All Exams</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            <div className="card-content">
              {exams.length === 0 ? (
                <p className="empty-muted">No examinations scheduled for this cycle.</p>
              ) : (
                <div className="exam-table-compact">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Examination</th>
                        <th>Class Wing</th>
                        <th>Timeline Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map((ex) => (
                        <tr key={ex._id}>
                          <td>
                            <div className="date-compact-pill">
                              <span className="date-day">{ex.day}</span>
                              <span className="date-month">{ex.month}</span>
                            </div>
                          </td>
                          <td>
                            <div className="exam-name-primary">{ex.examName}</div>
                            <div className="exam-desc-secondary">{ex.description}</div>
                          </td>
                          <td>
                            <span className="class-wing-badge">
                              {ex.targetClass === "All Classes" ? "All Wings" : `Class ${ex.targetClass}`}
                            </span>
                          </td>
                          <td>
                            <span className="countdown-pill">
                              {ex.daysDiff > 0 ? `In ${ex.daysDiff} days` : ex.daysDiff === 0 ? "Today" : "Concluded"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Fast Operational Dispatch */}
          <div className="workspace-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <FiBriefcase className="card-icon" aria-hidden="true" />
                <div>
                  <h3 className="card-heading">Administrative Dispatch Center</h3>
                  <span className="card-subhead">Central registry and institutional controls</span>
                </div>
              </div>
            </div>
            <div className="dispatch-buttons-grid">
              <Link to="/staff-management" className="dispatch-tile">
                <FiBriefcase className="dispatch-icon" aria-hidden="true" />
                <div className="dispatch-label">Faculty Directory</div>
                <div className="dispatch-hint">Manage staff profiles &amp; payroll</div>
              </Link>
              <Link to="/staff-attendance" className="dispatch-tile">
                <FiUserCheck className="dispatch-icon" aria-hidden="true" />
                <div className="dispatch-label">Staff Attendance</div>
                <div className="dispatch-hint">Record daily faculty sign-in</div>
              </Link>
              <Link to="/class-fees" className="dispatch-tile">
                <FiDollarSign className="dispatch-icon" aria-hidden="true" />
                <div className="dispatch-label">Fee Reconciliation</div>
                <div className="dispatch-hint">Collect dues &amp; update records</div>
              </Link>
              <Link to="/finance-control" className="dispatch-tile">
                <FiDollarSign className="dispatch-icon" aria-hidden="true" />
                <div className="dispatch-label">Finance &amp; Accounts</div>
                <div className="dispatch-hint">Institutional audit telemetry</div>
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Official Bulletin, Events & Terminal Info */}
        <div className="secondary-stream">
          {/* Official Bulletin Board */}
          <div className="workspace-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <FiBell className="card-icon" aria-hidden="true" />
                <div>
                  <h3 className="card-heading">Official Bulletin</h3>
                  <span className="card-subhead">Institutional announcements</span>
                </div>
              </div>
              <Link to="/notices" className="card-action-link">
                <span>Notice Archive</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            <div className="card-content">
              {!latestNotice ? (
                <p className="empty-muted">No notices posted for this term.</p>
              ) : (
                <div className="bulletin-featured-card">
                  <div className="bulletin-meta-top">
                    <span className="bulletin-category-chip">{latestNotice.category || "General"}</span>
                    <span className="bulletin-audience-chip">
                      Audience: {latestNotice.audience || "EVERYONE"}
                    </span>
                  </div>
                  <h4 className="bulletin-title">{latestNotice.title}</h4>
                  <p className="bulletin-body">{latestNotice.content}</p>
                  <div className="bulletin-footer">
                    <span className="bulletin-status-dot" aria-hidden="true" />
                    <span>Official Institutional Dispatch</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Campus Events & Observances */}
          <div className="workspace-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <FiCalendar className="card-icon" aria-hidden="true" />
                <div>
                  <h3 className="card-heading">Campus Calendar</h3>
                  <span className="card-subhead">Upcoming events &amp; observances</span>
                </div>
              </div>
            </div>

            <div className="card-content">
              {events.length === 0 ? (
                <p className="empty-muted">No campus events scheduled.</p>
              ) : (
                <div className="events-timeline">
                  {events.map((ev) => (
                    <div className="event-item-row" key={ev._id}>
                      <div className="event-date-chip">
                        <span className="d">{ev.day}</span>
                        <span className="m">{ev.month}</span>
                      </div>
                      <div className="event-details">
                        <div className="event-title-line">
                          <span className="event-title">{ev.title}</span>
                          <span className={`event-type-pill ${ev.type === "holiday" ? "holiday" : "event"}`}>
                            {ev.type === "holiday" ? "Recess" : "Campus Event"}
                          </span>
                        </div>
                        <div className="event-desc">{ev.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Terminal Dossier */}
          <div className="workspace-card terminal-card">
            <div className="terminal-header">
              <FiShield className="terminal-icon" aria-hidden="true" />
              <div className="terminal-title">Active Station Protocol</div>
            </div>
            <div className="terminal-rows">
              <div className="term-row">
                <span className="term-label">Duty Station</span>
                <span className="term-val">{user?.dutyStation || "Central Administration"}</span>
              </div>
              <div className="term-row">
                <span className="term-label">Security Protocol</span>
                <span className="term-val code-font">{user?.accessProtocol || "ADMIN_SECURE_V1"}</span>
              </div>
              <div className="term-row">
                <span className="term-label">Authorized Role</span>
                <span className="term-val role-highlight">{user?.role?.toUpperCase()}</span>
              </div>
              <div className="term-row">
                <span className="term-label">Institutional Status</span>
                <span className="term-val status-green">● Active &amp; Verified Root</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ANNOUNCEMENT MODAL */}
      {showNoticeModal && renderNoticeModal()}

      {/* QUICK EXAM MODAL */}
      {showExamModal && renderExamModal()}
    </div>
  );

  function renderNoticeModal() {
    return (
      <div className="modal-backdrop" onClick={() => setShowNoticeModal(false)}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FiBell aria-hidden="true" /> Post Official Announcement
            </span>
            <button
              type="button"
              className="btn-icon"
              style={{ marginLeft: "auto" }}
              onClick={() => setShowNoticeModal(false)}
              aria-label="Close dialog"
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={handlePostNotice}>
            <div className="modal-fields">
              <div className="field">
                <label>Title</label>
                <input
                  name="title"
                  required
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="e.g. Midterm Examination Datesheet"
                />
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Notice Category</label>
                  <select
                    name="category"
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="Examination">Examination</option>
                    <option value="Holiday">Holiday &amp; Recess</option>
                    <option value="Academic">Academic</option>
                    <option value="Sports">Sports &amp; Athletics</option>
                  </select>
                </div>
                <div className="field">
                  <label>Target Audience</label>
                  <select
                    name="audience"
                    value={noticeForm.audience}
                    onChange={(e) => setNoticeForm({ ...noticeForm, audience: e.target.value })}
                  >
                    <option value="EVERYONE">Everyone</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="TEACHER">Faculty &amp; Staff Only</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Content</label>
                <textarea
                  rows={4}
                  required
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="Enter announcement text..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowNoticeModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Publish Announcement
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderExamModal() {
    return (
      <div className="modal-backdrop" onClick={() => setShowExamModal(false)}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FiCalendar aria-hidden="true" /> Schedule Examination
            </span>
            <button
              type="button"
              className="btn-icon"
              style={{ marginLeft: "auto" }}
              onClick={() => setShowExamModal(false)}
              aria-label="Close dialog"
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={handleScheduleExam}>
            <div className="modal-fields">
              <div className="field">
                <label>Exam Name</label>
                <input
                  name="examName"
                  required
                  value={examForm.examName}
                  onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })}
                  placeholder="e.g. Unit Test 2, Mid-Term Examination"
                />
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Target Class</label>
                  <select
                    name="targetClass"
                    required
                    value={examForm.targetClass}
                    onChange={(e) => setExamForm({ ...examForm, targetClass: e.target.value })}
                  >
                    <option value="">Select target class...</option>
                    <option value="All Classes">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Exam Date (DD/MM/YYYY)</label>
                  <input
                    name="examDate"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    placeholder="e.g. 24/11/2026"
                  />
                </div>
              </div>
              <div className="field">
                <label>Description &amp; Syllabus Coverage</label>
                <textarea
                  rows={3}
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  placeholder="Brief description of examination topics or schedule..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowExamModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Exam Schedule
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};

export default Dashboard;
