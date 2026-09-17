import { useEffect, useState, useRef } from "react";        
import { Link, useNavigate } from "react-router-dom";
import { useLogout } from "../../utils/auth";
import api from "../../services/api";
import "../../App.css";

const navigationItems = [
  { label: "Dashboard", icon: "🏠", path: "/faculty/dashboard" },
  { label: "Session Management", icon: "📅", path: "/faculty/sessions" },
  { label: "Attendance Management", icon: "📋", path: "/faculty/attendance" },
  { label: "Academic Duty", icon: "🎓", path: "/faculty/academic-duty" },
  { label: "Student Management", icon: "👨‍🎓", path: "/faculty/students" },
  { label: "Timetable Management", icon: "🗓️", path: "/faculty/timetable" },
  { label: "Reports", icon: "📊", path: "/faculty/reports" },
];

function FacultyDashboard() {
  const navigate = useNavigate();
  const logout = useLogout();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const response = await api.get("/faculty/dashboard/");
        setDashboardData(response.data);
      } catch (err) {
        console.error("Failed to load faculty dashboard:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleNotificationClick() {
    window.alert("No new notifications.");
  }

  function handleProfileClick() {
    setIsProfileOpen(!isProfileOpen);
  }

  function handleProfileMenuItemClick(path) {
    setIsProfileOpen(false);
    navigate(path);
  }

  if (loading) {
    return (
      <div className="faculty-dashboard">
        <div className="circle-top" aria-hidden="true" />
        <div className="circle-bottom" aria-hidden="true" />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "16px" }}>🔄</div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="faculty-dashboard">
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
            <div className="admin-profile" ref={profileRef} onClick={handleProfileClick}>
              <div className="profile-circle">F</div>
              <span>Faculty</span>
              <span className="dropdown-arrow">{isProfileOpen ? "▲" : "▼"}</span>
            </div>
            {isProfileOpen && (
              <div className="profile-dropdown">
                <Link 
                  to="/faculty/profile" 
                  className="dropdown-item"
                  onClick={() => handleProfileMenuItemClick("/faculty/profile")}
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
        </header>
        <div className="layout">
          <aside className="sidebar" aria-label="Faculty navigation">
            <div className="sidebar-title">FACULTY</div>
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`menu-item${item.path === "/faculty/dashboard" ? " active" : ""}`}
              >
                <span className="menu-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </aside>
          <main className="content">
            <div className="page-heading">
              <div>
                <h1>Faculty Dashboard</h1>
                <p>Welcome, {dashboardData?.faculty?.full_name || "Faculty"}</p>
              </div>
            </div>
            <div className="card" style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "#e03e3e" }}>{error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const faculty = dashboardData?.faculty || {};
  const todaysClassesCount = dashboardData?.todays_classes_count || 0;
  const currentSession = dashboardData?.current_session;
  const upcomingSession = dashboardData?.upcoming_session;
  const classTeacher = dashboardData?.class_teacher;
  const todaysSessions = dashboardData?.todays_sessions || [];
  const attendanceStats = dashboardData?.attendance_stats || { present: 0, late: 0, absent: 0, ad: 0 };

  // Format time for display (e.g., "10:00 AM")
  const formatTime = (isoTime) => {
    if (!isoTime) return "--";
    const date = new Date(`1970-01-01T${isoTime}`);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  // Get time display for session cards
  const getCurrentSessionTime = () => {
    if (!currentSession) return "No Active Session";
    return `${formatTime(currentSession.start_time)} - ${formatTime(currentSession.end_time)}`;
  };

  const getUpcomingSessionTime = () => {
    if (!upcomingSession) return "No Upcoming Session";
    return `${formatTime(upcomingSession.start_time)} - ${formatTime(upcomingSession.end_time)}`;
  };

  return (
    <div className="faculty-dashboard">
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

          <div className="admin-profile" ref={profileRef} onClick={handleProfileClick}>
            <div className="profile-circle">
              {faculty.full_name?.charAt(0) || "F"}
            </div>
            <span>{faculty.full_name || "Faculty"}</span>
            <span className="dropdown-arrow">{isProfileOpen ? "▲" : "▼"}</span>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <Link 
                  to="/faculty/profile" 
                  className="dropdown-item"
                  onClick={() => handleProfileMenuItemClick("/faculty/profile")}
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
        <aside className="sidebar" aria-label="Faculty navigation">
          <div className="sidebar-title">FACULTY</div>

          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item${item.path === "/faculty/dashboard" ? " active" : ""}`}
            >
              <span className="menu-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </aside>

        <main className="content">
          <div className="page-heading">
            <div>
              <h1>Faculty Dashboard</h1>
              <p>Welcome, {faculty.full_name || "Faculty"}</p>
            </div>
          </div>

          {/* Summary Cards */}
          <section className="stats" aria-label="Dashboard summary">
            <article className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Today's Classes</span>
                <span className="stat-icon" aria-hidden="true">📚</span>
              </div>
              <div className="stat-number">{todaysClassesCount}</div>
              {todaysClassesCount === 0 && <p className="stat-empty">No classes scheduled today</p>}
            </article>

            <article className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Current Session</span>
                <span className="stat-icon" aria-hidden="true">📍</span>
              </div>
              <div className="stat-number session-info">
                {currentSession ? (
                  <>
                    <div className="session-subject">{currentSession.subject}</div>
                    <div className="session-class">{currentSession.class_name}</div>
                    <div className="session-time">{getCurrentSessionTime()}</div>
                    {currentSession.room && <div className="session-room">Room: {currentSession.room}</div>}
                  </>
                ) : (
                  <span className="no-session">No Active Session</span>
                )}
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Upcoming Session</span>
                <span className="stat-icon" aria-hidden="true">⏰</span>
              </div>
              <div className="stat-number session-info">
                {upcomingSession ? (
                  <>
                    <div className="session-subject">{upcomingSession.subject}</div>
                    <div className="session-class">{upcomingSession.class_name}</div>
                    <div className="session-time">{getUpcomingSessionTime()}</div>
                    {upcomingSession.room && <div className="session-room">Room: {upcomingSession.room}</div>}
                  </>
                ) : (
                  <span className="no-session">No Upcoming Session</span>
                )}
                {classTeacher && (
                  <div className="class-teacher-info">
                    <div className="class-teacher-label">Class Teacher:</div>
                    <div className="class-teacher-class">{classTeacher.display}</div>
                  </div>
                )}
              </div>
            </article>
          </section>

          {/* Today's Sessions Table */}
          <section className="card" aria-labelledby="todays-sessions-title">
            <h2 id="todays-sessions-title" className="card-title">
              Today's Sessions
            </h2>
            {todaysSessions.length > 0 ? (
              <div className="table-container">
                <table className="faculty-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Room</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysSessions.map((session) => (
                      <tr key={session.id}>
                        <td>{session.time}</td>
                        <td>{session.class_name}</td>
                        <td>{session.subject}</td>
                        <td>{session.room || "—"}</td>
                        <td>
                          <span className={`status-badge status-${session.status.toLowerCase().replace(" ", "-")}`}>
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No sessions scheduled for today.</p>
            )}
          </section>

          {/* Quick Attendance Status */}
          <section className="card" aria-labelledby="attendance-status-title">
            <h2 id="attendance-status-title" className="card-title">
              Quick Attendance Status
            </h2>
            <div className="attendance-stats-grid">
              <div className="attendance-stat-item">
                <span className="attendance-stat-label">Present</span>
                <span className="attendance-stat-value present">{attendanceStats.present}</span>
              </div>
              <div className="attendance-stat-item">
                <span className="attendance-stat-label">Late</span>
                <span className="attendance-stat-value late">{attendanceStats.late}</span>
              </div>
              <div className="attendance-stat-item">
                <span className="attendance-stat-label">Absent</span>
                <span className="attendance-stat-value absent">{attendanceStats.absent}</span>
              </div>
              <div className="attendance-stat-item">
                <span className="attendance-stat-label">AD</span>
                <span className="attendance-stat-value ad">{attendanceStats.ad}</span>
              </div>
            </div>
            {classTeacher && (
              <div className="class-teacher-section">
                <h3 className="class-teacher-heading">Class Teacher</h3>
                <div className="class-teacher-detail">
                  <div>{classTeacher.course_name}</div>
                  <div>{classTeacher.semester_name}</div>
                  <div>Division {classTeacher.division}</div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default FacultyDashboard;