import { useEffect, useState } from "react";
import {
  FiBookOpen,
  FiFileText,
  FiEdit3,
  FiExternalLink,
  FiPlus,
  FiX,
  FiCalendar,
  FiSearch,
} from "react-icons/fi";
import api from "../api/axios";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import useClassesAndSections from "../context/useClassesAndSections";

const CATEGORY_META = {
  "STUDY MATERIAL": { icon: FiBookOpen, color: "#17a673", bg: "#e8f9f2" },
  PAPER: { icon: FiFileText, color: "#e5484d", bg: "#fdecec" },
  HOMEWORK: { icon: FiEdit3, color: "#b8860b", bg: "#fff8e6" },
};

const AcademicMaterials = () => {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const { classes, getSectionsForClass } = useClassesAndSections();
  const [filters, setFilters] = useState({
    class: isStudent ? user?.class || "10" : "",
    section: isStudent ? user?.section || "All Sections" : "All Sections",
    category: "",
    subject: "",
  });
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    targetClass: "",
    section: "All Sections",
    category: "STUDY MATERIAL",
    subject: "",
    link: "",
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isStudent && user?.class && user.class !== "Unassigned") {
      setFilters((prev) => ({
        ...prev,
        class: user.class,
        section: user.section || "All Sections",
      }));
    }
  }, [user, isStudent]);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/materials", { params: filters });
      setMaterials(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to fetch academic materials" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.class, filters.section, filters.category]);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/materials", form);
      setToast({ type: "success", message: "Resource uploaded successfully!" });
      setShowModal(false);
      load();
    } catch (err) {
      setToast({ type: "error", message: "Upload failed" });
    }
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="breadcrumb">
        {isStudent
          ? "Learner Portal • Academic Hub • Course Materials & Notes"
          : "Academic Operations • Course Management • Assignments & Papers"}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {isStudent ? `Class ${user?.class || "10"} Course Materials` : "Assignments & Papers"}
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0", fontSize: "14px" }}>
            {isStudent
              ? `Downloadable syllabus notes, question papers, and homework assignments for Class ${user?.class || "10"}-${user?.section || "A"}`
              : "Central repository of course syllabus, question papers, and student assignments across all classes"}
          </p>
        </div>

        {(user?.role === "admin" || user?.role === "teacher") && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> Upload Resource
          </button>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="toolbar" style={{ flexWrap: "wrap", gap: 14 }}>
          {isStudent ? (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="badge badge-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>
                Class {user?.class || "10"} - Section {user?.section || "A"} Course Materials
              </span>
            </div>
          ) : (
            <>
              <div className="field">
                <label>Target Class</label>
                <select
                  name="class"
                  value={filters.class}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({
                      ...filters,
                      class: val,
                      section: "All Sections",
                    });
                  }}
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>
                      Class {cls}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Section</label>
                <select name="section" value={filters.section} onChange={handleFilterChange}>
                  <option value="All Sections">All Sections</option>
                  {filters.class &&
                    getSectionsForClass(filters.class).map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          <div className="field">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <option value="STUDY MATERIAL">STUDY MATERIAL</option>
              <option value="PAPER">PAPER</option>
              <option value="HOMEWORK">HOMEWORK</option>
            </select>
          </div>

          <div className="field">
            <label>Subject</label>
            <input
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              placeholder="e.g. Mathematics"
              style={{ minWidth: "160px" }}
            />
          </div>

          <button className="btn btn-outline" onClick={load} disabled={loading} style={{ alignSelf: "flex-end" }}>
            <FiSearch aria-hidden="true" />
            <span>{loading ? "Filtering..." : "Search"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Loading academic materials...</div>
      ) : materials.length === 0 ? (
        <div className="card empty-state" style={{ marginTop: 16 }}>
          <h3>No course materials found for Class {isStudent ? user?.class || "10" : filters.class || "selected criteria"}.</h3>
          <p>
            {isStudent
              ? "Your teachers haven't uploaded new notes or worksheets for this subject yet."
              : "Try adjusting the filters above or upload a new resource."}
          </p>
        </div>
      ) : (
        <div className="link-grid" style={{ marginTop: 16 }}>
          {materials.map((m) => {
            const meta = CATEGORY_META[m.category] || CATEGORY_META["STUDY MATERIAL"];
            const Icon = meta.icon;
            return (
              <div className="link-card" key={m._id} style={{ borderTop: `3px solid ${meta.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="icon-wrap" style={{ background: meta.bg, color: meta.color }}>
                    <Icon />
                  </div>
                  <span className="badge" style={{ background: meta.bg, color: meta.color }}>
                    {m.category}
                  </span>
                </div>
                <h3>{m.title}</h3>
                <p>
                  <strong>{m.subject}</strong> • Class {m.targetClass}
                  {m.section && m.section !== "All Sections" ? ` (${m.section})` : ""}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <span className="small-muted" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                    <FiCalendar /> {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                  <a
                    href={m.link || "#!"}
                    target="_blank"
                    rel="noreferrer"
                    className="view-details"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <FiExternalLink /> Open Resource
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <span>Upload Academic Resource</span>
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
                  <label>Title</label>
                  <input name="title" value={form.title} onChange={handleFormChange} required placeholder="e.g. Chapter 4 Practice Sheet" />
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Target Class</label>
                    <select
                      name="targetClass"
                      value={form.targetClass}
                      onChange={(e) => {
                        const val = e.target.value;
                        const secs = getSectionsForClass(val);
                        setForm({
                          ...form,
                          targetClass: val,
                          section: secs[0] || "All Sections",
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
                      onChange={handleFormChange}
                      disabled={!form.targetClass}
                    >
                      <option value="All Sections">All Sections</option>
                      {getSectionsForClass(form.targetClass).map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={handleFormChange}>
                      <option value="STUDY MATERIAL">STUDY MATERIAL</option>
                      <option value="PAPER">PAPER</option>
                      <option value="HOMEWORK">HOMEWORK</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Subject</label>
                    <input name="subject" value={form.subject} onChange={handleFormChange} required placeholder="e.g. Mathematics" />
                  </div>
                </div>
                <div className="field">
                  <label>Resource Link (URL)</label>
                  <input name="link" value={form.link} onChange={handleFormChange} placeholder="https://..." />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicMaterials;
