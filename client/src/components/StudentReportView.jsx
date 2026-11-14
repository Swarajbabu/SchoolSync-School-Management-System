import { FiPrinter, FiCheckCircle, FiXCircle, FiAward, FiCalendar, FiUser, FiBookOpen } from "react-icons/fi";

const StudentReportView = ({ student, attendance, marks, loading }) => {
  if (loading) {
    return <div className="loading-text">Loading academic transcript...</div>;
  }

  if (!student) {
    return (
      <div className="card empty-state">
        <h3>Student profile not found.</h3>
      </div>
    );
  }

  // Attendance metrics
  const totalRecords = attendance?.totalRecords || 0;
  const totalPresent = attendance?.totalPresent || 0;
  const totalAbsent = totalRecords - totalPresent;
  const attPercentage = attendance?.percentage || (totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : "0.0");
  const isCompliant = Number(attPercentage) >= 75;

  // Marks metrics
  const marksList = marks || [];
  const totalObtained = marksList.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
  const totalMax = marksList.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
  const avgMarks = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const allPassed = marksList.length > 0 && marksList.every((m) => m.marksObtained >= m.maxMarks * 0.33);

  const initials = student.name
    ? student.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <div className="student-report-root">
      {/* 1. STUDENT DOSSIER HEADER CARD */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              className="avatar"
              style={{
                width: 56,
                height: 56,
                fontSize: 20,
                fontWeight: 700,
                background: "var(--primary-subtle)",
                color: "var(--primary)",
                border: "2px solid var(--border)",
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  {student.name}
                </h2>
                <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                  Class {student.class || "10"} - Section {student.section || "A"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 13, color: "var(--text-secondary)", flexWrap: "wrap" }}>
                <span><strong>Roll No:</strong> #{student.rollNo || "N/A"}</span>
                <span>•</span>
                <span><strong>Session:</strong> {student.academicSession || "2025–2026"}</span>
                <span>•</span>
                <span><strong>Guardian Contact:</strong> {student.guardianContact || "Verified"}</span>
              </div>
            </div>
          </div>

          <button className="btn btn-outline" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FiPrinter aria-hidden="true" />
            <span>Print Report Card</span>
          </button>
        </div>
      </div>

      {/* 2. ATTENDANCE SUMMARY SECTION */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="card-title-group" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiCheckCircle className="card-icon" style={{ fontSize: 20, color: "var(--green)" }} aria-hidden="true" />
            <div>
              <h3 className="card-heading" style={{ fontSize: 16, margin: 0 }}>Attendance Compliance &amp; Record</h3>
              <span className="card-subhead" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Institutional minimum threshold required: 75.0%
              </span>
            </div>
          </div>
        </div>

        <div className="card-content" style={{ padding: 20 }}>
          {/* STATS STRIP */}
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">Total Sessions</div>
              <div className="stat-value">{totalRecords}</div>
              <div className="stat-meta">Instructional days conducted</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Days Present</div>
              <div className="stat-value" style={{ color: "var(--green)" }}>{totalPresent}</div>
              <div className="stat-meta">Verified in class</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Days Absent</div>
              <div className="stat-value" style={{ color: totalAbsent > 0 ? "var(--red)" : "var(--text-secondary)" }}>
                {totalAbsent}
              </div>
              <div className="stat-meta">{totalAbsent > 0 ? "Absences on record" : "Zero absences"}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Attendance Rate</div>
              <div className="stat-value" style={{ color: isCompliant ? "var(--green)" : "var(--red)" }}>
                {attPercentage}%
              </div>
              <div className="stat-meta">
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: 11,
                    fontWeight: 700,
                    background: isCompliant ? "#f0fdf4" : "#fef2f2",
                    color: isCompliant ? "#166534" : "#991b1b",
                    border: `1px solid ${isCompliant ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  {isCompliant ? "COMPLIANT (≥ 75%)" : "WARNING: LOW ATTENDANCE"}
                </span>
              </div>
            </div>
          </div>

          {/* ATTENDANCE RECENT LOG TABLE */}
          {!attendance || attendance.records.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
              No attendance history logged for this student yet.
            </div>
          ) : (
            <>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>
                Recent Daily Roll-Call Entries (Last 15 Sessions)
              </h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Period / Session</th>
                      <th>Daily Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.records.slice(0, 15).map((r) => (
                      <tr key={r._id}>
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                            <FiCalendar style={{ color: "var(--text-muted)" }} />
                            {r.date}
                          </span>
                        </td>
                        <td>{r.period || "Daily (Full Day)"}</td>
                        <td>
                          <span
                            className={`badge ${
                              r.status === "present"
                                ? "badge-green"
                                : r.status === "absent"
                                ? "badge-red"
                                : "badge-yellow"
                            }`}
                            style={{ textTransform: "capitalize", fontWeight: 700 }}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. SESSIONAL MARKS & ACADEMIC RESULTS SECTION */}
      <div className="card">
        <div className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="card-title-group" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiAward className="card-icon" style={{ fontSize: 20, color: "var(--primary)" }} aria-hidden="true" />
            <div>
              <h3 className="card-heading" style={{ fontSize: 16, margin: 0 }}>Sessional Assessment Scorecard</h3>
              <span className="card-subhead" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Verified continuous internal assessments and diagnostic test results
              </span>
            </div>
          </div>
        </div>

        <div className="card-content" style={{ padding: 20 }}>
          {/* MARKS SUMMARY TILES */}
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">Cumulative Average</div>
              <div className="stat-value">{avgMarks}%</div>
              <div className="stat-meta">Across all evaluated sessionals</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Subjects Evaluated</div>
              <div className="stat-value">{marksList.length}</div>
              <div className="stat-meta">Graded tests on record</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Academic Standing</div>
              <div className="stat-value" style={{ fontSize: "1.3rem" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "4px",
                    fontSize: 12,
                    fontWeight: 700,
                    background: allPassed ? "#f0fdf4" : "#fef2f2",
                    color: allPassed ? "#166534" : "#991b1b",
                    border: `1px solid ${allPassed ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  {allPassed ? "PASS (GOOD STANDING)" : "NEEDS REVISION"}
                </span>
              </div>
              <div className="stat-meta">Minimum 33% per subject</div>
            </div>
          </div>

          {/* MARKS LEDGER TABLE */}
          {marksList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
              No sessional assessments recorded for this student yet.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Subject</th>
                    <th>Score Progress</th>
                    <th>Marks Obtained</th>
                    <th>Max Marks</th>
                    <th>Result</th>
                    <th>Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {marksList.map((m) => {
                    const pct = Math.round((m.marksObtained / (m.maxMarks || 100)) * 100);
                    const passed = m.marksObtained >= (m.maxMarks || 100) * 0.33;
                    return (
                      <tr key={m._id}>
                        <td>
                          <strong>{m.assessmentType}</strong>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{m.subject}</span>
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                flex: 1,
                                height: 8,
                                background: "var(--surface-subtle)",
                                borderRadius: 4,
                                overflow: "hidden",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(0, pct))}%`,
                                  height: "100%",
                                  background: passed ? "var(--primary)" : "var(--red)",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 32 }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: passed ? "var(--text-primary)" : "var(--red)" }}>
                          {m.marksObtained}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{m.maxMarks}</td>
                        <td>
                          <span
                            className={`badge ${passed ? "badge-green" : "badge-red"}`}
                            style={{ fontWeight: 700, fontSize: 11 }}
                          >
                            {passed ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                          {m.remarks || "—"}
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

export default StudentReportView;
