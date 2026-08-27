import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as subjectService from "../../services/subjectService";
import "../../App.css";

function SubjectView() {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

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

  const [selectedSemester, setSelectedSemester] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

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

  const fetchSemesters = useCallback(async () => {
    if (!academicInfo.courseId) return;
    
    setLoadingSemesters(true);
    setError("");
    try {
      const response = await subjectService.getSemesters(academicInfo.courseId);
      setSemesters(response.data);
    } catch (err) {
      handleError(err, "Failed to load semesters");
    } finally {
      setLoadingSemesters(false);
    }
  }, [academicInfo.courseId]);

  const fetchSubjects = useCallback(async (courseId, semesterId, search = "", isSearch = false) => {
    if (!courseId || !semesterId) {
      setSubjects([]);
      return;
    }
    
    if (isSearch) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }
    setError("");
    
    try {
      const response = await subjectService.getSubjects(courseId, semesterId, search);
      setSubjects(response.data);
    } catch (err) {
      handleError(err, "Failed to load subjects");
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (academicInfo.courseId && selectedSemester) {
      fetchSubjects(academicInfo.courseId, selectedSemester, debouncedSearchQuery, true);
    }
  }, [selectedSemester, debouncedSearchQuery, fetchSubjects, academicInfo.courseId]);

  useEffect(() => {
    if (academicInfo.courseId && selectedSemester) {
      fetchSubjects(academicInfo.courseId, selectedSemester, "", false);
    }
  }, [selectedSemester, fetchSubjects, academicInfo.courseId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    setSuccess("");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSuccess("");
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

  const handleEdit = (subject) => {
    if (!selectedSemester) return;
    navigate("/admin/subjects/edit", {
      state: {
        subjectId: subject.id,
        subjectName: subject.name,
        departmentId: academicInfo.departmentId,
        departmentName: academicInfo.departmentName,
        courseId: academicInfo.courseId,
        courseName: academicInfo.courseName,
        semesterId: selectedSemester,
        semesterName: semesters.find(s => s.id === Number(selectedSemester))?.name || "",
      },
      replace: true,
    });
  };

  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete subject "${subject.name}"?`
    );
    if (!confirmed) return;

    setError("");
    setLoading(true);

    try {
      await subjectService.deleteSubject(subject.id);
      setSuccess("Subject deleted successfully!");

      setTimeout(() => {
        if (academicInfo.courseId && selectedSemester) {
          fetchSubjects(academicInfo.courseId, selectedSemester, debouncedSearchQuery, false);
        }
      }, 500);
    } catch (err) {
      handleError(err, "Failed to delete subject");
    } finally {
      setLoading(false);
    }
  };

  const renderAcademicInfo = () => {
    if (!academicInfo.departmentId || !academicInfo.courseId) {
      return (
        <div className="alert-card">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h3>Academic Information Missing</h3>
            <p>Please select Department and Course from the Manage Subject page before viewing subjects.</p>
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
          The following academic details were selected from Subject Management. Select a semester to view subjects.
        </p>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="view-academic-department">Department</label>
            <input
              id="view-academic-department"
              type="text"
              value={academicInfo.departmentName || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="view-academic-course">Course</label>
            <input
              id="view-academic-course"
              type="text"
              value={academicInfo.courseName || ""}
              readOnly
              className="filter-input"
              tabIndex={-1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="view-academic-semester">Semester <span className="required">*</span></label>
            <select
              id="view-academic-semester"
              value={selectedSemester}
              onChange={handleSemesterChange}
              className={`filter-input`}
              disabled={loadingSemesters}
            >
              <option value="">Select Semester</option>
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
              <h1>View & Update Subjects</h1>
              <p>View, edit and delete subjects for the selected course</p>
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

          {academicInfo.departmentId && academicInfo.courseId && (
            <section className="card" aria-labelledby="subject-list-title">
              <div className="subject-list-header">
                <h2 id="subject-list-title" className="card-title">Subject List</h2>
              </div>

              <div className="search-wrapper">
                <input
                  type="text"
                  id="subject-search"
                  className="search-box"
                  placeholder="Search subject..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  disabled={searchLoading}
                />
              </div>

              {(!selectedSemester || loadingSemesters) && (
                <p className="student-message" style={{ textAlign: "center", color: "#777", padding: "40px 20px" }}>
                  {loadingSemesters ? "Loading semesters..." : "Please select a semester to view subjects"}
                </p>
              )}

              {selectedSemester && !loading && !loadingSemesters && (
                <div className="table-container">
                  {subjects.length === 0 ? (
                    <p className="student-message" style={{ textAlign: "center", color: "#777", padding: "40px 20px" }}>
                      No subjects found for the selected semester.
                    </p>
                  ) : (
                    <table className="student-table" role="grid">
                      <thead>
                        <tr>
                          <th scope="col">No.</th>
                          <th scope="col">Subject Name</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subject, index) => (
                          <tr key={subject.id}>
                            <td>{index + 1}</td>
                            <td>{subject.name}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  type="button"
                                  className="edit-button"
                                  disabled={loading}
                                  title="Edit subject"
                                  onClick={() => handleEdit(subject)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="delete-button"
                                  disabled={loading}
                                  title="Delete subject"
                                  onClick={() => handleDelete(subject)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default SubjectView;