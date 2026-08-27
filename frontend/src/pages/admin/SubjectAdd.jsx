import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as subjectService from "../../services/subjectService";
import "./SubjectAdd.css";

function SubjectAdd() {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const academicInfoFromState = location.state;

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

  const [semesters, setSemesters] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const [subjectCount, setSubjectCount] = useState("");
  const [subjectFields, setSubjectFields] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedSemester, setSelectedSemester] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (academicInfo.courseId) {
      setLoadingSemesters(true);
      subjectService.getSemesters(academicInfo.courseId)
        .then((response) => {
          setSemesters(response.data);
        })
        .catch((err) => {
          console.error("Failed to load semesters:", err);
          setError("Failed to load semesters for the selected course");
        })
        .finally(() => {
          setLoadingSemesters(false);
        });
    }
  }, [academicInfo.courseId]);

  useEffect(() => {
    const count = parseInt(subjectCount, 10);
    if (subjectCount && !isNaN(count) && count >= 1 && count <= 30) {
      const newFields = Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: "",
      }));
      setSubjectFields(newFields);
    } else {
      setSubjectFields([]);
    }
    setFieldErrors({});
  }, [subjectCount]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validateSubjectCount = (value) => {
    const count = parseInt(value, 10);
    const newErrors = { ...fieldErrors };
    
    if (!value || isNaN(count)) {
      newErrors.subjectCount = "Number of subjects is required";
      setFieldErrors(newErrors);
      return false;
    }
    if (count < 1 || count > 30) {
      newErrors.subjectCount = "Number of subjects must be between 1 and 30";
      setFieldErrors(newErrors);
      return false;
    }
    delete newErrors.subjectCount;
    setFieldErrors(newErrors);
    return true;
  };

  const handleSubjectCountChange = (e) => {
    const value = e.target.value;
    setSubjectCount(value);
    validateSubjectCount(value);
  };

  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    if (fieldErrors.semester) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.semester;
        return newErrors;
      });
    }
  };

  const handleClear = () => {
    setSubjectCount("");
    setSelectedSemester("");
    setSubjectFields([]);
    setFieldErrors({});
  };

  const validateSubjectName = (index, value) => {
    const trimmed = value.trim();
    const newErrors = { ...fieldErrors };
    const fieldKey = `subject_${index}`;

    if (!trimmed) {
      newErrors[fieldKey] = `Subject ${index + 1} name is required`;
      setFieldErrors(newErrors);
      return false;
    }

    const duplicateIndex = subjectFields.findIndex(
      (f, i) => i !== index && f.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicateIndex !== -1) {
      newErrors[fieldKey] = `Subject ${index + 1} name is a duplicate (case-insensitive)`;
      setFieldErrors(newErrors);
      return false;
    }

    delete newErrors[fieldKey];
    setFieldErrors(newErrors);
    return true;
  };

  const handleSubjectNameChange = (index, e) => {
    const value = e.target.value;
    const newFields = [...subjectFields];
    newFields[index] = { ...newFields[index], name: value };
    setSubjectFields(newFields);
    validateSubjectName(index, value);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!academicInfo.departmentId) {
      newErrors.department = "Department is missing. Please go back and select a department.";
      isValid = false;
    }
    if (!academicInfo.courseId) {
      newErrors.course = "Course is missing. Please go back and select a course.";
      isValid = false;
    }

    if (!selectedSemester) {
      newErrors.semester = "Please select a semester";
      isValid = false;
    }

    if (!validateSubjectCount(subjectCount)) {
      isValid = false;
    }

    subjectFields.forEach((field, index) => {
      if (!validateSubjectName(index, field.name)) {
        isValid = false;
      }
    });

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
      const subjectsData = subjectFields.map((field, index) => ({
        name: field.name.trim(),
        code: `${academicInfo.courseName?.substring(0, 3).toUpperCase()}${String(index + 1).padStart(3, '0')}`,
        course: academicInfo.courseId,
        semester: selectedSemester,
        credits: 3,
      }));

      await subjectService.createSubjects(subjectsData);

      setSuccess("Subjects saved successfully!");

      setTimeout(() => {
        navigate("/admin/subjects", {
          state: {
            departmentId: academicInfo.departmentId,
            departmentName: academicInfo.departmentName,
            courseId: academicInfo.courseId,
            courseName: academicInfo.courseName,
          },
          replace: true,
        });
      }, 1500);

    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          const errorData = err.response.data;
          if (Array.isArray(errorData)) {
            const newErrors = {};
            errorData.forEach((subjectError, index) => {
              if (typeof subjectError === "object" && subjectError !== null) {
                Object.keys(subjectError).forEach((key) => {
                  if (Array.isArray(subjectError[key])) {
                    newErrors[`subject_${index}_${key}`] = subjectError[key][0];
                  } else {
                    newErrors[`subject_${index}_${key}`] = subjectError[key];
                  }
                });
              }
            });
            setFieldErrors(newErrors);
            if (Object.keys(newErrors).length === 0) {
              setError("Validation failed. Please check your input.");
            }
          } else if (typeof errorData === "object" && errorData !== null) {
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
            setError(errorData.message || errorData.detail || "Failed to save subjects. Please check your input.");
          }
        } else if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to add subjects.");
        } else if (err.response.status === 409) {
          setError("One or more subjects already exist. Please check for duplicates.");
        } else {
          setError(err.response.data?.message || err.response.data?.detail || "Failed to save subjects. Please try again.");
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
    navigate("/admin/subjects", {
      state: {
        departmentId: academicInfo.departmentId,
        departmentName: academicInfo.departmentName,
        courseId: academicInfo.courseId,
        courseName: academicInfo.courseName,
      },
      replace: true,
    });
  };

  const renderAcademicInfo = () => {
    if (!academicInfo.departmentId || !academicInfo.courseId) {
      return (
        <div className="alert-card">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h3>Academic Information Missing</h3>
            <p>Please select Department and Course from the Manage Subject page before adding subjects.</p>
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
          The following academic details were selected from Subject Management and are not manually editable.
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
              <h1>Add Subjects</h1>
              <p>Add new subjects for the selected course</p>
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

          <section className="card semester-selection-card">
                <h2 className="card-title">Semester Selection</h2>
                <p className="section-description">
                  Select the semester for which subjects are being added.
                </p>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="semester">Semester <span className="required">*</span></label>
                    <select
                      id="semester"
                      value={selectedSemester}
                      onChange={handleSemesterChange}
                      className={`filter-input ${fieldErrors.semester ? "error" : ""}`}
                      disabled={loading || loadingSemesters}
                      required
                    >
                      <option value="">Select semester</option>
                      {loadingSemesters ? (
                        <option value="" disabled>Loading semesters...</option>
                      ) : semesters.length === 0 ? (
                        <option value="" disabled>No semesters available for this course</option>
                      ) : (
                        semesters.map((semester) => (
                          <option key={semester.id} value={semester.id}>
                            {semester.name}
                          </option>
                        ))
                      )}
                    </select>
                    {fieldErrors.semester && <p className="field-error">{fieldErrors.semester}</p>}
                  </div>
                </div>
              </section>

          {academicInfo.departmentId && academicInfo.courseId && (
            <form onSubmit={handleSubmit}>
              <section className="card subject-count-card">
                <h2 className="card-title">Subject Details</h2>
                <p className="section-description">
                  Enter the number of subjects to add, then provide each subject name.
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="subject-count">Number of Subjects <span className="required">*</span></label>
                    <input
                      id="subject-count"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="Enter number of subjects (1-30)"
                      value={subjectCount}
                      onChange={handleSubjectCountChange}
                      className={`filter-input ${fieldErrors.subjectCount ? "error" : ""}`}
                      disabled={loading}
                    />
                    {fieldErrors.subjectCount && <p className="field-error">{fieldErrors.subjectCount}</p>}
                  </div>
                </div>
              </section>

              

              <section className="card subject-fields-card">
                <h2 className="card-title">Subject Names</h2>
                <p className="section-description">
                  Enter unique names for each subject. Duplicate names (case-insensitive) are not allowed.
                </p>
                <div className="subject-fields-container">
                  {subjectFields.map((field, index) => (
                    <div key={index} className="subject-field-row">
                      <div className="form-group subject-name-group">
                        <label htmlFor={`subject-${index}`}>Subject {index + 1} <span className="required">*</span></label>
                        <input
                          id={`subject-${index}`}
                          type="text"
                          placeholder="Enter subject name"
                          value={field.name}
                          onChange={(e) => handleSubjectNameChange(index, e)}
                          className={`filter-input ${fieldErrors[`subject_${index}`] ? "error" : ""}`}
                          disabled={loading}
                          autoComplete="off"
                        />
                        {fieldErrors[`subject_${index}`] && <p className="field-error">{fieldErrors[`subject_${index}`]}</p>}
                      </div>
                    </div>
                  ))}
                  {subjectFields.length === 0 && (
                    <p className="subject-empty">Enter a number of subjects above to generate fields</p>
                  )}
                </div>
              </section>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={loading}>
                  Clear
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Subjects"}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

export default SubjectAdd;