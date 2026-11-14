import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiUser,
  FiShield,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
  FiClock,
  FiAward,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [loginType, setLoginType] = useState("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const { login, error: contextError } = useAuth();
  const navigate = useNavigate();

  const activeError = localError || contextError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSubmitting(true);
    try {
      await login(identifier, password, loginType);
      navigate("/dashboard");
    } catch (err) {
      setLocalError(
        err.response?.data?.message || "Authentication failed. Please verify credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = (role, demoId, demoPass) => {
    setLocalError("");
    setLoginType(role === "student" ? "student" : "staff");
    setIdentifier(demoId);
    setPassword(demoPass);
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* ========================================================= */}
        {/* LEFT COLUMN: INSTITUTIONAL ENTERPRISE HERO SHOWCASE        */}
        {/* ========================================================= */}
        <aside className="auth-hero" aria-label="SchoolSync Institutional Overview">
          <div className="auth-hero-glow" aria-hidden="true" />

          <div className="auth-hero-top">
            {/* Crest & Institutional Status */}
            <div className="auth-brand-badge">
              <div className="badge-crest">SS</div>
              <span className="badge-text">SchoolSync Academic ERP</span>
            </div>

            {/* Authority Headline */}
            <h1 className="auth-hero-title">
              Intelligent School Management, <span>Elevated.</span>
            </h1>
            <p className="auth-hero-subtitle">
              A unified institutional operating system for real-time attendance auditing,
              examination grading, automated fee ledgers, and academic governance.
            </p>

            {/* Core Capability Pillars */}
            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <FiCheckCircle />
                </div>
                <div className="auth-feature-body">
                  <h4>Role-Scoped Governance (RBAC)</h4>
                  <p>
                    Strict cryptographic session isolation across Students, Academic Faculty, and
                    System Administrators.
                  </p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <FiClock />
                </div>
                <div className="auth-feature-body">
                  <h4>Real-Time Academic Telemetry</h4>
                  <p>
                    Live period-by-period attendance logs, automated pass/fail analytics, and class
                    timetables.
                  </p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <FiAward />
                </div>
                <div className="auth-feature-body">
                  <h4>Auditable Compliance &amp; Finance</h4>
                  <p>
                    Zero-leakage fee collection, multi-term report card generation, and institutional
                    bulletins.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Pre-fill Chips */}
            <div className="auth-demo-card">
              <div className="auth-demo-header">
                <span className="auth-demo-tag">
                  <FiZap /> 1-Click Demo Evaluation
                </span>
                <span className="auth-demo-hint">Click to populate credentials</span>
              </div>
              <div className="auth-demo-chips">
                <button
                  type="button"
                  className="auth-demo-chip"
                  onClick={() => handleQuickDemo("student", "4", "student123")}
                  title="Auto-fill Enrolled Student (Roll #4)"
                >
                  <span className="chip-role">Student</span>
                  <span>Roll: 4 (Ankit)</span>
                </button>
                <button
                  type="button"
                  className="auth-demo-chip"
                  onClick={() =>
                    handleQuickDemo("staff", "charu.s@schoolsync.edu", "teacher123")
                  }
                  title="Auto-fill Academic Faculty"
                >
                  <span className="chip-role">Faculty</span>
                  <span>Charu Sarswat</span>
                </button>
                <button
                  type="button"
                  className="auth-demo-chip"
                  onClick={() => handleQuickDemo("staff", "admin@school.com", "admin123")}
                  title="Auto-fill System Administrator"
                >
                  <span className="chip-role">Admin</span>
                  <span>System Admin</span>
                </button>
              </div>
            </div>
          </div>

          {/* Institutional Trust Footer */}
          <div className="auth-hero-footer">
            <span>
              <FiShield aria-hidden="true" /> 256-Bit TLS End-to-End Encryption
            </span>
            <span>FERPA &amp; ISO 27001 Security Standard</span>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: PROFESSIONAL FORM CONTAINER                 */}
        {/* ========================================================= */}
        <main className="auth-form-container">
          <div className="auth-card">
            {/* Mobile Header (Visible on screens < 1024px) */}
            <div className="auth-mobile-header">
              <div className="auth-mobile-crest">SS</div>
              <div>
                <div className="auth-mobile-title">SchoolSync ERP</div>
                <div className="auth-mobile-sub">Academic Command Center</div>
              </div>
            </div>

            {/* Form Title & Context */}
            <div className="auth-card-header">
              <div className="auth-status-pill">
                <span className="auth-status-dot" aria-hidden="true" />
                <span>Enterprise Portal</span>
              </div>
              <h2 className="auth-card-title">
                {loginType === "student" ? "Student Portal Sign In" : "Staff & Admin Gateway"}
              </h2>
              <p className="auth-card-desc">
                {loginType === "student"
                  ? "Enter your assigned institutional Roll Number or registered email address."
                  : "Enter your official institutional faculty or administrative account credentials."}
              </p>
            </div>

            {/* Portal Role Tabs */}
            <div className="auth-role-tabs" role="tablist" aria-label="Portal Selection">
              <button
                type="button"
                role="tab"
                aria-selected={loginType === "student"}
                className={`auth-role-tab ${loginType === "student" ? "active" : ""}`}
                onClick={() => {
                  setLoginType("student");
                  setLocalError("");
                }}
              >
                <FiUser aria-hidden="true" />
                <span>Student Portal</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={loginType === "staff"}
                className={`auth-role-tab ${loginType === "staff" ? "active" : ""}`}
                onClick={() => {
                  setLoginType("staff");
                  setLocalError("");
                }}
              >
                <FiShield aria-hidden="true" />
                <span>Faculty &amp; Admin</span>
              </button>
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
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="auth-identifier">
                  {loginType === "student" ? "Roll Number or Email" : "Institutional Email Address"}
                </label>
                <div className="auth-input-wrapper">
                  <FiMail className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="auth-identifier"
                    type="text"
                    className="auth-input"
                    placeholder={
                      loginType === "student"
                        ? "e.g. 4 or student@schoolsync.edu"
                        : "e.g. charu.s@schoolsync.edu"
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="auth-password">
                  <span>Security Password</span>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Please contact the Institutional Registrar or System Administrator to reset your security credentials.");
                    }}
                    className="auth-forgot-link"
                  >
                    Forgot Password?
                  </a>
                </label>
                <div className="auth-input-wrapper">
                  <FiLock className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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

              <div className="auth-options">
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep this session active</span>
                </label>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>Authenticating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to SchoolSync</span>
                    <FiArrowRight aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Registration Link */}
            <div className="auth-card-footer">
              Don't have an enrolled student profile yet?
              <Link to="/signup">Register Account</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
