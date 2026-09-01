import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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

function TimetableManage() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState({
    departments: false,
    courses: false,
    semesters: false,
    classes: false,
  });

  const [filters, setFilters] = useState({
    department: "",
    course: "",
    semester: "",
    classId: "",
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
      setFilters((prev) => ({ ...prev, course: "", semester: "", classId: "" }));
    }
  }, [filters.department, fetchCourses]);

  useEffect(() => {
    if (filters.course) {
      fetchSemesters(filters.course);
    } else {
      setSemesters([]);
      setClasses([]);
      setFilters((prev) => ({ ...prev, semester: "", classId: "" }));
    }
  }, [filters.course, fetchSemesters]);

  useEffect(() => {
    if (filters.semester) {
      fetchClasses(filters.course, filters.semester);
    } else {
      setClasses([]);
      setFilters((prev) => ({ ...prev, classId: "" }));
    }
  }, [filters.semester, filters.course, fetchClasses]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleViewTimetable() {
    if (!filters.department || !filters.course || !filters.semester || !filters.classId) {
      setError("Please select Department, Course, Semester, and Division");
      return;
    }
    const selectedDepartment = departments.find(d => d.id === Number(filters.department));
    const selectedCourse = courses.find(c => c.id === Number(filters.course));
    const selectedSemester = semesters.find(s => s.id === Number(filters.semester));
    const selectedClass = classes.find(c => c.id === Number(filters.classId));
    
    navigate("/admin/timetable/view", {
      state: {
        departmentId: selectedDepartment?.id || "",
        departmentName: selectedDepartment?.name || "",
        courseId: selectedCourse?.id || "",
        courseName: selectedCourse?.name || "",
        semesterId: selectedSemester?.id || "",
        semesterName: selectedSemester?.name || "",
        classId: selectedClass?.id || "",
        division: selectedClass?.division || "",
        classCode: selectedClass?.class_code || "",
      },
      replace: true,
    });
  }

  function handleCreateTimetable() {
    if (!filters.department || !filters.course || !filters.semester || !filters.classId) {
      setError("Please select Department, Course, Semester, and Division");
      return;
    }
    const selectedDepartment = departments.find(d => d.id === Number(filters.department));
    const selectedCourse = courses.find(c => c.id === Number(filters.course));
    const selectedSemester = semesters.find(s => s.id === Number(filters.semester));
    const selectedClass = classes.find(c => c.id === Number(filters.classId));
    
    navigate("/admin/timetable/create", {
      state: {
        departmentId: selectedDepartment?.id || "",
        departmentName: selectedDepartment?.name || "",
        courseId: selectedCourse?.id || "",
        courseName: selectedCourse?.name || "",
        semesterId: selectedSemester?.id || "",
        semesterName: selectedSemester?.name || "",
        classId: selectedClass?.id || "",
        division: selectedClass?.division || "",
        classCode: selectedClass?.class_code || "",
      },
      replace: true,
    });
  }

  function handleUpdateTimetable() {
    if (!filters.department || !filters.course || !filters.semester || !filters.classId) {
      setError("Please select Department, Course, Semester, and Division");
      return;
    }
    const selectedDepartment = departments.find(d => d.id === Number(filters.department));
    const selectedCourse = courses.find(c => c.id === Number(filters.course));
    const selectedSemester = semesters.find(s => s.id === Number(filters.semester));
    const selectedClass = classes.find(c => c.id === Number(filters.classId));
    
    navigate("/admin/timetable/update", {
      state: {
        departmentId: selectedDepartment?.id || "",
        departmentName: selectedDepartment?.name || "",
        courseId: selectedCourse?.id || "",
        courseName: selectedCourse?.name || "",
        semesterId: selectedSemester?.id || "",
        semesterName: selectedSemester?.name || "",
        classId: selectedClass?.id || "",
        division: selectedClass?.division || "",
        classCode: selectedClass?.class_code || "",
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
              className={`menu-item${item.path === "/admin/timetable" ? " active" : ""}`}
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
              <h1>Manage Timetable</h1>
              <p>Manage timetable based on department, course, semester and division</p>
            </div>
          </div>

          {error && (
            <div className="card error-message" style={{ marginBottom: "20px", borderColor: "#ff6b6b", background: "#fff5f5" }}>
              {error}
            </div>
          )}

          <section className="card student-filters" aria-label="Academic filters">
            <h2 className="card-title">Select Academic Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  className="filter-input"
                  value={filters.department}
                  onChange={(event) => handleFilterChange("department", event.target.value)}
                >
                  <option value="">Select department</option>
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
                  <option value="">{loading.courses ? "Loading courses..." : "Select course"}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="semester">Semester</label>
                <select
                  id="semester"
                  className="filter-input"
                  value={filters.semester}
                  disabled={!filters.course || loading.semesters}
                  onChange={(event) => handleFilterChange("semester", event.target.value)}
                >
                  <option value="">{loading.semesters ? "Loading semesters..." : "Select semester"}</option>
                  {semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="division">Division</label>
                <select
                  id="division"
                  className="filter-input"
                  value={filters.classId}
                  disabled={!filters.semester || loading.classes}
                  onChange={(event) => handleFilterChange("classId", event.target.value)}
                >
                  <option value="">{loading.classes ? "Loading divisions..." : "Select division"}</option>
                  {classes.map((academicClass) => (
                    <option key={academicClass.id} value={academicClass.id}>
                      {academicClass.division}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {filters.department && filters.course && filters.semester && filters.classId && (
            <section className="card" aria-labelledby="timetable-management-title">
              <h2 id="timetable-management-title" className="card-title">Timetable Management</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>

              <button
                  type="button"
                  className="quick-action"
                  onClick={handleCreateTimetable}
                  style={{ padding: "30px 20px" }}
                >
                  <div className="quick-icon" style={{ fontSize: "32px", background: "transparent", width: "auto", height: "auto" }}>
                    ➕
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>Create Timetable</h3>
                    <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Create a new timetable for the selected academic combination</p>
                  </div>
                </button>
                
                <button
                  type="button"
                  className="quick-action"
                  onClick={handleViewTimetable}
                  style={{ padding: "30px 20px" }}
                >
                  <div className="quick-icon" style={{ fontSize: "32px", background: "transparent", width: "auto", height: "auto" }}>
                    👁️
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>View Timetable</h3>
                    <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>View the timetable for the selected class</p>
                  </div>
                </button>

                

                <button
                  type="button"
                  className="quick-action"
                  onClick={handleUpdateTimetable}
                  style={{ padding: "30px 20px" }}
                >
                  <div className="quick-icon" style={{ fontSize: "32px", background: "transparent", width: "auto", height: "auto" }}>
                    ✏️
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>Update Timetable</h3>
                    <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Modify an existing timetable for the selected class</p>
                  </div>
                </button>
              </div>
            </section>
          )}

          {!filters.classId && filters.semester && (
            <section className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#777", fontSize: "15px" }}>
                Select a Division to access Timetable Management options
              </p>
            </section>
          )}

          {!filters.semester && filters.course && (
            <section className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#777", fontSize: "15px" }}>
                Select a Semester to continue
              </p>
            </section>
          )}

          {!filters.course && filters.department && (
            <section className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#777", fontSize: "15px" }}>
                Select a Course to continue
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

export default TimetableManage;