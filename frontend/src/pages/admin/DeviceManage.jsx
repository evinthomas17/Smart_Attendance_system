import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../../App.css";

const navigationItems = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Manage Students", icon: "👨‍🎓", path: "/admin/students" },
  { label: "Manage Faculty", icon: "👨‍🏫", path: "/admin/faculty" },
  { label: "Manage Subjects", icon: "📚", path: "/admin/subjects" },
  { label: "Manage Devices", icon: "📡", path: "/admin/devices" },
  { label: "Manage Reports", icon: "📊", path: "/admin/reports" },
  { label: "Manage Timetable", icon: "📅", path: "/admin/timetable" },
];

function DeviceManage() {
  const navigate = useNavigate();

  function handleAddDevice() {
    navigate("/admin/devices/add", { replace: true });
  }

  function handleViewUpdateDevice() {
    navigate("/admin/devices/view", { replace: true });
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
            onClick={() => window.alert("No new notifications.")}
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
              className={`menu-item${item.path === "/admin/devices" ? " active" : ""}`}
            >
              <span className="menu-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}

          <button type="button" className="menu-item logout-menu" onClick={() => {
            const shouldLogout = window.confirm("Are you sure you want to logout?");
            if (shouldLogout) {
              ["access", "refresh", "email", "role"].forEach((key) => {
                localStorage.removeItem(key);
              });
              navigate("/login", { replace: true });
            }
          }}>
            <span className="menu-icon" aria-hidden="true">
              🚪
            </span>
            Logout
          </button>
        </aside>

        <main className="content">
          <div className="page-heading">
            <div>
              <h1>Manage Device</h1>
              <p>Manage ESP32 devices assigned to classrooms</p>
            </div>
          </div>

          <section className="card" aria-labelledby="device-management-title">
            <h2 id="device-management-title" className="card-title">Device Management</h2>
            <p className="section-description">
              Manage ESP32 devices assigned to classrooms.
            </p>
          </section>

          <section className="card" aria-labelledby="device-options-title">
            <h2 id="device-options-title" className="card-title">Device Management Options</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              <button
                type="button"
                className="quick-action"
                onClick={handleAddDevice}
                style={{ padding: "30px 20px", textAlign: "center" }}
              >
                <div className="quick-icon" style={{ fontSize: "32px", background: "transparent", width: "auto", height: "auto", margin: "0 auto 16px" }}>
                  📡
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>Add Device</h3>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Register a new ESP32 device</p>
                </div>
              </button>

              <button
                type="button"
                className="quick-action"
                onClick={handleViewUpdateDevice}
                style={{ padding: "30px 20px", textAlign: "center" }}
              >
                <div className="quick-icon" style={{ fontSize: "32px", background: "transparent", width: "auto", height: "auto", margin: "0 auto 16px" }}>
                  🔧
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>View & Update Device</h3>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>View, edit or delete registered devices</p>
                </div>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DeviceManage;