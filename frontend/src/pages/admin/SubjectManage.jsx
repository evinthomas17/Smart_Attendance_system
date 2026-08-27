import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as subjectService from "../../services/subjectService";
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

function SubjectManage() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState({
    departments: false,
    courses: false,
  });

  const [filters, setFilters] = useState({
    department: "",
    course: "",
  });

  const [error, setError] = useState("");

  function handleError(err, defaultMessage) {
    if (err.response) {
      if (err.response.status === 401) {
        setError("Session expired. Please log in again.");
      } else if (err.response.status === 403) {
        setError("You do not have permission to access this page.");
      } else if (err.response.status === 404) {
        setError("Requested data was not found.");
      } else if (err.response.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(err.response.data?.message || err.response.data?.detail || defaultMessage);
      }
    } else if (err.request) {
      setError("Network error. Please check your connection.");
    } else {
      setError(defaultMessage);
    }
  }

  const fetchDepartments = useCallback(async () => {
    setLoading((prev) => ({ ...prev, departments: true }));
    setError("");
    try {
      const response = await subjectService.getDepartments();
      setDepartments(response.data);
    } catch (err) {
      handleError(err, "Failed to load departments");
    } finally {
      setLoading((prev) => ({ ...prev, departments: false }));
    }
  }, []);

  const fetchCourses = useCallback(async (departmentId) => {
    setLoading((prev) => ({ ...prev, courses: true }));
    setError("");
    try {
      const response = await subjectService.getCourses(departmentId);
      setCourses(response.data);
    } catch (err) {
      handleError(err, "Failed to load courses");
    } finally {
      setLoading((prev) => ({ ...prev, courses: false }));
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (filters.department) {
      fetchCourses(filters.department);
    } else {
      setCourses([]);
      setFilters((prev) => ({ ...prev, course: "" }));
    }
  }, [filters.department, fetchCourses]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddSubjects() {
    if (!filters.department || !filters.course) {
      setError("Please select both Department and Course");
      return;
    }
    const selectedDepartment = departments.find(d => d.id === Number(filters.department));
    const selectedCourse = courses.find(c => c.id === Number(filters.course));
    
    navigate("/admin/subjects/add", {
      state: {
        departmentId: selectedDepartment?.id || "",
        departmentName: selectedDepartment?.name || "",
        courseId: selectedCourse?.id || "",
        courseName: selectedCourse?.name || "",
      },
      replace: true,
    });
  }

  function handleViewUpdateSubjects() {
    if (!filters.department || !filters.course) {
      setError("Please select both Department and Course");
      return;
    }
    const selectedDepartment = departments.find(d => d.id === Number(filters.department));
    const selectedCourse = courses.find(c => c.id === Number(filters.course));
    
    navigate("/admin/subjects/view", {
      state: {
        departmentId: selectedDepartment?.id || "",
        departmentName: selectedDepartment?.name || "",
        courseId: selectedCourse?.id || "",
        courseName: selectedCourse?.name || "",
      },
      replace: true,
    });
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
              className={`menu-item${item.path === "/admin/subjects" ? " active" : ""}`}
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
              <h1>Manage Subject</h1>
              <p>Manage subjects based on department and course</p>
            </div>
          </div>

          {error && (
            <div className="card error-message" style={{ marginBottom: "20px", borderColor: "#ff6b6b", background: "#fff5f5" }}>
              {error}
            </div>
          )}

          <section className="card student-filters" aria-label="Subject academic filters">
            <h2 className="card-title">Select Subject Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  className="filter-input"
                  value={filters.department}
                  onChange={(event) => handleFilterChange("department", event.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="course">Course</label>
                <select
                  id="course"
                  className="filter-input"
                  value={filters.course}
                  disabled={!filters.department || loading.courses}
                  onChange={(event) => handleFilterChange("course", event.target.value)}
                >
                  <option value="">{loading.courses ? "Loading courses..." : "Select Course"}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {filters.department && filters.course && (
            <>
              <section className="card" aria-labelledby="subject-management-title">
                <h2 id="subject-management-title" className="card-title">Subject Management</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                  <button
                    type="button"
                    className="quick-action"
                    onClick={handleAddSubjects}
                    style={{ padding: "30px 20px" }}
                  >
                    <div className="quick-icon" style={{ fontSize: "32px", background: "transparent", width: "auto", height: "auto" }}>
                      📚
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>Add Subjects</h3>
                      <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Add new subjects for the selected course</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={handleViewUpdateSubjects}
                    style={{ padding: "30px 20px" }}
                  >
                    <div className="quick-icon" style={{ fontSize: "32px", background: "transparent", width: "auto", height: "auto" }}>
                      📖
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>View & Update Subjects</h3>
                      <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>View, edit or delete subjects for the selected course</p>
                    </div>
                  </button>
                </div>
              </section>
            </>
          )}

          {!filters.course && filters.department && (
            <section className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#777", fontSize: "15px" }}>
                Select a Course to access Subject Management options
              </p>
            </section>
          )}

          {!filters.department && (
            <section className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#777", fontSize: "15px" }}>
                Select a Department to begin
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default SubjectManage;