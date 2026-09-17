import { Link, useNavigate } from "react-router-dom";
import { useLogout, useProfileDropdown } from "../../utils/auth";
import "../../App.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { isOpen: isProfileOpen, setIsOpen: setIsProfileOpen, ref: profileRef } = useProfileDropdown();

  return (
    <div className="admin-dashboard">
      <div className="circle-top" aria-hidden="true" />
      <div className="circle-bottom" aria-hidden="true" />

      <header className="header">
        <div className="brand">
          <div className="logo">SA</div>
          <div className="brand-name">Smart Attendance System</div>
        </div>

        <div className="admin-area">
          <button
            type="button"
            className="notification"
            onClick={() => window.alert("No new notifications.")}
            aria-label="Show notifications"
          >
            🔔
          </button>

          <div className="admin-profile" ref={profileRef} onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="profile-circle">S</div>
            <span>Student</span>
            <span className="dropdown-arrow">{isProfileOpen ? "▲" : "▼"}</span>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <Link 
                  to="/student/profile" 
                  className="dropdown-item"
                  onClick={() => { setIsProfileOpen(false); navigate("/student/profile"); }}
                >
                  <span className="dropdown-icon">👤</span>
                  Profile
                </Link>
                <button 
                  type="button" 
                  className="dropdown-item logout-item"
                  onClick={logout}
                >
                  <span className="dropdown-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" aria-label="Student navigation">
          <div className="sidebar-title">STUDENT</div>
        </aside>

        <main className="content">
          <div className="page-heading">
            <div>
              <h1>Student Dashboard</h1>
              <p>Welcome to your dashboard</p>
            </div>
          </div>
          <section className="card">
            <h2 className="card-title">Dashboard Content</h2>
            <p>Student dashboard content will be implemented here.</p>
          </section>
        </main>
      </div>
    </div>
  );
}

export default StudentDashboard;