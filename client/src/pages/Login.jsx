import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiShield,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiZap,
  FiCheck,
  FiBookOpen,
  FiHelpCircle,
  FiUserCheck,
  FiUsers,
  FiActivity,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    id: "student",
    label: "Student",
    icon: FiBookOpen,
    desc: "Enrolled Students",
    badge: "Roll No or Email",
    placeholder: "e.g. 4 or student@schoolsync.edu",
    accent: "#2563eb",
    accentBg: "#eff6ff",
    border: "#bfdbfe",
    demo: { id: "4", pass: "student123", name: "Ankit (Roll 4)", shortName: "Ankit" },
  },
  {
    id: "teacher",
    label: "Faculty",
    icon: FiUserCheck,
    desc: "Academic Staff",
    badge: "Official Faculty Email",
    placeholder: "e.g. charu.s@schoolsync.edu",
    accent: "#0d9488",
    accentBg: "#f0fdfa",
    border: "#99f6e4",
    demo: { id: "charu.s@schoolsync.edu", pass: "teacher123", name: "Charu Sarswat", shortName: "Charu" },
  },
  {
    id: "admin",
    label: "Admin",
    icon: FiShield,
    desc: "System Management",
    badge: "Root Administrative Email",
    placeholder: "e.g. admin@school.com",
    accent: "#4f46e5",
    accentBg: "#eef2ff",
    border: "#c7d2fe",
    demo: { id: "admin@school.com", pass: "admin123", name: "System Admin", shortName: "Admin" },
  },
];

