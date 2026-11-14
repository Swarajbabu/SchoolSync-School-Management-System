import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const Layout = ({ children }) => {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <main id="main-content" className="page-content" tabIndex="-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
