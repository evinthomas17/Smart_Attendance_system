import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import FacultyFilters from "../../components/admin/FacultyFilters";
import FacultySearch from "../../components/admin/FacultySearch";
import FacultyTable from "../../components/admin/FacultyTable";
import * as facultyService from "../../services/facultyService";
import * as studentService from "../../services/studentService";
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

function FacultyManage() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);

  const [loading, setLoading] = useState({
    departments: false,
    courses: false,
    faculty: false,
  });

  const [filters, setFilters] = useState({
    department: "",
    course: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debounceTimerRef = useRef(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      const response = await studentService.getDepartments();
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
      const response = await studentService.getCourses(departmentId);
      setCourses(response.data);
    } catch (err) {
      handleError(err, "Failed to load courses");
    } finally {
      setLoading((prev) => ({ ...prev, courses: false }));
    }
  }, []);

  const fetchFaculty = useCallback(async (courseId, search = "", isSearch = false) => {
    if (isSearch) {
      setSearchLoading(true);
    } else {
      setLoading((prev) => ({ ...prev, faculty: true }));
    }
    setError("");
    try {
      const response = await facultyService.getFaculty(courseId, search);
      setFaculty(response.data);
    } catch (err) {
      handleError(err, "Failed to load faculty");
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setLoading((prev) => ({ ...prev, faculty: false }));
      }
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (filters.department) {
      fetchCourses(filters.department);
    } else {
      setCourses([]);
      setFaculty([]);
      setFilters((prev) => ({ ...prev, course: "" }));
    }
  }, [filters.department, fetchCourses]);

  useEffect(() => {
    if (filters.course) {
      fetchFaculty(filters.course, debouncedSearchQuery, false);
    } else {
      setFaculty([]);
    }
  }, [filters.course, fetchFaculty]);

  useEffect(() => {
    if (filters.course) {
      fetchFaculty(filters.course, debouncedSearchQuery, true);
    }
  }, [debouncedSearchQuery, fetchFaculty]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearchChange(value) {
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(value);
    }, 300);
  }

  async function handleDelete(member) {
    const confirmed = window.confirm(
      `Are you sure you want to delete faculty ${member.employee_id} - ${member.full_name}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await facultyService.deleteFaculty(member.id);
      setSuccess("Faculty deleted successfully!");
      setTimeout(() => {
        if (filters.course) {
          fetchFaculty(filters.course, debouncedSearchQuery, false);
        }
      }, 500);
    } catch (err) {
      handleError(err, "Failed to delete faculty");
    }
  }

  function handleEdit(member) {
    const selectedDepartment = departments.find(d => d.id === Number(filters.department));
    const selectedCourse = courses.find(c => c.id === Number(filters.course));
    
    navigate("/admin/faculty/edit", {
      state: {
        facultyId: member.id,
        facultyData: member,
        departmentId: selectedDepartment?.id || "",
        department: selectedDepartment?.name || "",
        course: selectedCourse?.name || "",
      },
      replace: true,
    });
  }

  function handleRegisterFaculty() {
    const selectedDepartment = departments.find(d => d.id === Number(filters.department));
    const selectedCourse = courses.find(c => c.id === Number(filters.course));
    
    navigate("/admin/faculty/register", {
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
              className={`menu-item${item.path === "/admin/faculty" ? " active" : ""}`}
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
              <h1>Manage Faculty</h1>
              <p>Manage faculty based on department and course</p>
            </div>
          </div>

          {error && (
            <div className="card error-message" style={{ marginBottom: "20px", borderColor: "#ff6b6b", background: "#fff5f5" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="card success-message" style={{ marginBottom: "20px", borderColor: "#51cf66", background: "#f3fff3" }}>
              {success}
            </div>
          )}

          <FacultyFilters
            departments={departments}
            courses={courses}
            values={filters}
            loading={loading}
            onChange={handleFilterChange}
          />

          <section className="card" aria-labelledby="faculty-list-title">
            {!filters.course && (
              <p className="student-message" style={{ textAlign: "center", color: "#777", padding: "40px 0" }}>
                Select Department and Course to view faculty
              </p>
            )}

            {filters.course && (
              <>
                <div className="student-list-header">
                  <h2 id="faculty-list-title" className="card-title">Faculty List</h2>
                  <div className="student-list-actions">
                    <button
                      type="button"
                      className="register-button"
                      onClick={handleRegisterFaculty}
                    >
                      + Register Faculty
                    </button>
                  </div>
                </div>

                <FacultySearch
                  value={searchQuery}
                  disabled={searchLoading}
                  onChange={handleSearchChange}
                />

                <FacultyTable
                  faculty={faculty}
                  loading={loading.faculty}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default FacultyManage;