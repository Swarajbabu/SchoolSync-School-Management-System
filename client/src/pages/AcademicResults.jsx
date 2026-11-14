import { useEffect, useState } from "react";
import { FiArrowLeft, FiSearch, FiAward, FiUser, FiCalendar, FiCheckCircle } from "react-icons/fi";
import api from "../api/axios";
import Toast from "../components/Toast";
import StudentReportView from "../components/StudentReportView";
import { useAuth } from "../context/AuthContext";
import useClassesAndSections from "../context/useClassesAndSections";

const AcademicResults = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "teacher";
  const { classes } = useClassesAndSections();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(isStaff ? null : user);
  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");

  useEffect(() => {
    if (isStaff) {
      api
        .get("/students")
        .then(({ data }) => setStudents(data))
        .catch(() => setToast({ type: "error", message: "Failed to load student directory" }));
    } else if (user?._id) {
      setSelected(user);
      loadReport(user._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, isStaff]);

  const loadReport = async (studentId) => {
    setLoading(true);
    try {
      const [attRes, marksRes] = await Promise.all([
        api.get(`/attendance/student/${studentId}`),
        api.get(`/marks/student/${studentId}`),
      ]);
      setAttendance(attRes.data);
      setMarks(marksRes.data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load academic report" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (s) => {
    setSelected(s);
    loadReport(s._id);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rollNo || "").toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "ALL" || s.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="academic-results-container">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {isStaff && !selected ? (
        <>
          {/* HEADER STRIP */}
          <div className="command-header">
            <div className="command-title-block">
              <div className="breadcrumb-line">
                <span className="crumb-root">Academic Operations</span>
                <span className="crumb-sep">/</span>
                <span className="crumb-active">Student Scorecards &amp; Dossiers</span>
              </div>
              <h1 className="page-title">Academic Results Registry</h1>
              <p className="command-meta">
                Verified institutional transcripts, continuous sessional evaluations, and attendance compliance.
              </p>
            </div>
          </div>

          {/* SEARCH & CLASS FILTER BAR */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="toolbar" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 260 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <FiSearch
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Search by student name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: 36, width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                  Filter Class:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  style={{ minWidth: 140 }}
                >
                  <option value="ALL">All Classes ({students.length})</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STUDENT REGISTRY LIST */}
          {filteredStudents.length === 0 ? (
            <div className="card empty-state">
              <h3>No student profiles match your search criteria.</h3>
              <p>Try clearing filters or search by a different student roll number.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student Profile</th>
                    <th>Roll Number</th>
                    <th>Enrolled Class</th>
                    <th>Guardian Contact</th>
                    <th>Academic Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
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
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                              className="avatar"
                              style={{
                                width: 38,
                                height: 38,
                                fontSize: 13,
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
                              <div className="cell-sub">{s.email}</div>
                            </div>
                          </div>
                        </td>
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
                          <span className="badge badge-primary">
                            {s.class && s.section ? `Class ${s.class} - ${s.section}` : "Unassigned"}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                          {s.guardianContact || "Verified"}
                        </td>
                        <td>
                          <span className="badge badge-green">Enrolled</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-outline"
                            onClick={() => handleSelect(s)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                          >
                            <FiAward aria-hidden="true" />
                            <span>View Dossier</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {/* DOSSIER VIEW HEADER */}
          <div className="command-header">
            <div className="command-title-block">
              <div className="breadcrumb-line">
                <span className="crumb-root">Academic Registry</span>
                <span className="crumb-sep">/</span>
                <span className="crumb-active">Student Academic Dossier</span>
              </div>
              <h1 className="page-title">Detailed Academic Report</h1>
              <p className="command-meta">
                Showing official term records for {selected?.name} (Class {selected?.class || "10"}-{selected?.section || "A"})
              </p>
            </div>

            {isStaff && (
              <div className="command-quick-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setSelected(null)}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <FiArrowLeft aria-hidden="true" />
                  <span>Back to Registry</span>
                </button>
              </div>
            )}
          </div>

          <StudentReportView
            student={selected}
            attendance={attendance}
            marks={marks}
            loading={loading}
          />
        </>
      )}
    </div>
  );
};

export default AcademicResults;
