import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import "../../App.css";

// Each object represents one item in the left navigation menu.
const navigationItems = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Manage Students", icon: "👨‍🎓", path: "/admin/students" },
  { label: "Manage Faculty", icon: "👨‍🏫", path: "/admin/faculty" },
  { label: "Manage Subjects", icon: "📚", path: "/admin/subjects" },
  { label: "Manage Devices", icon: "📡", path: "/admin/devices" },
  { label: "Manage Reports", icon: "📊", path: "/admin/reports" },
  { label: "Manage Timetable", icon: "📅", path: "/admin/timetable" },
];

// Values are loaded from the backend. A null value means its table is not ready yet.
const statDefinitions = [
  { key: "departments", label: "Total Departments", icon: "🏢" },
  { key: "courses", label: "Total Courses", icon: "📚" },
  { key: "devices", label: "ESP32 Devices", icon: "📡" },
  { key: "faculty", label: "Total Faculty", icon: "👨‍🏫" },
];

const quickActions = [
  { 
    label: "Add Student", 
    path: "/admin/students" 
  },
  { 
    label: "Add Faculty", 
    path: "/admin/faculty" 
  },
  { 
    label: "Add Subject", 
    path: "/admin/subjects" 
  },
  { 
    label: "Add Device", 
    path: "/admin/devices" 
  },
  { 
    label: "Add Timetable", 
    path: "/admin/timetable" 
  },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({});

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const response = await api.get("/adminpanel/dashboard/");
        setDashboardStats(response.data);
      } catch (error) {
        // Keep unavailable values as dashes if the API is not running yet.
        console.error("Unable to load dashboard statistics:", error);
      }
    }

    loadDashboardStats();
  }, []);

  function handleNotificationClick() {
    window.alert("No new notifications.");
  }

  function handleLogout() {
    const shouldLogout = window.confirm("Are you sure you want to logout?");

    if (!shouldLogout) {
      return;
    }

    // Remove saved login details before returning to the login page.
    ["access", "refresh", "email", "role"].forEach((key) => {
      localStorage.removeItem(key);
    });

    navigate("/login", { replace: true });
  }

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
            onClick={handleNotificationClick}
            aria-label="Show notifications"
          >
            🔔
          </button>

          <div className="admin-profile">
            <div className="profile-circle">A</div>
            <span>Admin</span>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" aria-label="Admin navigation">
          <div className="sidebar-title">ADMIN</div>

          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item${item.path === "/admin/dashboard" ? " active" : ""}`}
            >
              <span className="menu-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}

          <button type="button" className="menu-item logout-menu" onClick={handleLogout}>
            <span className="menu-icon" aria-hidden="true">
              🚪
            </span>
            Logout
          </button>
        </aside>

        <main className="content">
          <div className="page-heading">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Welcome, Admin</p>
            </div>
          </div>

          <section className="stats" aria-label="Attendance system statistics">
            {statDefinitions.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className="stat-card-header">
                  <span className="stat-title">{stat.label}</span>
                  <span className="stat-icon" aria-hidden="true">
                    {stat.icon}
                  </span>
                </div>
                <div className="stat-number">{dashboardStats[stat.key] ?? "—"}</div>
              </article>
            ))}
          </section>

          <section className="card" aria-labelledby="quick-actions-title">
            <h2 id="quick-actions-title" className="card-title">
              Quick Actions
            </h2>
            <div className="quick-actions-list">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path} className="quick-action-item">
                  <div className="quick-action-icon">
                    <span aria-hidden="true">+</span>
                  </div>
                  <span className="quick-action-label">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
