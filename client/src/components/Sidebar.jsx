import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUser,
  FiUsers,
  FiUserCheck,
  FiClipboard,
  FiCalendar,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiLogOut,
  FiDollarSign,
  FiAward,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const getNavSections = (role) => {
  if (role === "student") {
    return [
      {
        title: "Workspace",
        items: [
          { to: "/dashboard", label: "My Learning Hub", icon: FiGrid },
          { to: "/profile", label: "My Profile", icon: FiUser },
        ],
      },
      {
        title: "Academic & Records",
        items: [
          { to: "/manage-timetable", label: "Class Timetable", icon: FiCalendar },
          { to: "/academic-results", label: "My Scorecard & Results", icon: FiAward },
          { to: "/attendance-log", label: "My Attendance Sheet", icon: FiClipboard },
          { to: "/academic-materials", label: "Course Materials", icon: FiBookOpen },
          { to: "/my-fees", label: "Fee Dues & Receipts", icon: FiDollarSign },
        ],
      },
      {
        title: "Campus Bulletins",
        items: [
          { to: "/notices", label: "Notice Bulletins", icon: FiBell },
          { to: "/exam-schedule", label: "Exam Schedules", icon: FiCalendar },
        ],
      },
    ];
  }

  if (role === "teacher") {
    return [
      {
        title: "Workspace",
        items: [
          { to: "/dashboard", label: "Faculty Dashboard", icon: FiGrid },
          { to: "/profile", label: "Faculty Profile", icon: FiUser },
        ],
      },
      {
        title: "Academic Operations",
        items: [
          { to: "/students", label: "Students Directory", icon: FiUsers },
          { to: "/attendance", label: "Daily Roll Call", icon: FiUserCheck },
          { to: "/attendance-log", label: "Class Attendance Sheet", icon: FiClipboard },
          { to: "/manage-timetable", label: "Teaching Timetable", icon: FiCalendar },
          { to: "/sessional-marks", label: "Sessional Marks Grading", icon: FiAward },
          { to: "/academic-results", label: "Student Report Cards", icon: FiAward },
          { to: "/academic-materials", label: "Course Materials", icon: FiBookOpen },
        ],
      },
      {
        title: "Campus Information",
        items: [
          { to: "/notices", label: "Notice Bulletins", icon: FiBell },
          { to: "/exam-schedule", label: "Exam Schedules", icon: FiCalendar },
        ],
      },
    ];
  }

  // Admin (Default)
  return [
    {
      title: "Executive Control",
      items: [
        { to: "/dashboard", label: "Executive Dashboard", icon: FiGrid },
        { to: "/profile", label: "Admin Profile", icon: FiUser },
      ],
    },
    {
      title: "Academic Operations",
      items: [
        { to: "/students", label: "Students Registry", icon: FiUsers },
        { to: "/attendance", label: "Daily Attendance", icon: FiUserCheck },
        { to: "/attendance-log", label: "Attendance Sheet", icon: FiClipboard },
        { to: "/manage-timetable", label: "Master Timetable", icon: FiCalendar },
        { to: "/sessional-marks", label: "Sessional Marks", icon: FiAward },
        { to: "/academic-results", label: "Academic Results", icon: FiAward },
        { to: "/academic-materials", label: "Course Materials", icon: FiBookOpen },
      ],
    },
    {
      title: "Administration & Registry",
      items: [
        { to: "/staff-management", label: "Faculty Directory", icon: FiBriefcase },
        { to: "/staff-attendance", label: "Staff Attendance", icon: FiClipboard },
        { to: "/class-fees", label: "Fee Collection", icon: FiDollarSign },
        { to: "/finance-control", label: "Finance & Accounts", icon: FiDollarSign },
        { to: "/exam-schedule", label: "Exam Schedules", icon: FiCalendar },
        { to: "/notices", label: "Notice Bulletins", icon: FiBell },
      ],
    },
  ];
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const role = user?.role || "student";
  const navSections = getNavSections(role);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SS";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-crest">
          <span>SS</span>
        </div>
        <div className="brand-info">
          <h2>SchoolSync ERP</h2>
          <span className="brand-badge">
            {role === "admin"
              ? "Administrative Root"
              : role === "teacher"
              ? "Faculty Academic Suite"
              : "Student Learning Hub"}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((sec) => (
          <div key={sec.title} className="nav-group">
            <div className="nav-group-title">{sec.title}</div>
            <div className="nav-group-items">
              {sec.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                >
                  <item.icon className="nav-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="avatar user-avatar">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={`${user.name}'s profile avatar`} />
            ) : (
              initials
            )}
          </div>
          <div className="user-details">
            <div className="user-name" title={user?.name}>{user?.name || "Academic User"}</div>
            <div
              className="user-role-badge"
              style={{
                color: role === "admin" ? "#38bdf8" : role === "teacher" ? "#2dd4bf" : "#a5b4fc",
              }}
            >
              {role === "admin"
                ? "System Administrator"
                : role === "teacher"
                ? "Academic Faculty"
                : `Student • Class ${user?.class || "10"}`}
            </div>
          </div>
        </div>

        <button className="sidebar-logout" onClick={logout} aria-label="Sign out of system">
          <FiLogOut aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
