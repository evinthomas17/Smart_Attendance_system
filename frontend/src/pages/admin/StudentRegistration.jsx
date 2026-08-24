import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as studentService from "../../services/studentService";
import "./StudentRegistration.css";

const FACE_TYPES = [
  { key: "front_face", label: "Front Face", instruction: "Look directly at the camera" },
  { key: "left_face", label: "Left Face", instruction: "Turn your face slightly to the left" },
  { key: "right_face", label: "Right Face", instruction: "Turn your face slightly to the right" },
];

const PHONE_REGEX = /^[\d\s\-+()]{10,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StudentRegistration() {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const academicInfoFromState = location.state;

  const academicInfo = academicInfoFromState ? {
    department: academicInfoFromState.department || null,
    course: academicInfoFromState.course || null,
    semester: academicInfoFromState.semester || null,
    division: academicInfoFromState.division || null,
    classId: academicInfoFromState.classId || null,
    classCode: academicInfoFromState.classCode || null,
  } : {
    department: null,
    course: null,
    semester: null,
    division: null,
    classId: null,
    classCode: null,
  };

  const [formData, setFormData] = useState({
    student_id: "",
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    password: "",
    confirm_password: "",
  });

  const [faceImages, setFaceImages] = useState({
    front_face: null,
    left_face: null,
    right_face: null,
  });

  const [facePreviews, setFacePreviews] = useState({
    front_face: null,
    left_face: null,
    right_face: null,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [faceErrors, setFaceErrors] = useState({});

  const validateField = useCallback((name, value) => {
    const newErrors = { ...fieldErrors };

    switch (name) {
      case "student_id":
        if (!value.trim()) {
          newErrors.student_id = "Student ID is required";
        }
        break;
      case "full_name":
        if (!value.trim()) {
          newErrors.full_name = "Full Name is required";
        }
        break;
      case "email":
        if (!value.trim()) {
          newErrors.email = "Email is required";
        } else if (!EMAIL_REGEX.test(value)) {
          newErrors.email = "Please enter a valid email address";
        }
        break;
      case "phone":
        if (!value.trim()) {
          newErrors.phone = "Phone number is required";
        } else if (!PHONE_REGEX.test(value)) {
          newErrors.phone = "Please enter a valid phone number";
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else if (value.length < 8) {
          newErrors.password = "Password must be at least 8 characters";
        }
        break;
      case "confirm_password":
        if (!value) {
          newErrors.confirm_password = "Please confirm your password";
        }
        break;
      case "date_of_birth":
        if (value) {
          const selectedDate = new Date(value);
          const today = new Date();
          if (selectedDate > today) {
            newErrors.date_of_birth = "Date of birth cannot be in the future";
          }
        }
        break;
      default:
        break;
    }

    setFieldErrors(newErrors);
    return !newErrors[name];
  }, [fieldErrors]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleFaceImageChange = (faceType, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFaceErrors((prev) => ({ ...prev, [faceType]: "Please upload a valid image (JPG, PNG, or WebP)" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFaceErrors((prev) => ({ ...prev, [faceType]: "Image size must be less than 5MB" }));
      return;
    }

    setFaceImages((prev) => ({ ...prev, [faceType]: file }));
    setFaceErrors((prev) => ({ ...prev, [faceType]: "" }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setFacePreviews((prev) => ({ ...prev, [faceType]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const clearFaceImage = (faceType) => {
    setFaceImages((prev) => ({ ...prev, [faceType]: null }));
    setFacePreviews((prev) => ({ ...prev, [faceType]: null }));
    setFaceErrors((prev) => ({ ...prev, [faceType]: "" }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.student_id.trim()) {
      newErrors.student_id = "Student ID is required";
      isValid = false;
    }
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full Name is required";
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
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
      isValid = false;
    }

    FACE_TYPES.forEach(({ key }) => {
      if (!faceImages[key]) {
        newErrors[key] = `${key.replace("_face", "").replace("_", " ")} image is required`;
        isValid = false;
      }
    });

    if (!academicInfo.classId) {
      newErrors.classId = "Please select a class first";
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
      const data = new FormData();

      data.append("student_id", formData.student_id);
      data.append("full_name", formData.full_name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("password", formData.password);
      data.append("confirm_password", formData.confirm_password);
      data.append("class_group", academicInfo.classId);
      data.append("enrollment_date", new Date().toISOString().split("T")[0]);

      if (formData.date_of_birth) {
        data.append("date_of_birth", formData.date_of_birth);
      }
      if (formData.gender) {
        data.append("gender", formData.gender);
      }

      FACE_TYPES.forEach(({ key }) => {
        if (faceImages[key]) {
          data.append(key, faceImages[key]);
        }
      });

      await studentService.registerStudentWithFace(data);

      setSuccess("Student registered successfully!");
      setFormData({
        student_id: "",
        full_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        password: "",
        confirm_password: "",
      });
      setFaceImages({ front_face: null, left_face: null, right_face: null });
      setFacePreviews({ front_face: null, left_face: null, right_face: null });
      setFieldErrors({});
      setFaceErrors({});

      setTimeout(() => {
        navigate("/admin/students", {
          state: {
            department: academicInfo.department,
            course: academicInfo.course,
            semester: academicInfo.semester,
            division: academicInfo.division,
            classId: academicInfo.classId,
            classCode: academicInfo.classCode,
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

            FACE_TYPES.forEach(({ key }) => {
              if (errorData[key]) {
                setFaceErrors((prev) => ({
                  ...prev,
                  [key]: Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key],
                }));
              }
            });
          } else {
            setError(errorData.message || errorData.detail || "Registration failed. Please check your input.");
          }
        } else if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to register students.");
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

  const handleCancel = () => {
    navigate("/admin/students", {
      state: {
        department: academicInfo.department,
        course: academicInfo.course,
        semester: academicInfo.semester,
        division: academicInfo.division,
        classId: academicInfo.classId,
        classCode: academicInfo.classCode,
      },
      replace: true,
    });
  };

  const handleGoBack = () => {
    handleCancel();
  };

  const renderAcademicInfo = () => {
    if (!academicInfo.classId) {
      return (
        <div className="alert-card">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h3>No Class Selected</h3>
            <p>Please select Department, Course, Semester and Division from the Manage Students page before registering a student.</p>
            <button type="button" className="btn btn-secondary" onClick={handleGoBack}>
              ← Go Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <section className="card academic-info-card">
        <h2 className="card-title">Selected Academic Information</h2>
        <p className="section-description">
          The following academic details were selected from Student Management and are not manually editable.
        </p>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="academic-department">Department</label>
            <input
              id="academic-department"
              type="text"
              value={academicInfo.department || ""}
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
              value={academicInfo.course || ""}
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
              value={academicInfo.semester || ""}
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
          <div className="form-group full-width">
            <label htmlFor="academic-class-data">Class Data</label>
            <input
              id="academic-class-data"
              type="text"
              value={academicInfo.classCode || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
        </div>
      </section>
    );
  };

  const renderFaceUploadSection = () => (
    <section className="card face-registration-card">
      <h2 className="card-title">Face Registration</h2>
      <p className="face-instruction">
        Use clear images with good lighting and only one person's face visible.
      </p>
      <div className="face-upload-grid">
        {FACE_TYPES.map(({ key, label, instruction }) => (
          <div key={key} className="face-upload-card">
            <h3 className="face-upload-title">{label}</h3>
            <p className="face-upload-hint">{instruction}</p>

            <div className="face-preview-wrapper">
              {facePreviews[key] ? (
                <img
                  src={facePreviews[key]}
                  alt={`${label} preview`}
                  className="face-preview-image"
                />
              ) : (
                <div className="face-preview-placeholder">
                  <span className="preview-icon">📷</span>
                  <span>No image selected</span>
                </div>
              )}
            </div>

            <div className="face-upload-actions">
              <label htmlFor={key} className="btn btn-outline choose-image-btn">
                {facePreviews[key] ? "Replace" : "Choose Image"}
                <input
                  id={key}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleFaceImageChange(key, e)}
                  disabled={loading}
                  style={{ display: "none" }}
                />
              </label>
              {facePreviews[key] && (
                <button
                  type="button"
                  className="btn btn-danger clear-image-btn"
                  onClick={() => clearFaceImage(key)}
                  disabled={loading}
                >
                  Clear
                </button>
              )}
            </div>

            {faceErrors[key] && (
              <p className="field-error face-error">{faceErrors[key]}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );

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
            <a href="/admin/students" className="menu-item active">
              <span className="menu-icon" aria-hidden="true">👨‍🎓</span>
              Manage Students
            </a>
            <a href="/admin/faculty" className="menu-item">
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
              <h1>Register Student</h1>
              <p>Enter student details and facial information</p>
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

          {renderAcademicInfo()}

          {academicInfo.classId && (
            <form onSubmit={handleSubmit}>
              <section className="card student-info-card">
                <h2 className="card-title">Student Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="student_id">Student ID <span className="required">*</span></label>
                    <input
                      id="student_id"
                      name="student_id"
                      type="text"
                      placeholder="Enter student ID"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      className={`filter-input ${fieldErrors.student_id ? "error" : ""}`}
                      disabled={loading}
                    />
                    {fieldErrors.student_id && <p className="field-error">{fieldErrors.student_id}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="full_name">Full Name <span className="required">*</span></label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="Enter full name"
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
                    />
                    {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="date_of_birth">Date of Birth</label>
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className={`filter-input ${fieldErrors.date_of_birth ? "error" : ""}`}
                      disabled={loading}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    {fieldErrors.date_of_birth && <p className="field-error">{fieldErrors.date_of_birth}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="filter-input"
                      disabled={loading}
                    >
                      <option value="">Select gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="card password-card">
                <h2 className="card-title">Account Credentials</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password <span className="required">*</span></label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter password (min 8 characters)"
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

              {renderFaceUploadSection()}

              <div className="form-actions">
                
                <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Registering..." : "Register Student"}
                </button>
              </div>
            </form>
          )}

        </main>
      </div>
    </div>
  );
}

export default StudentRegistration;