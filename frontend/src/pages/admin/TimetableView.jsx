import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as timetableService from "../../services/timetableService";
import "../../App.css";
import "./TimetableView.css";

const navigationItems = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Manage Students", icon: "👨‍🎓", path: "/admin/students" },
  { label: "Manage Faculty", icon: "👨‍🏫", path: "/admin/faculty" },
  { label: "Manage Subjects", icon: "📚", path: "/admin/subjects" },
  { label: "Manage Devices", icon: "📡", path: "/admin/devices" },
  { label: "Manage Reports", icon: "📊", path: "/admin/reports" },
  { label: "Manage Timetable", icon: "📅", path: "/admin/timetable" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TABS = [
  { id: "PERMANENT", label: "Permanent", icon: "📋" },
  { id: "TEMPORARY", label: "Temporary", icon: "⏱️" },
  { id: "ARCHIVE", label: "Archives", icon: "🗄️" },
];

function TimetableView() {
  const navigate = useNavigate();
  const location = useLocation();

  const academicInfoFromState = location.state;

  const academicInfo = academicInfoFromState ? {
    departmentId: academicInfoFromState.departmentId || null,
    departmentName: academicInfoFromState.departmentName || null,
    courseId: academicInfoFromState.courseId || null,
    courseName: academicInfoFromState.courseName || null,
    semesterId: academicInfoFromState.semesterId || null,
    semesterName: academicInfoFromState.semesterName || null,
    classId: academicInfoFromState.classId || null,
    division: academicInfoFromState.division || null,
    classCode: academicInfoFromState.classCode || null,
  } : {
    departmentId: null,
    departmentName: null,
    courseId: null,
    courseName: null,
    semesterId: null,
    semesterName: null,
    classId: null,
    division: null,
    classCode: null,
  };

  const [activeTab, setActiveTab] = useState("PERMANENT");
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (academicInfo.classId) {
      fetchTimetables();
    } else {
      setTimetables([]);
      setSelectedTimetable(null);
    }
  }, [academicInfo.classId, activeTab]);

  const fetchTimetables = async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      if (activeTab === "ARCHIVE") {
        response = await timetableService.getArchivedTimetables(academicInfo.classId);
      } else {
        response = await timetableService.getTimetables(academicInfo.classId, activeTab);
      }
      const data = response.data || [];
      setTimetables(data);
      if (data.length > 0 && !selectedTimetable) {
        await fetchTimetableDetail(data[0].id);
      } else if (data.length === 0) {
        setSelectedTimetable(null);
      }
    } catch (err) {
      console.error("Failed to load timetables:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to view timetables.");
        } else if (err.response.status === 404) {
          setError("Timetables not found.");
        } else {
          setError(err.response.data?.message || err.response.data?.detail || "Failed to load timetables.");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetableDetail = async (timetableId) => {
    try {
      const response = await timetableService.getTimetable(timetableId);
      setSelectedTimetable(response.data);
    } catch (err) {
      console.error("Failed to load timetable detail:", err);
      setError("Failed to load timetable details.");
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedTimetable(null);
  };

  const handleTimetableSelect = async (timetable) => {
    await fetchTimetableDetail(timetable.id);
  };

  const handleGoBack = () => {
    navigate("/admin/timetable", {
      state: {
        departmentId: academicInfo.departmentId,
        departmentName: academicInfo.departmentName,
        courseId: academicInfo.courseId,
        courseName: academicInfo.courseName,
        semesterId: academicInfo.semesterId,
        semesterName: academicInfo.semesterName,
      },
      replace: true,
    });
  };

  const renderAcademicInfo = () => {
    if (!academicInfo.departmentId || !academicInfo.courseId || !academicInfo.semesterId || !academicInfo.classId) {
      return (
        <div className="card alert-card">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h3>Academic Information Missing</h3>
            <p>Please select Department, Course, Semester, and Division from the Manage Timetable page before viewing a timetable.</p>
            <button type="button" className="btn btn-secondary" onClick={handleGoBack}>
              ← Go Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <section className="card academic-info-card">
        <h2 className="card-title">Academic Information</h2>
        <p className="section-description">
          The following academic details were selected from Timetable Management.
        </p>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="academic-department">Department</label>
            <input
              id="academic-department"
              type="text"
              value={academicInfo.departmentName || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="academic-course">Course</label>
            <input
              id="academic-course"
              type="text"
              value={academicInfo.courseName || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="academic-semester">Semester</label>
            <input
              id="academic-semester"
              type="text"
              value={academicInfo.semesterName || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="academic-division">Division</label>
            <input
              id="academic-division"
              type="text"
              value={academicInfo.division || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
        </div>
      </section>
    );
  };

  const renderTabList = () => {
    return (
      <div className="tab-list" role="tablist" aria-label="Timetable types">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count">{timetables.filter(t => t.timetable_type === tab.id || (tab.id === "ARCHIVE" && t.is_archived)).length}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderTimetableList = () => {
    if (!academicInfo.departmentId || !academicInfo.courseId || !academicInfo.semesterId || !academicInfo.classId) {
      return null;
    }

    if (loading) {
      return (
        <section className="card timetable-list-card">
          <div className="loading">Loading timetables...</div>
        </section>
      );
    }

    if (timetables.length === 0) {
      return (
        <section className="card timetable-list-card">
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === "PERMANENT" ? "📋" : activeTab === "TEMPORARY" ? "⏱️" : "🗄️"}
            </div>
            <h3>No {activeTab.toLowerCase()} timetables found</h3>
            <p>
              {activeTab === "PERMANENT"
                ? "Create a permanent timetable for this class."
                : activeTab === "TEMPORARY"
                ? "Create a temporary timetable with validity dates."
                : "Archived timetables will appear here when temporary timetables expire."}
            </p>
          </div>
        </section>
      );
    }

    return (
      <section className="card timetable-list-card">
        <div className="timetable-list">
          {timetables.map((timetable) => (
            <div
              key={timetable.id}
              className={`timetable-item ${selectedTimetable?.id === timetable.id ? "selected" : ""}`}
              onClick={() => handleTimetableSelect(timetable)}
            >
              <div className="timetable-item-header">
                <div className="timetable-type-badge">{timetable.timetable_type}</div>
                <div className="timetable-year">{timetable.academic_year}</div>
              </div>
              <div className="timetable-item-details">
                <span>Periods/day: {timetable.number_of_periods}</span>
                {timetable.timetable_type === "TEMPORARY" && timetable.valid_from && timetable.valid_until && (
                  <span>Valid: {timetable.valid_from} to {timetable.valid_until}</span>
                )}
                {timetable.is_archived && timetable.archived_at && (
                  <span className="archived-badge">Archived: {new Date(timetable.archived_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderTimetableDetail = () => {
    if (!academicInfo.departmentId || !academicInfo.courseId || !academicInfo.semesterId || !academicInfo.classId) {
      return null;
    }

    if (loading && !selectedTimetable) {
      return (
        <section className="card weekly-timetable-card">
          <div className="loading">Loading timetable...</div>
        </section>
      );
    }

    if (!selectedTimetable) {
      return (
        <section className="card weekly-timetable-card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Select a timetable</h3>
            <p>Click on a timetable from the list to view its details</p>
          </div>
        </section>
      );
    }

    const timetable = selectedTimetable;
    const periods = timetable.periods || [];
    const daysData = DAYS.map((day) => ({
      day,
      periods: periods.filter((p) => p.day === day).sort((a, b) => a.period_number - b.period_number),
    }));

    return (
      <section className="card weekly-timetable-card">
        <div className="timetable-header">
          <h2 className="card-title">Weekly Timetable</h2>
          <div className="timetable-meta">
            <span className={`type-badge ${(timetable.timetable_type || "").toLowerCase()}`}>{timetable.timetable_type || "N/A"}</span>
            <span>Academic Year: {timetable.academic_year}</span>
            <span>Periods/day: {timetable.number_of_periods}</span>
            {timetable.timetable_type === "TEMPORARY" && timetable.valid_from && timetable.valid_until && (
              <span className="validity-badge">Valid: {timetable.valid_from} to {timetable.valid_until}</span>
            )}
            {timetable.is_archived && timetable.archived_at && (
              <span className="archived-badge">Archived on: {new Date(timetable.archived_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className="timetable-container">
          {daysData.map((dayData) => (
            <div key={dayData.day} className="day-table-wrapper">
              <h3 className="day-heading">{dayData.day}</h3>
              <div className="table-scroll-wrapper">
                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Period</th>
                      <th>Subject</th>
                      <th>Faculty</th>
                      <th style={{ width: "120px" }}>Start Time</th>
                      <th style={{ width: "120px" }}>End Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayData.periods.length > 0 ? (
                      dayData.periods.map((period) => (
                        <tr key={period.id}>
                          <td className="period-cell">Period {period.period_number}</td>
                          <td>
                            {period.subject_name} {period.subject_code && `(${period.subject_code})`}
                          </td>
                          <td>
                            {period.faculty_name} {period.faculty_employee_id && `(${period.faculty_employee_id})`}
                          </td>
                          <td>{period.start_time}</td>
                          <td>{period.end_time}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                          No periods scheduled for this day
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

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
            <a
              key={item.path}
              href={item.path}
              className={`menu-item${item.path === "/admin/timetable" ? " active" : ""}`}
            >
              <span className="menu-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </a>
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
              <h1>View Timetable</h1>
              <p>View Permanent, Temporary & Archived timetables for the selected class</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGoBack}
            >
              ← Go Back
            </button>
          </div>

          {error && (
            <div className="card error-message" style={{ marginBottom: "20px", borderColor: "#ff6b6b", background: "#fff5f5" }}>
              {error}
            </div>
          )}

          {renderAcademicInfo()}

          {academicInfo.departmentId && academicInfo.courseId && academicInfo.semesterId && academicInfo.classId && (
            <div className="timetable-view-layout">
              <aside className="timetable-sidebar">
                {renderTabList()}
                {renderTimetableList()}
              </aside>
              <div className="timetable-main">
                {renderTimetableDetail()}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default TimetableView;