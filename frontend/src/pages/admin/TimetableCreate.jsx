import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as timetableService from "../../services/timetableService";
import "../../App.css";
import "./TimetableCreate.css";

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

function TimetableCreate() {
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

  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  const [numberOfPeriods, setNumberOfPeriods] = useState("");
  const [periodErrors, setPeriodErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [timetableData, setTimetableData] = useState([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (academicInfo.classId) {
      setLoadingSubjects(true);
      setLoadingFaculty(true);
      
      timetableService.getClassSubjects(academicInfo.classId)
        .then((response) => {
          setSubjects(response.data);
        })
        .catch((err) => {
          console.error("Failed to load subjects:", err);
          setError("Failed to load subjects for the selected class");
        })
        .finally(() => {
          setLoadingSubjects(false);
        });

      timetableService.getClassFaculty(academicInfo.classId)
        .then((response) => {
          setFaculty(response.data);
        })
        .catch((err) => {
          console.error("Failed to load faculty:", err);
          setError("Failed to load faculty for the selected course");
        })
        .finally(() => {
          setLoadingFaculty(false);
        });
    }
  }, [academicInfo.classId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const count = parseInt(numberOfPeriods, 10);
    if (numberOfPeriods && !isNaN(count) && count >= 1 && count <= 20) {
      const newData = [];
      DAYS.forEach((day) => {
        for (let i = 1; i <= count; i++) {
          newData.push({
            id: `${day}-${i}`,
            day,
            periodNumber: i,
            subject: "",
            faculty: "",
            startTime: "",
            endTime: "",
          });
        }
      });
      setTimetableData(newData);
      setPeriodErrors({});
      setFieldErrors({});
    } else {
      setTimetableData([]);
    }
  }, [numberOfPeriods]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validateNumberOfPeriods = (value) => {
    const count = parseInt(value, 10);
    const newErrors = { ...fieldErrors };

    if (!value || isNaN(count)) {
      newErrors.numberOfPeriods = "Number of periods is required";
      setFieldErrors(newErrors);
      return false;
    }
    if (count < 1 || count > 20) {
      newErrors.numberOfPeriods = "Number of periods must be between 1 and 20";
      setFieldErrors(newErrors);
      return false;
    }
    delete newErrors.numberOfPeriods;
    setFieldErrors(newErrors);
    return true;
  };

  const handleNumberOfPeriodsChange = (e) => {
    const value = e.target.value;
    setNumberOfPeriods(value);
    validateNumberOfPeriods(value);
  };

  const handleSubjectChange = (periodId, value) => {
    const newData = timetableData.map((period) =>
      period.id === periodId ? { ...period, subject: value } : period
    );
    setTimetableData(newData);
    const newErrors = { ...periodErrors };
    delete newErrors[`subject_${periodId}`];
    setPeriodErrors(newErrors);
  };

  const handleFacultyChange = (periodId, value) => {
    const newData = timetableData.map((period) =>
      period.id === periodId ? { ...period, faculty: value } : period
    );
    setTimetableData(newData);
    const newErrors = { ...periodErrors };
    delete newErrors[`faculty_${periodId}`];
    setPeriodErrors(newErrors);
  };

  const handleStartTimeChange = (periodId, value) => {
    const newData = timetableData.map((period) =>
      period.id === periodId ? { ...period, startTime: value } : period
    );
    setTimetableData(newData);
    const newErrors = { ...periodErrors };
    delete newErrors[`time_${periodId}`];
    setPeriodErrors(newErrors);
  };

  const handleEndTimeChange = (periodId, value) => {
    const newData = timetableData.map((period) =>
      period.id === periodId ? { ...period, endTime: value } : period
    );
    setTimetableData(newData);
    const newErrors = { ...periodErrors };
    delete newErrors[`time_${periodId}`];
    setPeriodErrors(newErrors);
  };

  const validateForm = () => {
    let isValid = true;
    const newFieldErrors = { ...fieldErrors };
    const newPeriodErrors = { ...periodErrors };

    if (!academicInfo.departmentId) {
      newFieldErrors.department = "Department is missing. Please go back and select a department.";
      isValid = false;
    }
    if (!academicInfo.courseId) {
      newFieldErrors.course = "Course is missing. Please go back and select a course.";
      isValid = false;
    }
    if (!academicInfo.semesterId) {
      newFieldErrors.semester = "Semester is missing. Please go back and select a semester.";
      isValid = false;
    }
    if (!academicInfo.classId) {
      newFieldErrors.classId = "Division is missing. Please go back and select a division.";
      isValid = false;
    }

    if (!validateNumberOfPeriods(numberOfPeriods)) {
      isValid = false;
    }

    if (timetableData.length === 0 && numberOfPeriods) {
      newPeriodErrors.general = "Please enter a valid number of periods to generate timetable rows.";
      isValid = false;
    }

    timetableData.forEach((period) => {
      if (!period.subject) {
        newPeriodErrors[`subject_${period.id}`] = `Subject is required for ${period.day} Period ${period.periodNumber}`;
        isValid = false;
      }
      if (!period.faculty) {
        newPeriodErrors[`faculty_${period.id}`] = `Faculty is required for ${period.day} Period ${period.periodNumber}`;
        isValid = false;
      }
      if (!period.startTime) {
        newPeriodErrors[`time_${period.id}`] = `Start time is required for ${period.day} Period ${period.periodNumber}`;
        isValid = false;
      }
      if (!period.endTime) {
        newPeriodErrors[`time_${period.id}`] = `End time is required for ${period.day} Period ${period.periodNumber}`;
        isValid = false;
      }
      if (period.startTime && period.endTime && period.startTime >= period.endTime) {
        newPeriodErrors[`time_${period.id}`] = `End time must be after start time for ${period.day} Period ${period.periodNumber}`;
        isValid = false;
      }
    });

    setFieldErrors(newFieldErrors);
    setPeriodErrors(newPeriodErrors);
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
      const academicYear = new Date().getFullYear() + "-" + String(new Date().getFullYear() + 1).slice(-2);

      const periodsData = timetableData.map((period) => ({
        day: period.day,
        period_number: period.periodNumber,
        subject: period.subject,
        faculty: period.faculty,
        start_time: period.startTime,
        end_time: period.endTime,
      }));

      const payload = {
        academic_class: academicInfo.classId,
        academic_year: academicYear,
        number_of_periods: parseInt(numberOfPeriods, 10),
        periods: periodsData,
      };

      await timetableService.createTimetable(payload);

      setSuccess("Timetable created successfully!");

      setTimeout(() => {
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
      }, 1500);

    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          const errorData = err.response.data;
          if (errorData.academic_class) {
            setError(errorData.academic_class);
          } else if (errorData.number_of_periods) {
            setFieldErrors((prev) => ({ ...prev, numberOfPeriods: errorData.number_of_periods }));
            setError("Validation failed. Please check your input.");
          } else if (errorData.periods) {
            setError(errorData.periods);
          } else {
            setError(errorData.message || errorData.detail || "Failed to create timetable. Please check your input.");
          }
        } else if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to create timetables.");
        } else if (err.response.status === 409) {
          setError("A timetable already exists for this class and academic year.");
        } else {
          setError(err.response.data?.message || err.response.data?.detail || "Failed to create timetable. Please try again.");
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
    setNumberOfPeriods("");
    setTimetableData([]);
    setFieldErrors({});
    setPeriodErrors({});
    setError("");
    setSuccess("");
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
            <p>Please select Department, Course, Semester, and Division from the Manage Timetable page before creating a timetable.</p>
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
          The following academic details were selected from Timetable Management and are not manually editable.
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

  const renderTimetableConfig = () => {
    if (!academicInfo.departmentId || !academicInfo.courseId || !academicInfo.semesterId || !academicInfo.classId) {
      return null;
    }

    return (
      <section className="card timetable-config-card">
        <h2 className="card-title">Timetable Configuration</h2>
        <p className="section-description">
          Enter the number of periods per day. This will generate period rows for each day (Monday–Friday).
        </p>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="number-of-periods">Number of Periods <span className="required">*</span></label>
            <input
              id="number-of-periods"
              type="number"
              min="1"
              max="20"
              placeholder="Enter number of periods (1-20)"
              value={numberOfPeriods}
              onChange={handleNumberOfPeriodsChange}
              className={`filter-input ${fieldErrors.numberOfPeriods ? "error" : ""}`}
              disabled={loading}
            />
            {fieldErrors.numberOfPeriods && <p className="field-error">{fieldErrors.numberOfPeriods}</p>}
          </div>
        </div>
        {periodErrors.general && <p className="field-error" style={{ marginTop: "8px" }}>{periodErrors.general}</p>}
      </section>
    );
  };

  const renderWeeklyTimetable = () => {
    if (!academicInfo.departmentId || !academicInfo.courseId || !academicInfo.semesterId || !academicInfo.classId) {
      return null;
    }

    if (timetableData.length === 0) {
      return (
        <section className="card weekly-timetable-card">
          <h2 className="card-title">Weekly Timetable</h2>
          <p className="section-description">
            Enter the number of periods above to generate the timetable grid.
          </p>
          <div className="subject-empty">Timetable will appear here after entering number of periods</div>
        </section>
      );
    }

    const daysData = DAYS.map((day) => ({
      day,
      periods: timetableData.filter((p) => p.day === day),
    }));

    return (
      <section className="card weekly-timetable-card">
        <h2 className="card-title">Weekly Timetable</h2>
        <p className="section-description">
          Configure subjects, faculty, and timings for each period. Use the dropdowns to select from available options.
        </p>
        
        {periodErrors.general && (
          <div className="error-message" style={{ marginBottom: "16px" }}>
            {periodErrors.general}
          </div>
        )}

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
                    {dayData.periods.map((period) => (
                      <tr key={period.id}>
                        <td className="period-cell">Period {period.periodNumber}</td>
                        <td>
                          <select
                            value={period.subject}
                            onChange={(e) => handleSubjectChange(period.id, e.target.value)}
                            className={`timetable-select ${periodErrors[`subject_${period.id}`] ? "error" : ""}`}
                            disabled={loading || loadingSubjects}
                          >
                            <option value="">Select Subject</option>
                            {loadingSubjects ? (
                              <option value="" disabled>Loading subjects...</option>
                            ) : subjects.length === 0 ? (
                              <option value="" disabled>No subjects available for this class</option>
                            ) : (
                              subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name} ({subject.code})
                                </option>
                              ))
                            )}
                          </select>
                          {periodErrors[`subject_${period.id}`] && (
                            <p className="field-error">{periodErrors[`subject_${period.id}`]}</p>
                          )}
                        </td>
                        <td>
                          <select
                            value={period.faculty}
                            onChange={(e) => handleFacultyChange(period.id, e.target.value)}
                            className={`timetable-select ${periodErrors[`faculty_${period.id}`] ? "error" : ""}`}
                            disabled={loading || loadingFaculty}
                          >
                            <option value="">Select Faculty</option>
                            {loadingFaculty ? (
                              <option value="" disabled>Loading faculty...</option>
                            ) : faculty.length === 0 ? (
                              <option value="" disabled>No faculty assigned to this course</option>
                            ) : (
                              faculty.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.full_name} ({f.employee_id})
                                </option>
                              ))
                            )}
                          </select>
                          {periodErrors[`faculty_${period.id}`] && (
                            <p className="field-error">{periodErrors[`faculty_${period.id}`]}</p>
                          )}
                        </td>
                        <td>
                          <input
                            type="time"
                            value={period.startTime}
                            onChange={(e) => handleStartTimeChange(period.id, e.target.value)}
                            className={`timetable-time-input ${periodErrors[`time_${period.id}`] ? "error" : ""}`}
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            value={period.endTime}
                            onChange={(e) => handleEndTimeChange(period.id, e.target.value)}
                            className={`timetable-time-input ${periodErrors[`time_${period.id}`] ? "error" : ""}`}
                            disabled={loading}
                          />
                          {periodErrors[`time_${period.id}`] && (
                            <p className="field-error">{periodErrors[`time_${period.id}`]}</p>
                          )}
                        </td>
                      </tr>
                    ))}
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
              <h1>Create Timetable</h1>
              <p>Create a weekly timetable for the selected class</p>
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

          {renderTimetableConfig()}

          {renderWeeklyTimetable()}

          {academicInfo.departmentId && academicInfo.courseId && academicInfo.semesterId && academicInfo.classId && timetableData.length > 0 && (
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={loading}>
                Clear
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save Timetable"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default TimetableCreate;