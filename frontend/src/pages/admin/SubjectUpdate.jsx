import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as subjectService from "../../services/subjectService";
import "../../App.css";

function SubjectUpdate() {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const academicInfoFromState = location.state;

  const academicInfo = academicInfoFromState ? {
    subjectId: academicInfoFromState.subjectId || null,
    subjectName: academicInfoFromState.subjectName || null,
    departmentId: academicInfoFromState.departmentId || null,
    departmentName: academicInfoFromState.departmentName || null,
    courseId: academicInfoFromState.courseId || null,
    courseName: academicInfoFromState.courseName || null,
    semesterId: academicInfoFromState.semesterId || null,
    semesterName: academicInfoFromState.semesterName || null,
  } : {
    subjectId: null,
    subjectName: null,
    departmentId: null,
    departmentName: null,
    courseId: null,
    courseName: null,
    semesterId: null,
    semesterName: null,
  };

  const [subjectName, setSubjectName] = useState(academicInfo.subjectName || "");
  const [fieldErrors, setFieldErrors] = useState({});

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (academicInfo.subjectName) {
      setSubjectName(academicInfo.subjectName);
    }
  }, [academicInfo.subjectName]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validateSubjectName = (value) => {
    const trimmed = value.trim();
    const newErrors = { ...fieldErrors };

    if (!trimmed) {
      newErrors.subjectName = "Subject name is required";
      setFieldErrors(newErrors);
      return false;
    }

    setFieldErrors(newErrors);
    return true;
  };

  const handleSubjectNameChange = (e) => {
    const value = e.target.value;
    setSubjectName(value);
    validateSubjectName(value);
  };

  const handleClear = () => {
    setSubjectName("");
    setFieldErrors({});
  };

  const validateForm = () => {
    return validateSubjectName(subjectName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    if (!academicInfo.subjectId) {
      setError("Subject ID is missing. Please go back and try again.");
      return;
    }

    setLoading(true);

    try {
      await subjectService.updateSubject(academicInfo.subjectId, {
        name: subjectName.trim(),
      });

      setSuccess("Subject updated successfully!");

      setTimeout(() => {
        navigate("/admin/subjects/view", {
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
            setError(errorData.message || errorData.detail || "Failed to update subject. Please check your input.");
          }
        } else if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to update subjects.");
        } else if (err.response.status === 404) {
          setError("Subject not found.");
        } else if (err.response.status === 409) {
          setError("A subject with this name already exists in this semester.");
        } else {
          setError(err.response.data?.message || err.response.data?.detail || "Failed to update subject. Please try again.");
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

  const handleGoBack = () => {
    navigate("/admin/subjects/view", {
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
    if (!academicInfo.departmentId || !academicInfo.courseId || !academicInfo.semesterId) {
      return (
        <div className="alert-card">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h3>Academic Information Missing</h3>
            <p>Please select Department, Course, and Semester from the Subject View page before editing a subject.</p>
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
          The following academic details are from the selected subject and cannot be changed.
        </p>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="edit-academic-department">Department</label>
            <input
              id="edit-academic-department"
              type="text"
              value={academicInfo.departmentName || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-academic-course">Course</label>
            <input
              id="edit-academic-course"
              type="text"
              value={academicInfo.courseName || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-academic-semester">Semester</label>
            <input
              id="edit-academic-semester"
              type="text"
              value={academicInfo.semesterName || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
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

          <nav>
            <a href="/admin/dashboard" className="menu-item">
              <span className="menu-icon" aria-hidden="true">🏠</span>
              Dashboard
            </a>
            <a href="/admin/students" className="menu-item">
              <span className="menu-icon" aria-hidden="true">👨‍🎓</span>
              Manage Students
            </a>
            <a href="/admin/faculty" className="menu-item">
              <span className="menu-icon" aria-hidden="true">👨‍🏫</span>
              Manage Faculty
            </a>
            <a href="/admin/subjects" className="menu-item active">
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
              <h1>Edit Subject</h1>
              <p>Update the subject details</p>
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

          {academicInfo.departmentId && academicInfo.courseId && academicInfo.semesterId && academicInfo.subjectId && (
            <form onSubmit={handleSubmit}>
              <section className="card subject-info-card">
                <h2 className="card-title">Subject Information</h2>
                <p className="section-description">
                  Update the subject name. Department, Course, and Semester cannot be changed.
                </p>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="subject-name">Subject Name <span className="required">*</span></label>
                    <input
                      id="subject-name"
                      type="text"
                      placeholder="Enter subject name"
                      value={subjectName}
                      onChange={handleSubjectNameChange}
                      className={`filter-input ${fieldErrors.subjectName ? "error" : ""}`}
                      disabled={loading}
                      autoComplete="off"
                    />
                    {fieldErrors.subjectName && <p className="field-error">{fieldErrors.subjectName}</p>}
                  </div>
                </div>
              </section>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={loading}>
                  Clear
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

export default SubjectUpdate;