const Login = () => {
  const [selectedRole, setSelectedRole] = useState("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [justAutofilled, setJustAutofilled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const { login, error: contextError } = useAuth();
  const navigate = useNavigate();

  const currentRoleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];
  const activeError = localError || contextError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    if (!identifier.trim() || !password) {
      setLocalError("Please enter both your identifier and password.");
      return;
    }

    setSubmitting(true);
    try {
      // Map to role expected by authController
      const loginTypePayload =
        selectedRole === "teacher" ? "teacher" : selectedRole === "admin" ? "admin" : selectedRole;
      await login(identifier.trim(), password, loginTypePayload);
      navigate("/dashboard");
    } catch (err) {
      setLocalError(
        err.response?.data?.message || "Authentication failed. Please verify credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = (roleObj) => {
    setLocalError("");
    setSelectedRole(roleObj.id);
    setIdentifier(roleObj.demo.id);
    setPassword(roleObj.demo.pass);
    setJustAutofilled(true);
    setTimeout(() => setJustAutofilled(false), 1200);
  };

  return (
    <div className="campus-auth-root">
      {/* BACKGROUND TEXTURE & AMBIENT DEPTH */}
      <div className="campus-auth-bg-layer" aria-hidden="true">
        <div className="campus-ambient-glow glow-1" />
        <div className="campus-ambient-glow glow-2" />
        <div className="campus-grid-pattern" />
      </div>

      {/* TOP INSTITUTIONAL STATUS BAR */}
      <header className="campus-top-nav">
        <div className="campus-brand-container">
          <div className="campus-crest-icon">
            <span>SS</span>
          </div>
          <div className="campus-brand-text">
            <span className="campus-brand-name">SchoolSync</span>
            <span className="campus-brand-sub">Academic Information System</span>
          </div>
        </div>

        <div className="campus-top-meta">
          <div className="campus-telemetry-badge">
            <FiActivity className="pulse-icon" />
            <span>Academic Session 2025–2026</span>
          </div>
          <button
            type="button"
            className="campus-help-btn"
            onClick={() => setShowHelp(true)}
            aria-label="Portal help and support"
          >
            <FiHelpCircle aria-hidden="true" />
            <span>Help &amp; Support</span>
          </button>
        </div>
      </header>

      {/* MAIN CENTERED HERO CARD */}
      <main className="campus-auth-main">
        <div className={`campus-auth-card ${justAutofilled ? "autofill-flash" : ""}`}>
          {/* CARD TOP DECORATIVE STRIP */}
          <div
            className="card-accent-strip"
            style={{ backgroundColor: currentRoleConfig.accent }}
          />

          {/* CARD HEADER */}
          <div className="campus-card-header">
            <div
              className="role-avatar-halo"
              style={{
                backgroundColor: currentRoleConfig.accentBg,
                borderColor: currentRoleConfig.border,
                color: currentRoleConfig.accent,
              }}
            >
              <currentRoleConfig.icon className="role-main-icon" />
            </div>

            <h1 className="campus-card-title">Portal Sign In</h1>
            <p className="campus-card-desc">
              Select your institutional role and enter your authorized credentials.
            </p>
          </div>

          {/* 4-ROLE SEGMENTED SELECTOR */}
          <div className="campus-role-selector" role="tablist" aria-label="Institutional Role Selection">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`campus-role-pill ${isSelected ? "selected" : ""}`}
                  style={
                    isSelected
                      ? {
                          borderColor: role.accent,
                          color: role.accent,
                          backgroundColor: "#ffffff",
                        }
                      : {}
                  }
                  onClick={() => {
                    setSelectedRole(role.id);
                    setLocalError("");
                  }}
                >
                  <Icon className="pill-icon" />
                  <span className="pill-title">{role.label}</span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC ROLE GUIDANCE BANNER */}
          <div
            className="role-context-banner"
            style={{
              backgroundColor: currentRoleConfig.accentBg,
              borderColor: currentRoleConfig.border,
              color: currentRoleConfig.accent,
            }}
          >
            <span className="context-dot" style={{ backgroundColor: currentRoleConfig.accent }} />
            <span className="context-text">
              <strong>{currentRoleConfig.label} Access:</strong> Enter your {currentRoleConfig.badge.toLowerCase()}
            </span>
          </div>

          {/* ACTIVE ERROR ALERT */}
          {activeError && (
            <div className="campus-error-alert" role="alert">
              <FiAlertCircle className="error-icon" aria-hidden="true" />
              <span>{activeError}</span>
            </div>
          )}

          {/* FORM CONTAINER */}
          <form onSubmit={handleSubmit} className="campus-form" noValidate>
            {/* IDENTIFIER FIELD */}
            <div className="campus-form-field">
              <label htmlFor="campus-identifier" className="campus-label">
                <span>{currentRoleConfig.badge}</span>
                <span className="required-star">*</span>
              </label>
              <div className="campus-input-box">
                <FiMail className="input-glyph" aria-hidden="true" />
                <input
                  id="campus-identifier"
                  type="text"
                  className="campus-input"
                  placeholder={currentRoleConfig.placeholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div className="campus-form-field">
              <div className="label-with-link">
                <label htmlFor="campus-password" className="campus-label">
                  <span>Security Password</span>
                  <span className="required-star">*</span>
                </label>
                <button
                  type="button"
                  className="link-plain"
                  onClick={() => setShowHelp(true)}
                >
                  Forgot?
                </button>
              </div>
              <div className="campus-input-box">
                <FiLock className="input-glyph" aria-hidden="true" />
                <input
                  id="campus-password"
                  type={showPassword ? "text" : "password"}
                  className="campus-input"
                  placeholder="Enter your security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME TOGGLE */}
            <div className="campus-options-row">
              <label className="checkbox-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Keep this session active on this device</span>
              </label>
            </div>

            {/* PRIMARY SUBMIT BUTTON */}
            <button
              type="submit"
              className="campus-submit-btn"
              style={{
                backgroundColor: currentRoleConfig.accent,
                boxShadow: `0 8px 20px -6px ${currentRoleConfig.accent}66`,
              }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="campus-btn-spinner" aria-hidden="true" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {currentRoleConfig.label} Portal</span>
                  <FiArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* 1-CLICK DEMO EVALUATION BAR */}
          <div className="campus-demo-dock">
            <div className="demo-dock-label">
              <FiZap className="dock-zap" />
              <span>1-Click Test Credentials:</span>
            </div>
            <div className="demo-chip-row">
              {ROLES.map((r) => {
                const isCurrent = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`demo-pill ${isCurrent ? "active-demo" : ""}`}
                    onClick={() => handleQuickDemo(r)}
                    title={`Click to auto-fill ${r.demo.name}`}
                  >
                    <span className="demo-pill-badge">{r.label}</span>
                    <span className="demo-pill-name">{r.demo.shortName || r.demo.name}</span>
                    {isCurrent && <FiCheck className="demo-check" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARD REGISTRATION LINK */}
          <div className="campus-card-footer">
            <span>Enrolling as a new student?</span>
            <Link to="/signup" className="signup-link">
              Create an Account
            </Link>
          </div>
        </div>
      </main>

      {/* BOTTOM FOOTER */}
      <footer className="campus-footer">
        <div className="campus-footer-content">
          <span>SchoolSync Academic ERP v2.4 • Official Institutional Access</span>
          <span className="footer-sep">•</span>
          <span>256-Bit SSL Secured</span>
          <span className="footer-sep">•</span>
          <span>FERPA &amp; ISO 27001 Certified Governance</span>
        </div>
      </footer>

      {/* HELP MODAL DIALOG */}
      {showHelp && (
        <div className="campus-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="campus-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-crest">SS</div>
              <h3>Institutional Access Support</h3>
            </div>
            <div className="modal-body">
              <p>
                <strong>Student Credentials:</strong> Students can log in using either their official
                Roll Number (e.g. <code>4</code>) or registered school email (e.g.{" "}
                <code>student@schoolsync.edu</code>).
              </p>
              <p>
                <strong>Faculty &amp; Staff:</strong> Faculty must use their designated{" "}
                <code>@schoolsync.edu</code> institutional email.
              </p>
              <p>
                <strong>Credential Resets:</strong> For password resets or MFA support, please contact
                the Academic Registry Office at <code>admin@school.com</code>.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowHelp(false)}
              >
                Close Guidance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
