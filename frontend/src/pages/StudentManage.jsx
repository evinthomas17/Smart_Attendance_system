import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentFilters from "../components/admin/StudentFilters";
import StudentSearch from "../components/admin/StudentSearch";
import StudentTable from "../components/admin/StudentTable";
import * as studentService from "../services/studentService";
import "../App.css";

const navigationItems = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Manage Students", icon: "👨‍🎓", path: "/admin/students" },
  { label: "Manage Faculty", icon: "👨‍🏫", path: "/admin/faculty" },
  { label: "Manage Subjects", icon: "📚", path: "/admin/subjects" },
  { label: "Manage Devices", icon: "📡", path: "/admin/devices" },
  { label: "Manage Reports", icon: "📊", path: "/admin/reports" },
  { label: "Manage Timetable", icon: "📅", path: "/admin/timetable" },
];

function StudentManage() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState({
    departments: false,
    courses: false,
    semesters: false,
    classes: false,
    students: false,
  });

  const [filters, setFilters] = useState({
    department: "",
    course: "",
    semester: "",
    classId: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
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

  const fetchSemesters = useCallback(async (courseId) => {
    setLoading((prev) => ({ ...prev, semesters: true }));
    setError("");
    try {
      const response = await studentService.getSemesters(courseId);
      setSemesters(response.data);
    } catch (err) {
      handleError(err, "Failed to load semesters");
    } finally {
      setLoading((prev) => ({ ...prev, semesters: false }));
    }
  }, []);

  const fetchClasses = useCallback(async (courseId, semesterId) => {
    setLoading((prev) => ({ ...prev, classes: true }));
    setError("");
    try {
      const response = await studentService.getClasses(courseId, semesterId);
      setClasses(response.data);
    } catch (err) {
      handleError(err, "Failed to load divisions");
    } finally {
      setLoading((prev) => ({ ...prev, classes: false }));
    }
  }, []);

  const fetchStudents = useCallback(async (classId, search = "") => {
    setLoading((prev) => ({ ...prev, students: true }));
    setError("");
    try {
      const response = await studentService.getStudents(classId, search);
      setStudents(response.data);
    } catch (err) {
      handleError(err, "Failed to load students");
    } finally {
      setLoading((prev) => ({ ...prev, students: false }));
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
      setSemesters([]);
      setClasses([]);
      setStudents([]);
      setFilters((prev) => ({ ...prev, course: "", semester: "", classId: "" }));
    }
  }, [filters.department, fetchCourses]);

  useEffect(() => {
    if (filters.course) {
      fetchSemesters(filters.course);
    } else {
      setSemesters([]);
      setClasses([]);
      setStudents([]);
      setFilters((prev) => ({ ...prev, semester: "", classId: "" }));
    }
  }, [filters.course, fetchSemesters]);

  useEffect(() => {
    if (filters.semester) {
      fetchClasses(filters.course, filters.semester);
    } else {
      setClasses([]);
      setStudents([]);
      setFilters((prev) => ({ ...prev, classId: "" }));
    }
  }, [filters.semester, filters.course, fetchClasses]);

  useEffect(() => {
    if (filters.classId) {
      fetchStudents(filters.classId, searchQuery);
    } else {
      setStudents([]);
    }
  }, [filters.classId, searchQuery, fetchStudents]);
/* eslint-enable react-hooks/set-state-in-effect */

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearchChange(value) {
    setSearchQuery(value);
  }

  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Are you sure you want to delete student ${student.student_id} - ${student.full_name}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      // Note: DELETE endpoint not implemented in backend yet
      setError("Delete functionality is not available yet. Backend DELETE endpoint not implemented.");
    } catch (err) {
      handleError(err, "Failed to delete student");
    }
  }

  function handleEdit(studentId) {
    alert(`Student Update will be implemented next. Student ID: ${studentId}`);
  }

  function handleRegisterStudent() {
    alert("Student Registration will be implemented next.");
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
              className={`menu-item${item.path === "/admin/students" ? " active" : ""}`}
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
              <h1>Manage Students</h1>
              <p>Manage students based on department, course, semester and division</p>
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

          <section className="card student-filters" aria-label="Academic filters">
            <h2 className="card-title">Select Academic Details</h2>
            <StudentFilters
              departments={departments}
              courses={courses}
              semesters={semesters}
              classes={classes}
              values={filters}
              loading={loading}
              onChange={handleFilterChange}
            />
          </section>

          <section className="card" aria-labelledby="student-list-title">
            {!filters.classId && (
              <p className="student-message" style={{ textAlign: "center", color: "#777", padding: "40px 0" }}>
                Select Department, Course, Semester, and Division to view students
              </p>
            )}

            {filters.classId && (
              <>
                <div className="student-list-header">
                  <h2 id="student-list-title" className="card-title">Student List</h2>
                  <div className="student-list-actions">
                    <StudentSearch
                      value={searchQuery}
                      disabled={loading.students}
                      onChange={handleSearchChange}
                    />
                    <button
                      type="button"
                      className="register-button"
                      onClick={handleRegisterStudent}
                    >
                      + Register Student
                    </button>
                  </div>
                </div>

                <StudentTable
                  students={students}
                  loading={loading.students}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default StudentManage;