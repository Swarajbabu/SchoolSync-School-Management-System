import { useState } from "react";
import { FiSearch, FiBell, FiShield, FiCheckCircle, FiCalendar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SS";

  const formatRole = (role) => {
    if (!role) return "User";
    if (role === "admin") return "Admin (Root)";
    if (role === "teacher") return "Academic Faculty";
    return "Enrolled Student";
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;

    if (q.includes("student")) navigate("/students");
    else if (q.includes("attend")) navigate("/attendance");
    else if (q.includes("time") || q.includes("sched")) navigate("/manage-timetable");
    else if (q.includes("fee") || q.includes("pay")) navigate("/class-fees");
    else if (q.includes("mark") || q.includes("result") || q.includes("grade")) navigate("/sessional-marks");
    else if (q.includes("notice") || q.includes("announc")) navigate("/notices");
    else if (q.includes("exam")) navigate("/exam-schedule");
    else if (q.includes("staff") || q.includes("teach")) navigate("/staff-management");
    else if (q.includes("mater") || q.includes("course") || q.includes("book")) navigate("/academic-materials");
    else navigate("/dashboard");

    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="topbar">
      <div className="topbar-context">
        <div className="institution-pill">
          <span className="institution-icon">🎓</span>
          <span className="institution-name">SchoolSync Academy</span>
        </div>
        <span className="context-separator">/</span>
        <div className="institution-pill" style={{ fontSize: "12.5px" }}>
          <FiCalendar style={{ color: "var(--text-muted)" }} aria-hidden="true" />
          <span>{currentDateStr}</span>
        </div>
        <span className="context-separator">/</span>
        <div className="term-badge">
          <span className="term-text">Session 2025–2026</span>
          <span className="term-dot">·</span>
          <span className="term-tag">Active Term</span>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Quick Search Palette */}
        <form className="quick-search-box" onSubmit={handleSearchSubmit}>
          <FiSearch className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Jump to page or module... (Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Quick search navigation"
          />
          <kbd className="search-shortcut">⌘K</kbd>
        </form>

        {/* Database Status Indicator */}
        <div className="db-status-pill" title="Connected to MongoDB Database Server">
          <span className="db-pulse" aria-hidden="true" />
          <span className="db-text">Database Live</span>
        </div>

        {/* User Identity Segment */}
        <div className="topbar-user-profile">
          <div className="user-text-info">
            <div className="user-fullname">{user?.name || "Academic User"}</div>
            <div className="user-role-label">
              <FiShield className="role-shield" aria-hidden="true" />
              <span>{formatRole(user?.role)}</span>
            </div>
          </div>

          <div className="avatar topbar-avatar" title={user?.name}>
            {user?.profileImage ? (
              <img src={user.profileImage} alt={`${user.name}'s profile avatar`} />
            ) : (
              initials
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
