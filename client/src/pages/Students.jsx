import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUserPlus,
  FiSearch,
  FiUsers,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiX,
  FiPhone,
  FiShield,
  FiAward,
} from "react-icons/fi";
import api from "../api/axios";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import useClassesAndSections from "../context/useClassesAndSections";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  rollNo: "",
  class: "",
  section: "",
  bloodGroup: "",
  guardianContact: "",
};

const emptyGuardianForm = {
  fatherName: "",
  motherName: "",
  guardianContact: "",
};

const Students = () => {
  const { user } = useAuth();
  const { classes, getSectionsForClass } = useClassesAndSections();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [guardianId, setGuardianId] = useState(null);
  const [guardianForm, setGuardianForm] = useState(emptyGuardianForm);

  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/students");
      setStudents(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load student registry" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === "ALL" || s.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditId(s._id);
    setForm({ ...emptyForm, ...s, password: "" });
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/students/${editId}`, form);
        setToast({ type: "success", message: "Student record updated!" });
      } else {
        await api.post("/students", form);
        setToast({ type: "success", message: "New student enrolled!" });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Operation failed" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this student profile and records?")) return;
    try {
      await api.delete(`/students/${id}`);
      setToast({ type: "success", message: "Student profile removed" });
      load();
    } catch (err) {
      setToast({ type: "error", message: "Failed to delete student" });
    }
  };

  const openGuardian = async (s) => {
    setGuardianId(s._id);
    setGuardianForm({
      fatherName: s.fatherName || "",
      motherName: s.motherName || "",
      guardianContact: s.guardianContact || "",
    });
    setShowGuardianModal(true);
  };

  const handleGuardianSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/students/${guardianId}/guardian`, guardianForm);
      setToast({ type: "success", message: "Guardian details updated!" });
      setShowGuardianModal(false);
      load();
    } catch (err) {
      setToast({ type: "error", message: "Failed to update guardian info" });
    }
  };

  return (
    <div className="students-registry-root">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* COMMAND HEADER */}
      <div className="command-header">
        <div className="command-title-block">
          <div className="breadcrumb-line">
            <span className="crumb-root">Administration</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Students Registry</span>
          </div>
          <h1 className="page-title">Institutional Student Directory</h1>
          <p className="command-meta">
            Central repository of enrolled learners, academic sections, guardian contacts, and dossiers.
          </p>
        </div>

        {user?.role === "admin" && (
          <div className="command-quick-actions">
            <button className="btn btn-primary" onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FiUserPlus aria-hidden="true" />
              <span>Enroll New Student</span>
            </button>
          </div>
        )}
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
                placeholder="Search by student name, roll number, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36, width: "100%" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Class Filter:</label>
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

      {loading ? (
        <div className="loading-text">Loading student records...</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="icon">
            <FiUsers />
          </div>
          <h3>No students match your search criteria.</h3>
          <p>Try clearing filters or search by a different roll number.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student Profile</th>
                <th>Roll No.</th>
                <th>Enrolled Class</th>
                <th>Blood Grp</th>
                <th>Guardian Contact</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
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
                    <td>
                      <span
                        className={`badge ${
                          s.bloodGroup && s.bloodGroup !== "N/A" ? "badge-green" : "badge-red"
                        }`}
                      >
                        {s.bloodGroup || "N/A"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                      {s.guardianContact || "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <Link
                          to={`/students/${s._id}`}
                          className="btn-icon"
                          title="View Profile"
                          aria-label={`View ${s.name}'s profile`}
                        >
                          <FiEye aria-hidden="true" />
                        </Link>
                        <button
                          className="btn-icon"
                          onClick={() => openGuardian(s)}
                          title="Manage Guardian"
                          aria-label={`Manage guardian for ${s.name}`}
                        >
                          <FiPhone aria-hidden="true" />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => openEdit(s)}
                          title="Edit Student"
                          aria-label={`Edit ${s.name}`}
                        >
                          <FiEdit2 aria-hidden="true" />
                        </button>
                        {user?.role === "admin" && (
                          <button
                            className="btn-icon absent"
                            onClick={() => handleDelete(s._id)}
                            title="Delete"
                            aria-label={`Delete ${s.name}`}
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* STUDENT ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <span>{editId ? "Edit Student Profile" : "Enroll New Student"}</span>
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
                  <label>Full Legal Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Assigned Roll No.</label>
                    <input name="rollNo" value={form.rollNo} onChange={handleChange} />
                  </div>
                </div>
                {!editId && (
                  <div className="field">
                    <label>Portal Password</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                )}
                <div className="row-2">
                  <div className="field">
                    <label>Enrolled Class</label>
                    <select
                      name="class"
                      value={form.class}
                      onChange={(e) => {
                        const val = e.target.value;
                        const secs = getSectionsForClass(val);
                        setForm({
                          ...form,
                          class: val,
                          section: secs[0] || "",
                        });
                      }}
                      required
                    >
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
                      value={form.section}
                      onChange={handleChange}
                      disabled={!form.class}
                      required
                    >
                      <option value="">Select Section...</option>
                      {getSectionsForClass(form.class).map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Blood Group</label>
                    <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                      <option value="">Select...</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Guardian Contact Phone</label>
                    <input
                      name="guardianContact"
                      value={form.guardianContact}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editId ? "Save Changes" : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GUARDIAN MODAL */}
      {showGuardianModal && (
        <div className="modal-backdrop" onClick={() => setShowGuardianModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <span>Guardian Dossier</span>
              <button
                className="btn-icon"
                style={{ marginLeft: "auto" }}
                onClick={() => setShowGuardianModal(false)}
                aria-label="Close dialog"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleGuardianSubmit}>
              <div className="modal-fields">
                <div className="field">
                  <label>Father's Name</label>
                  <input
                    name="fatherName"
                    value={guardianForm.fatherName}
                    onChange={(e) => setGuardianForm({ ...guardianForm, fatherName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Mother's Name</label>
                  <input
                    name="motherName"
                    value={guardianForm.motherName}
                    onChange={(e) => setGuardianForm({ ...guardianForm, motherName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Primary Emergency Contact Phone</label>
                  <input
                    name="guardianContact"
                    value={guardianForm.guardianContact}
                    onChange={(e) => setGuardianForm({ ...guardianForm, guardianContact: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowGuardianModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Guardian Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
