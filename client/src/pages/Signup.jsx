import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiHash,
  FiLayers,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiBookOpen,
  FiCalendar,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import useClassesAndSections from "../context/useClassesAndSections";

const Signup = () => {
  const { classes, sections } = useClassesAndSections();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    rollNo: "",
    class: "10",
    section: "A",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const { register, error: contextError } = useAuth();
  const navigate = useNavigate();

  const activeError = localError || contextError;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setLocalError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters in length.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        rollNo: form.rollNo.trim(),
        class: form.class,
        section: form.section,
        role: "student",
      });
      navigate("/dashboard");
    } catch (err) {
      setLocalError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* ========================================================= */}
        {/* LEFT COLUMN: INSTITUTIONAL STUDENT ENROLLMENT HERO        */}
        {/* ========================================================= */}
        <aside className="auth-hero" aria-label="SchoolSync Student Registry Overview">
          <div className="auth-hero-glow" aria-hidden="true" />

          <div className="auth-hero-top">
            {/* Crest & Institutional Status */}
            <div className="auth-brand-badge">
              <div className="badge-crest">SS</div>
              <span className="badge-text">Student Academic Registry</span>
            </div>

            {/* Authority Headline */}
            <h1 className="auth-hero-title">
              Begin Your Academic <span>Journey Here.</span>
            </h1>
            <p className="auth-hero-subtitle">
              Enroll into the SchoolSync digital campus to access classroom timetables, track
              attendance compliance, inspect term scorecard marks, and download official study
              syllabi.
            </p>

            {/* Core Capability Pillars */}
            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <FiBookOpen />
                </div>
                <div className="auth-feature-body">
                  <h4>Curriculum Material Hub</h4>
                  <p>
                    Direct access to official departmental study notes, syllabus guides, and homework
                    handouts.
                  </p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <FiCalendar />
                </div>
                <div className="auth-feature-body">
                  <h4>Examination Datesheets</h4>
                  <p>
                    Live schedules for diagnostic unit tests, half-yearly assessments, and final
                    examinations with countdown alerts.
                  </p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <FiCheckCircle />
                </div>
                <div className="auth-feature-body">
                  <h4>Transparent Compliance</h4>
                  <p>
                    Auditable attendance tracking ensuring compliance with the institutional 75%
                    attendance guideline.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Trust Footer */}
          <div className="auth-hero-footer">
            <span>
              <FiShield aria-hidden="true" /> Encrypted Student Record Ledger
            </span>
            <span>Academic Session 2025–2026</span>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: REGISTRATION FORM CONTAINER                 */}
        {/* ========================================================= */}
        <main className="auth-form-container">
          <div className="auth-card">
            {/* Mobile Header (Visible on screens < 1024px) */}
            <div className="auth-mobile-header">
              <div className="auth-mobile-crest">SS</div>
              <div>
                <div className="auth-mobile-title">SchoolSync ERP</div>
                <div className="auth-mobile-sub">Student Enrollment Portal</div>
              </div>
            </div>

            {/* Form Title & Context */}
            <div className="auth-card-header">
              <div className="auth-status-pill">
                <span className="auth-status-dot" aria-hidden="true" />
                <span>Student Onboarding</span>
              </div>
              <h2 className="auth-card-title">Create Student Profile</h2>
              <p className="auth-card-desc">
                Register with your institutional credentials to activate your learner dashboard.
              </p>
            </div>

            {/* Active Error Banner */}
            {activeError && (
              <div className="auth-error-banner" role="alert">
                <FiAlertCircle className="auth-error-icon" aria-hidden="true" />
                <span>{activeError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Full Name */}
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="reg-name">
                  Full Name
                </label>
                <div className="auth-input-wrapper">
                  <FiUser className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="reg-name"
                    type="text"
                    name="name"
                    className="auth-input"
                    placeholder="e.g. Ankit Sharma"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Roll Number & Class/Section Grid */}
              <div className="auth-form-row">
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="reg-roll">
                    Roll Number
                  </label>
                  <div className="auth-input-wrapper">
                    <FiHash className="auth-input-icon" aria-hidden="true" />
                    <input
                      id="reg-roll"
                      type="text"
                      name="rollNo"
                      className="auth-input"
                      placeholder="e.g. 4"
                      value={form.rollNo}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="reg-class">
                    Enrolled Class
                  </label>
                  <div className="auth-input-wrapper">
                    <FiLayers className="auth-input-icon" aria-hidden="true" />
                    <select
                      id="reg-class"
                      name="class"
                      className="auth-select"
                      value={form.class}
                      onChange={handleChange}
                    >
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>
                          Class {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section & Email */}
              <div className="auth-form-row">
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="reg-section">
                    Section
                  </label>
                  <div className="auth-input-wrapper">
                    <FiLayers className="auth-input-icon" aria-hidden="true" />
                    <select
                      id="reg-section"
                      name="section"
                      className="auth-select"
                      value={form.section}
                      onChange={handleChange}
                    >
                      {sections.map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="reg-email">
                    Email Address
                  </label>
                  <div className="auth-input-wrapper">
                    <FiMail className="auth-input-icon" aria-hidden="true" />
                    <input
                      id="reg-email"
                      type="email"
                      name="email"
                      className="auth-input"
                      placeholder="student@schoolsync.edu"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="reg-password">
                  <span>Create Password</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Minimum 6 characters</span>
                </label>
                <div className="auth-input-wrapper">
                  <FiLock className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="auth-input"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-input-action"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>Creating Enrolled Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Enrollment &amp; Sign In</span>
                    <FiArrowRight aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Sign-in Link */}
            <div className="auth-card-footer">
              Already have an active account?
              <Link to="/login">Sign In</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Signup;
