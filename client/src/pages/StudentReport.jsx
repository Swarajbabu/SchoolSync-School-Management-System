import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import api from "../api/axios";
import Toast from "../components/Toast";
import StudentReportView from "../components/StudentReportView";

const StudentReport = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [studentRes, attRes, marksRes] = await Promise.all([
          api.get(`/students/${id}`),
          api.get(`/attendance/student/${id}`),
          api.get(`/marks/student/${id}`),
        ]);
        setStudent(studentRes.data);
        setAttendance(attRes.data);
        setMarks(marksRes.data);
      } catch (err) {
        setToast({ type: "error", message: "Failed to load report" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="student-report-page">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="command-header">
        <div className="command-title-block">
          <div className="breadcrumb-line">
            <span className="crumb-root">Student Registry</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Academic Transcript</span>
          </div>
          <h1 className="page-title">Detailed Academic Report</h1>
          <p className="command-meta">
            Official cumulative record card and attendance compliance ledger.
          </p>
        </div>

        <div className="command-quick-actions">
          <Link to={`/students/${id}`} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FiArrowLeft aria-hidden="true" />
            <span>Back to Profile</span>
          </Link>
        </div>
      </div>

      {!student ? (
        <div className="loading-text">Loading student dossier...</div>
      ) : (
        <StudentReportView student={student} attendance={attendance} marks={marks} loading={loading} />
      )}
    </div>
  );
};

export default StudentReport;
