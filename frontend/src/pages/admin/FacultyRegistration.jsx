import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as facultyService from "../../services/facultyService";
import "./FacultyRegistration.css";

const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FacultyRegistration() {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const academicInfoFromState = location.state;

  // Get department and course info from Faculty Manage page
  const academicInfo = academicInfoFromState ? {
    departmentId: academicInfoFromState.departmentId || null,
    departmentName: academicInfoFromState.departmentName || null,
    courseId: academicInfoFromState.courseId || null,
    courseName: academicInfoFromState.courseName || null,
  } : {
    departmentId: null,
    departmentName: null,
    courseId: null,
    courseName: null,
  };

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    department: academicInfo.departmentId || "",
    courses: academicInfo.courseId ? [academicInfo.courseId] : [],
  });

  // Initialize department state from location.state (available at render time)
  const getInitialDepartment = () => {
    if (academicInfo.departmentId) {
      return { id: academicInfo.departmentId, name: academicInfo.departmentName };
    }
    return null;
  };

  const [departments] = useState(() => {
    const dept = getInitialDepartment();
    return dept ? [dept] : [];
  });
  const [courses, setCourses] = useState([]);
  const [selectedDepartment] = useState(getInitialDepartment);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loadingDepartments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(() => !!formData.department);

  // Handle department change - fetch courses when department changes
  const handleDepartmentChange = useCallback((e) => {
    const departmentId = e.target.value;
    setFormData((prev) => ({ ...prev, department: departmentId }));
    setFieldErrors((prev) => {
      if (prev.department) {
        return { ...prev, department: "" };
      }
      return prev;
    });
    
    // Fetch courses for the selected department
    if (departmentId) {
      setLoadingCourses(true);
      facultyService.getCourses(departmentId)
        .then((response) => {
          setCourses(response.data);
        })
        .catch((err) => {
          console.error("Failed to load courses:", err);
        })
        .finally(() => {
          setLoadingCourses(false);
        });
    } else {
      setCourses([]);
      setFormData((prev) => ({ ...prev, courses: [] }));
    }
  }, []);

  // Load courses for the initial department (if coming from Faculty Manage)
  useEffect(() => {
    const departmentId = academicInfo.departmentId;
    if (!departmentId) return;

    let cancelled = false;
    facultyService.getCourses(departmentId)
      .then((response) => {
        if (!cancelled) {
          setCourses(response.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCourses(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [academicInfo.departmentId]);

  const validateField = useCallback((name, value) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };

      switch (name) {
        case "full_name":
          if (!value.trim()) {
            newErrors.full_name = "Faculty Name is required";
          } else {
            delete newErrors.full_name;
          }
          break;
        case "email":
          if (!value.trim()) {
            newErrors.email = "Email is required";
          } else if (!EMAIL_REGEX.test(value)) {
            newErrors.email = "Please enter a valid email address";
          } else {
            delete newErrors.email;
          }
          break;
        case "phone":
          if (!value.trim()) {
            newErrors.phone = "Phone number is required";
          } else if (!PHONE_REGEX.test(value)) {
            newErrors.phone = "Phone number must be exactly 10 digits";
          } else {
            delete newErrors.phone;
          }
          break;
        case "password":
          if (!value) {
            newErrors.password = "Password is required";
          } else if (value.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
          } else {
            delete newErrors.password;
          }
          break;
        case "confirm_password":
          if (!value) {
            newErrors.confirm_password = "Please confirm your password";
          } else {
            delete newErrors.confirm_password;
          }
          break;
        case "courses":
          if (!value || value.length === 0) {
            newErrors.courses = "Please select at least one teaching course";
          } else {
            delete newErrors.courses;
          }
          break;
        default:
          break;
      }

      return newErrors;
    });
    return true;
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Faculty Name is required";
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
      isValid = false;
    }
    if (!formData.courses || formData.courses.length === 0) {
      newErrors.courses = "Please select at least one teaching course";
      isValid = false;
    }

    setFieldErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        department: formData.department,
        courses: formData.courses,
      };

      await facultyService.registerFaculty(data);

      setSuccess("Faculty registered successfully!");
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        department: academicInfo.departmentId || "",
        courses: [],
      });
      setFieldErrors({});

      setTimeout(() => {
        navigate("/admin/faculty", {
          state: {
            department: academicInfo.departmentName,
            course: academicInfo.courseName,
          },
          replace: true,
        });
      }, 1500);

    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          const errorData = err.response.data;
          if (typeof errorData === "object" && errorData !== null) {
            const newErrors = {};
            Object.keys(errorData).forEach((key) => {
              if (Array.isArray(errorData[key])) {
                newErrors[key] = errorData[key][0];
              } else {
                newErrors[key] = errorData[key];
              }
            });
            setFieldErrors(newErrors);
          } else {
            setError(errorData.message || errorData.detail || "Registration failed. Please check your input.");
          }
        } else if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to register faculty.");
        } else {
          setError(err.response.data?.message || err.response.data?.detail || "Registration failed. Please try again.");
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

  const handleClear = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      department: academicInfo.departmentId || "",
      courses: academicInfo.courseId ? [academicInfo.courseId] : [],
    });
    setFieldErrors({});
  };

  const handleGoBack = () => {
    navigate("/admin/faculty", {
      state: {
        department: academicInfo.departmentName,
        course: academicInfo.courseName,
      },
      replace: true,
    });
  };

  // Department is pre-selected and disabled when coming from Faculty Manage
  const isDepartmentFromManage = !!academicInfo.departmentId;

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

          <nav>
            <a href="/admin/dashboard" className="menu-item">
              <span className="menu-icon" aria-hidden="true">🏠</span>
              Dashboard
            </a>
            <a href="/admin/students" className="menu-item">
              <span className="menu-icon" aria-hidden="true">👨‍🎓</span>
              Manage Students
            </a>
            <a href="/admin/faculty" className="menu-item active">
              <span className="menu-icon" aria-hidden="true">👨‍🏫</span>
              Manage Faculty
            </a>
            <a href="/admin/subjects" className="menu-item">
              <span className="menu-icon" aria-hidden="true">📚</span>
              Manage Subjects
            </a>
            <a href="/admin/devices" className="menu-item">
              <span className="menu-icon" aria-hidden="true">📡</span>
              Manage Devices
            </a>
            <a href="/admin/reports" className="menu-item">
              <span className="menu-icon" aria-hidden="true">📊</span>
              Manage Reports
            </a>
            <a href="/admin/timetable" className="menu-item">
              <span className="menu-icon" aria-hidden="true">📅</span>
              Manage Timetable
            </a>
          </nav>

          <button type="button" className="menu-item logout-menu" onClick={() => {
            const shouldLogout = window.confirm("Are you sure you want to logout?");
            if (shouldLogout) {
              ["access", "refresh", "email", "role"].forEach((key) => {
                localStorage.removeItem(key);
              });
              navigate("/login", { replace: true });
            }
          }}>
            <span className="menu-icon" aria-hidden="true">🚪</span>
            Logout
          </button>
        </aside>

        <main className="content">
          <div className="page-heading">
            <div>
              <h1>Register Faculty</h1>
              <p>Enter faculty information and create login password</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGoBack}
              disabled={loading}
            >
              ← Go Back
            </button>
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

          <form onSubmit={handleSubmit}>
            <section className="card faculty-info-card">
              <h2 className="card-title">Faculty Information</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Faculty Name <span className="required">*</span></label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Enter faculty name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className={`filter-input ${fieldErrors.full_name ? "error" : ""}`}
                    disabled={loading}
                  />
                  {fieldErrors.full_name && <p className="field-error">{fieldErrors.full_name}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email <span className="required">*</span></label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`filter-input ${fieldErrors.email ? "error" : ""}`}
                    disabled={loading}
                  />
                  {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`filter-input ${fieldErrors.phone ? "error" : ""}`}
                    disabled={loading}
                    maxLength={10}
                  />
                  {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
                </div>
              </div>
            </section>

            <section className="card academic-info-card">
              <h2 className="card-title">Academic Information</h2>
              <p className="section-description">
                Select the department and course to which the faculty belongs.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department <span className="required">*</span></label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department || ""}
                    onChange={handleDepartmentChange}
                    className={`filter-input ${fieldErrors.department ? "error" : ""}`}
                    disabled={loading || loadingDepartments || isDepartmentFromManage}
                  >
                    <option value="">Select department</option>
                    {loadingDepartments ? (
                      <option value="" disabled>Loading department...</option>
                    ) : (
                      departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))
                    )}
                  </select>
                  {isDepartmentFromManage && selectedDepartment && (
                    <p className="field-hint" style={{ marginTop: "4px", fontSize: "12px", color: "#777" }}>
                      Department is inherited from Faculty Manage page
                    </p>
                  )}
                  {fieldErrors.department && <p className="field-error">{fieldErrors.department}</p>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="courses">Teaching Course <span className="required">*</span></label>
                  <div
                    id="courses"
                    className={`course-checkbox-group ${fieldErrors.courses ? "error" : ""}`}
                    role="group"
                    aria-labelledby="courses-label"
                    aria-describedby={fieldErrors.courses ? "courses-error" : "courses-hint"}
                  >
                    {loadingCourses ? (
                      <p className="course-loading">Loading courses...</p>
                    ) : !formData.department ? (
                      <p className="course-empty">Select a department to load courses</p>
                    ) : courses.length === 0 ? (
                      <p className="course-empty">No courses available for this department</p>
                    ) : (
                      courses.map((course) => (
                        <label key={course.id} className="course-checkbox-label">
                          <input
                            type="checkbox"
                            name="courses"
                            value={course.id}
                            checked={formData.courses.includes(course.id)}
                            onChange={(e) => {
                              setFormData((prev) => {
                                const courseIds = e.target.checked
                                  ? [...prev.courses, course.id]
                                  : prev.courses.filter((id) => id !== course.id);
                                return { ...prev, courses: courseIds };
                              });
                              if (fieldErrors.courses) {
                                setFieldErrors((prev) => ({ ...prev, courses: "" }));
                              }
                            }}
                            disabled={loading}
                            className="course-checkbox-input"
                            id={`course-${course.id}`}
                          />
                          <span className="course-checkbox-text">
                            {course.name} ({course.code})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {fieldErrors.courses && <p id="courses-error" className="field-error">{fieldErrors.courses}</p>}
                  <p id="courses-hint" className="field-hint" style={{ marginTop: "4px", fontSize: "12px", color: "#777" }}>
                    Select one or more teaching courses
                  </p>
                </div>
              </div>
            </section>

            <section className="card password-card">
              <h2 className="card-title">Password</h2>
              <p className="section-description">
                Create a password that the faculty member will use to log in to the system.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password <span className="required">*</span></label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter password (min 6 characters)"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`filter-input ${fieldErrors.password ? "error" : ""}`}
                    disabled={loading}
                  />
                  {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirm_password">Confirm Password <span className="required">*</span></label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className={`filter-input ${fieldErrors.confirm_password ? "error" : ""}`}
                    disabled={loading}
                  />
                  {fieldErrors.confirm_password && <p className="field-error">{fieldErrors.confirm_password}</p>}
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={loading}>
                Clear
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Registering..." : "Register Faculty"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default FacultyRegistration;