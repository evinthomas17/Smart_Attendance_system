import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as timetableService from "../../services/timetableService";
import "../../App.css";
import "./TimetableCreate.css";
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
];

function TimetableUpdate() {
  const navigate = useNavigate();
  const location = useLocation();

  const academicInfoFromState = location.state;

  const initialAcademicInfo = academicInfoFromState ? {
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

  const [timetableType, setTimetableType] = useState("PERMANENT");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [numberOfPeriods, setNumberOfPeriods] = useState("");
  const [periodErrors, setPeriodErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [timetableId, setTimetableId] = useState(null);

  const [timetableData, setTimetableData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  const [activeTab, setActiveTab] = useState("PERMANENT");
  const [allTimetables, setAllTimetables] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Locked academic info from the selected timetable (read-only)
  const [lockedAcademicInfo, setLockedAcademicInfo] = useState(null);

  const [originalTimetable, setOriginalTimetable] = useState(null);
  const timetableDataRef = useRef([]);

  const fetchAllTimetables = useCallback(async () => {
    const classId = academicInfoFromState?.classId;
    if (!classId) return;
    
    setLoadingTimetable(true);
    setError("");
    try {
      const response = await timetableService.getTimetables(classId);
      const timetables = response.data || [];
      setAllTimetables(timetables);
    } catch (err) {
      console.error("Failed to load timetables:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to view timetables.");
        } else {
          setError(err.response.data?.message || err.response.data?.detail || "Failed to load timetables.");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoadingTimetable(false);
    }
  }, [academicInfoFromState?.classId]);

const loadSubjectsAndFaculty = useCallback(async (classId) => {
    const cid = classId || lockedAcademicInfo?.academic_class_id || academicInfoFromState?.classId;
    if (!cid) {
      setSubjects([]);
      setFaculty([]);
      return;
    }
    
    setLoadingSubjects(true);
    setLoadingFaculty(true);
    try {
      const [subjectsRes, facultyRes] = await Promise.all([
        timetableService.getClassSubjects(cid),
        timetableService.getClassFaculty(cid),
      ]);
      setSubjects(subjectsRes.data);
      setFaculty(facultyRes.data);
    } catch (err) {
      console.error("Failed to load subjects/faculty:", err);
      setSubjects([]);
      setFaculty([]);
    } finally {
      setLoadingSubjects(false);
      setLoadingFaculty(false);
    }
  }, [lockedAcademicInfo?.academic_class_id, academicInfoFromState?.classId]);

  useEffect(() => {
    if (academicInfoFromState?.classId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAllTimetables();
    }
  }, [academicInfoFromState?.classId, fetchAllTimetables]);

  const loadTimetableForEdit = async (timetable) => {
    setLoadingTimetable(true);
    setError("");
    try {
      // Fetch FULL timetable detail with periods from API
      const response = await timetableService.getTimetable(timetable.id);
      const t = response.data;
      setOriginalTimetable(t);
      setTimetableId(t.id);
      setTimetableType(t.timetable_type);
      setNumberOfPeriods(t.number_of_periods.toString());
      if (t.valid_from) setValidFrom(t.valid_from);
      if (t.valid_until) setValidUntil(t.valid_until);

      // Populate locked academic info from the timetable's academic_class data
      setLockedAcademicInfo({
        academic_class_id: t.academic_class_id || null,
        departmentName: t.department_name || null,
        courseName: t.course_name || null,
        semesterName: t.semester_name || null,
        division: t.division || null,
        academic_class_code: t.academic_class_code || null,
      });

      await loadSubjectsAndFaculty(t.academic_class_id);

      const periodsData = [];
      DAYS.forEach((day) => {
        for (let i = 1; i <= t.number_of_periods; i++) {
          const period = t.periods?.find(p => p.day === day && p.period_number === i);
          periodsData.push({
            id: `${day}-${i}`,
            day,
            periodNumber: i,
            subject: period?.subject ? String(period.subject) : "",
            subjectName: period?.subject_name || "",
            subjectCode: period?.subject_code || "",
            faculty: period?.faculty ? String(period.faculty) : "",
            facultyName: period?.faculty_name || "",
            facultyEmployeeId: period?.faculty_employee_id || "",
            startTime: period?.start_time ? period.start_time.slice(0, 5) : "",
            endTime: period?.end_time ? period.end_time.slice(0, 5) : "",
          });
        }
      });
      // Keep the synchronization effect aligned with the freshly loaded rows.
      timetableDataRef.current = periodsData;
      setTimetableData(periodsData);
      setIsEditing(true);
    } catch (err) {
      console.error("Failed to load timetable:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to view timetables.");
        } else {
          setError(err.response.data?.message || err.response.data?.detail || "Failed to load timetable.");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoadingTimetable(false);
    }
  };

  const handleBackToList = () => {
    setIsEditing(false);
    setTimetableId(null);
    setTimetableData([]);
    setOriginalTimetable(null);
    setLockedAcademicInfo(null);
    setError("");
    setPeriodErrors({});
    setFieldErrors({});
  };

  // Helper function to handle subject change
  const handleSubjectChange = (periodId, value) => {
    const subjectMatch = subjects.find(s => String(s.id) === value);
    const newData = timetableData.map((period) =>
      period.id === periodId
        ? {
            ...period,
            subject: value,
            subjectName: subjectMatch?.name || "",
            subjectCode: subjectMatch?.code || "",
          }
        : period
    );
    setTimetableData(newData);
    const newErrors = { ...periodErrors };
    delete newErrors[`subject_${periodId}`];
    setPeriodErrors(newErrors);
  };

  // Helper function to handle faculty change
  const handleFacultyChange = (periodId, value) => {
    const facultyMatch = faculty.find(f => String(f.id) === value);
    const newData = timetableData.map((period) =>
      period.id === periodId
        ? {
            ...period,
            faculty: value,
            facultyName: facultyMatch?.full_name || "",
            facultyEmployeeId: facultyMatch?.employee_id || "",
          }
        : period
    );
    setTimetableData(newData);
    const newErrors = { ...periodErrors };
    delete newErrors[`faculty_${periodId}`];
    setPeriodErrors(newErrors);
  };

  // Helper function to handle start time change
  const handleStartTimeChange = (periodId, value) => {
    const newData = timetableData.map((period) =>
      period.id === periodId ? { ...period, startTime: value } : period
    );
    setTimetableData(newData);
    const newErrors = { ...periodErrors };
    delete newErrors[`time_${periodId}`];
    setPeriodErrors(newErrors);
  };

  // Helper function to handle end time change
  const handleEndTimeChange = (periodId, value) => {
    const newData = timetableData.map((period) =>
      period.id === periodId ? { ...period, endTime: value } : period
    );
    setTimetableData(newData);
    const newErrors = { ...periodErrors };
    delete newErrors[`time_${periodId}`];
    setPeriodErrors(newErrors);
  };

  useEffect(() => {
    // Only auto-generate rows when NOT editing an existing timetable
    // When editing, the timetable data is loaded from the API and should not be regenerated
    if (numberOfPeriods && !loadingTimetable && !isEditing) {
      const count = parseInt(numberOfPeriods, 10);
      if (!isNaN(count) && count >= 1 && count <= 20) {
        const existingData = timetableDataRef.current;
        const newData = [];
        DAYS.forEach((day) => {
          for (let i = 1; i <= count; i++) {
            const existing = existingData.find(p => p.day === day && p.periodNumber === i);
            newData.push({
              id: `${day}-${i}`,
              day,
              periodNumber: i,
              subject: existing?.subject || "",
              subjectName: existing?.subjectName || "",
              subjectCode: existing?.subjectCode || "",
              faculty: existing?.faculty || "",
              facultyName: existing?.facultyName || "",
              facultyEmployeeId: existing?.facultyEmployeeId || "",
              startTime: existing?.startTime || "",
              endTime: existing?.endTime || "",
            });
          }
        });
        setTimetableData(newData);
        setPeriodErrors({});
      } else {
        setTimetableData([]);
      }
    }
  }, [numberOfPeriods, loadingTimetable, isEditing]);

  useEffect(() => {
    timetableDataRef.current = timetableData;
  }, [timetableData]);

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

  const validateForm = () => {
    let isValid = true;
    const newFieldErrors = { ...fieldErrors };
    const newPeriodErrors = { ...periodErrors };

    // Validate locked academic info is present
    if (!initialAcademicInfo?.departmentName) {
      newFieldErrors.department = "Department is required.";
      isValid = false;
    }
    if (!initialAcademicInfo?.courseName) {
      newFieldErrors.course = "Course is required.";
      isValid = false;
    }
    if (!initialAcademicInfo?.semesterName) {
      newFieldErrors.semester = "Semester is required.";
      isValid = false;
    }
    if (!initialAcademicInfo?.division) {
      newFieldErrors.classId = "Division is required.";
      isValid = false;
    }

    if (timetableType === "TEMPORARY") {
      if (!validFrom) {
        newFieldErrors.validFrom = "Valid from date is required for temporary timetables.";
        isValid = false;
      }
      if (!validUntil) {
        newFieldErrors.validUntil = "Valid until date is required for temporary timetables.";
        isValid = false;
      }
      if (validFrom && validUntil && new Date(validFrom) >= new Date(validUntil)) {
        newFieldErrors.validUntil = "Valid until must be after valid from date.";
        isValid = false;
      }
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

    if (!timetableId) {
      setError("No timetable selected for update.");
      return;
    }

    if (!lockedAcademicInfo?.academic_class_id) {
      setError("Division is required.");
      return;
    }

    setLoading(true);

    try {
      // Use the original timetable's academic_year to preserve it
      const academicYear = originalTimetable?.academic_year || (new Date().getFullYear() + "-" + String(new Date().getFullYear() + 1).slice(-2));

      const periodsData = timetableData.map((period) => ({
        day: period.day,
        period_number: period.periodNumber,
        subject: period.subject,
        faculty: period.faculty,
        start_time: period.startTime,
        end_time: period.endTime,
      }));

      const payload = {
        academic_class: lockedAcademicInfo?.academic_class_id,
        academic_year: academicYear,
        number_of_periods: parseInt(numberOfPeriods, 10),
        timetable_type: timetableType,
        periods: periodsData,
      };

      if (timetableType === "TEMPORARY") {
        payload.valid_from = validFrom;
        payload.valid_until = validUntil;
      }

      await timetableService.updateTimetable(timetableId, payload);

      setSuccess("Timetable updated successfully!");

      setTimeout(() => {
        fetchAllTimetables();
        handleBackToList();
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
          } else if (errorData.valid_from) {
            setFieldErrors((prev) => ({ ...prev, validFrom: errorData.valid_from }));
            setError("Validation failed. Please check your input.");
          } else if (errorData.valid_until) {
            setFieldErrors((prev) => ({ ...prev, validUntil: errorData.valid_until }));
            setError("Validation failed. Please check your input.");
          } else if (errorData.periods) {
            setError(errorData.periods);
          } else if (errorData.detail && errorData.detail.includes("archived")) {
            setError("Cannot update archived timetable.");
          } else {
            setError(errorData.message || errorData.detail || "Failed to update timetable. Please check your input.");
          }
        } else if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to update timetables.");
        } else if (err.response.status === 404) {
          setError("Timetable not found.");
        } else {
          setError(err.response.data?.message || err.response.data?.detail || "Failed to update timetable. Please try again.");
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

  const handleDelete = async () => {
    if (!timetableId) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this timetable? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setLoading(true);
    setError("");

    try {
      await timetableService.deleteTimetable(timetableId);
      setSuccess("Timetable deleted successfully!");
      fetchAllTimetables();
      handleBackToList();
    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          setError(err.response.data?.detail || err.response.data?.message || "Cannot delete this timetable.");
        } else if (err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response.status === 403) {
          setError("You do not have permission to delete timetables.");
        } else if (err.response.status === 404) {
          setError("Timetable not found.");
        } else {
          setError(err.response.data?.message || err.response.data?.detail || "Failed to delete timetable.");
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
    navigate("/admin/timetable", {
      state: {
        departmentId: initialAcademicInfo.departmentId,
        departmentName: initialAcademicInfo.departmentName,
        courseId: initialAcademicInfo.courseId,
        courseName: initialAcademicInfo.courseName,
        semesterId: initialAcademicInfo.semesterId,
        semesterName: initialAcademicInfo.semesterName,
      },
      replace: true,
    });
  };

  const renderAcademicInfo = () => {
    // Use academic info from the Manage page state (initialAcademicInfo)
    const academicInfo = initialAcademicInfo;

    if (!academicInfo.departmentName || !academicInfo.courseName || !academicInfo.semesterName || !academicInfo.division) {
      return (
        <div className="card alert-card">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h3>Academic Information Missing</h3>
            <p>Please select Department, Course, Semester, and Division from the Manage Timetable page before updating a timetable.</p>
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
          Academic details for this timetable. These fields are locked and cannot be edited.
        </p>
        <div className="form-row">
          <div className="form-group">
            <label>Department <span className="required">*</span></label>
            <span className="filter-input" readOnly>{academicInfo.departmentName || ""}</span>
          </div>
          <div className="form-group">
            <label>Course <span className="required">*</span></label>
            <span className="filter-input" readOnly>{academicInfo.courseName || ""}</span>
          </div>
          <div className="form-group">
            <label>Semester <span className="required">*</span></label>
            <span className="filter-input" readOnly>{academicInfo.semesterName || ""}</span>
          </div>
          <div className="form-group">
            <label>Division <span className="required">*</span></label>
            <span className="filter-input" readOnly>{academicInfo.division || ""}</span>
          </div>
        </div>
      </section>
    );
  };

  const renderTabList = () => {
    if (!initialAcademicInfo.departmentId || !initialAcademicInfo.courseId || !initialAcademicInfo.semesterId || !initialAcademicInfo.classId) {
      return null;
    }

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
            onClick={() => {
              setActiveTab(tab.id);
              handleBackToList();
            }}
            disabled={isEditing}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count">
              {allTimetables.filter(t => t.timetable_type === tab.id).length}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderTimetableList = () => {
    if (!initialAcademicInfo.departmentId || !initialAcademicInfo.courseId || !initialAcademicInfo.semesterId || !initialAcademicInfo.classId) {
      return null;
    }

    if (loadingTimetable && !isEditing) {
      return (
        <section className="card timetable-list-card">
          <div className="loading">Loading timetables...</div>
        </section>
      );
    }

    const filteredTimetables = allTimetables.filter(t => t.timetable_type === activeTab);

    if (filteredTimetables.length === 0 && !isEditing) {
      return (
        <section className="card timetable-list-card">
          <div className="empty-state">
            <div className="empty-icon">{activeTab === "PERMANENT" ? "📋" : "⏱️"}</div>
            <h3>No {activeTab.toLowerCase()} timetables found</h3>
            <p>
              {activeTab === "PERMANENT"
                ? "Create a permanent timetable for this class."
                : "Create a temporary timetable with validity dates."}
            </p>
          </div>
        </section>
      );
    }

    if (!isEditing) {
      return (
        <section className="card timetable-list-card">
          <div className="timetable-list">
            {filteredTimetables.map((timetable) => (
              <div
                key={timetable.id}
                className="timetable-item"
                onClick={() => loadTimetableForEdit(timetable)}
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
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  const renderTimetableConfig = () => {
    if (!initialAcademicInfo.departmentId || !initialAcademicInfo.courseId || !initialAcademicInfo.semesterId || !initialAcademicInfo.classId) {
      return null;
    }

    if (!isEditing) {
      return null;
    }

    return (
      <section className="card timetable-config-card">
        <h2 className="card-title">Timetable Configuration</h2>
        <p className="section-description">
          Update the timetable type and configure the number of periods per day.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>Timetable Type <span className="required">*</span></label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="timetableType"
                  value="PERMANENT"
                  checked={timetableType === "PERMANENT"}
                  onChange={(e) => setTimetableType(e.target.value)}
                  disabled={loading}
                />
                <span className="radio-text">Permanent</span>
                <span className="radio-desc">Regular academic timetable (no expiry)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="timetableType"
                  value="TEMPORARY"
                  checked={timetableType === "TEMPORARY"}
                  onChange={(e) => setTimetableType(e.target.value)}
                  disabled={loading}
                />
                <span className="radio-text">Temporary</span>
                <span className="radio-desc">Timetable with validity period (e.g., faculty replacement, special events)</span>
              </label>
            </div>
          </div>
        </div>

        {timetableType === "TEMPORARY" && (
          <div className="form-row" style={{ marginTop: "16px" }}>
            <div className="form-group">
              <label htmlFor="valid-from">Valid From <span className="required">*</span></label>
              <input
                id="valid-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className={`filter-input ${fieldErrors.validFrom ? "error" : ""}`}
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
              {fieldErrors.validFrom && <p className="field-error">{fieldErrors.validFrom}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="valid-until">Valid Until <span className="required">*</span></label>
              <input
                id="valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={`filter-input ${fieldErrors.validUntil ? "error" : ""}`}
                disabled={loading}
                min={validFrom || new Date().toISOString().split("T")[0]}
              />
              {fieldErrors.validUntil && <p className="field-error">{fieldErrors.validUntil}</p>}
            </div>
          </div>
        )}

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
    if (!initialAcademicInfo.departmentId || !initialAcademicInfo.courseId || !initialAcademicInfo.semesterId || !initialAcademicInfo.classId) {
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
                                <option key={subject.id} value={String(subject.id)}>
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
                                <option key={f.id} value={String(f.id)}>
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
              <h1>Update Timetable</h1>
              <p>Select a timetable to update or delete</p>
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

          {initialAcademicInfo.departmentId && initialAcademicInfo.courseId && initialAcademicInfo.semesterId && initialAcademicInfo.classId && (
            <>
              {!isEditing && (
                <div className="timetable-view-layout">
                  <aside className="timetable-sidebar">
                    {renderTabList()}
                    {renderTimetableList()}
                  </aside>
                  <div className="timetable-main">
                    <section className="card" style={{ padding: "40px", textAlign: "center" }}>
                      <div className="empty-icon" style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                      <h3>Select a Timetable</h3>
                      <p style={{ color: "#777" }}>Click on a timetable from the list to edit or delete it</p>
                    </section>
                  </div>
                </div>
              )}

              {isEditing && (
                <>
                  {renderTimetableConfig()}
                  {renderWeeklyTimetable()}
                  {timetableData.length > 0 && (
                    <div className="form-actions">
                      <button type="button" className="btn btn-secondary" onClick={handleBackToList} disabled={loading}>
                        ← Back to List
                      </button>
                      <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                        Delete
                      </button>
                      <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Saving..." : "Update Timetable"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default TimetableUpdate;