import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as deviceService from "../../services/deviceService";
import * as studentService from "../../services/studentService";
import "./DeviceEdit.css";

function DeviceEdit() {
  const navigate = useNavigate();
  const location = useLocation();

  const academicInfoFromState = location.state;

  const academicInfo = academicInfoFromState ? {
    classId: academicInfoFromState.classId || null,
    deviceId: academicInfoFromState.deviceId || null,
    deviceName: academicInfoFromState.deviceName || null,
    deviceServiceUuid: academicInfoFromState.deviceServiceUuid || null,
    classData: academicInfoFromState.classData || null,
    departmentId: academicInfoFromState.departmentId || null,
    departmentName: academicInfoFromState.departmentName || null,
    courseId: academicInfoFromState.courseId || null,
    courseName: academicInfoFromState.courseName || null,
    semesterId: academicInfoFromState.semesterId || null,
    semesterName: academicInfoFromState.semesterName || null,
    divisionId: academicInfoFromState.divisionId || null,
    divisionName: academicInfoFromState.divisionName || null,
    classroomId: academicInfoFromState.classroomId || null,
    classroomRoomNo: academicInfoFromState.classroomRoomNo || null,
  } : {
    classId: null,
    deviceId: null,
    deviceName: null,
    deviceServiceUuid: null,
    classData: null,
    departmentId: null,
    departmentName: null,
    courseId: null,
    courseName: null,
    semesterId: null,
    semesterName: null,
    divisionId: null,
    divisionName: null,
    classroomId: null,
    classroomRoomNo: null,
  };

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(() => !!academicInfo.classId && !academicInfo.deviceName);

  const [form, setForm] = useState({
    department: academicInfo.departmentId || "",
    course: academicInfo.courseId || "",
    semester: academicInfo.semesterId || "",
    division: academicInfo.divisionId || "",
    classroom: academicInfo.classroomId || "",
    device_name: academicInfo.deviceName || "",
    service_uuid: academicInfo.deviceServiceUuid || "",
    class_data: academicInfo.classData || "",
  });

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [academicLoading, setAcademicLoading] = useState({
    departments: false,
    courses: false,
    semesters: false,
    classes: false,
    classrooms: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const showError = useCallback((err, fallback) => {
    if (err.response?.status === 403) setError("You do not have permission to update a device.");
    else if (err.response?.status === 401) setError("Session expired. Please log in again.");
    else if (err.response?.status >= 500) setError("Server error. Please try again later.");
    else if (err.request) setError("Network error. Please check your connection.");
    else setError(err.response?.data?.detail || fallback);
  }, []);

  const load = useCallback(async (key, request, setter, fallback) => {
    setAcademicLoading((previous) => ({ ...previous, [key]: true }));
    try {
      const response = await request();
      setter(response.data);
    } catch (err) {
      showError(err, fallback);
    } finally {
      setAcademicLoading((previous) => ({ ...previous, [key]: false }));
    }
  }, [showError]);

  useEffect(() => {
    if (academicInfo.classId && !academicInfo.deviceName) {
      deviceService.getClassDevice(academicInfo.classId)
        .then((response) => {
          const data = response.data;
          setForm({
            department: data.department || "",
            course: data.course || "",
            semester: data.semester || "",
            division: data.division || "",
            classroom: data.classroom || "",
            device_name: data.device_name || "",
            service_uuid: data.device_service_uuid || "",
            class_data: data.class_data || "",
          });
        })
        .catch(() => {
          setError("Failed to load device details.");
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    }
  }, [academicInfo.classId, academicInfo.deviceName]);

  useEffect(() => {
    const requestId = window.setTimeout(() => {
      load("departments", studentService.getDepartments, setDepartments, "Failed to load departments.");
    }, 0);
    return () => window.clearTimeout(requestId);
  }, [load]);

  function selectValue(key, value) {
    setError("");
    setSuccess("");
    setFieldErrors((previous) => ({ ...previous, [key]: "" }));
    setForm((previous) => {
      if (key === "department") return { ...previous, department: value, course: "", semester: "", division: "", classroom: "" };
      if (key === "course") return { ...previous, course: value, semester: "", division: "", classroom: "" };
      if (key === "semester") return { ...previous, semester: value, division: "", classroom: "" };
      if (key === "division") return { ...previous, division: value, classroom: "" };
      return { ...previous, [key]: value };
    });
    if (key === "department") {
      setCourses([]);
      setSemesters([]);
      setClasses([]);
      setClassrooms([]);
      if (value) load("courses", () => studentService.getCourses(value), setCourses, "Failed to load courses.");
    }
    if (key === "course") {
      setSemesters([]);
      setClasses([]);
      setClassrooms([]);
      if (value) load("semesters", () => studentService.getSemesters(value), setSemesters, "Failed to load semesters.");
    }
    if (key === "semester") {
      setClasses([]);
      setClassrooms([]);
      if (value && form.course) load("classes", () => studentService.getClasses(form.course, value), setClasses, "Failed to load divisions.");
    }
    if (key === "division") {
      setClassrooms([]);
      if (value) load("classrooms", () => deviceService.getClassrooms({ department: form.department, course: form.course, semester: form.semester, division: value, available: "true" }), setClassrooms, "Failed to load rooms.");
    }
  }

  function handleClear() {
    setForm({
      department: academicInfo.departmentId || "",
      course: academicInfo.courseId || "",
      semester: academicInfo.semesterId || "",
      division: academicInfo.divisionId || "",
      classroom: academicInfo.classroomId || "",
      device_name: academicInfo.deviceName || "",
      service_uuid: academicInfo.deviceServiceUuid || "",
      class_data: academicInfo.classData || "",
    });
    if (!academicInfo.departmentId) setCourses([]);
    if (!academicInfo.courseId) setSemesters([]);
    if (!academicInfo.semesterId) setClasses([]);
    if (!academicInfo.divisionId) setClassrooms([]);
    setError("");
    setSuccess("");
    setFieldErrors({});
  }

  function handleChange(event) {
    selectValue(event.target.name, event.target.value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    const missing = Object.fromEntries(
      Object.entries(form)
        .filter(([, value]) => !String(value).trim())
        .map(([key]) => [key, "This field is required."])
    );
    if (Object.keys(missing).length) {
      setFieldErrors(missing);
      return;
    }

    setLoading(true);

    try {
      // Update Device
      if (academicInfo.deviceId) {
        await deviceService.updateDevice(academicInfo.deviceId, {
          device_name: form.device_name.trim(),
          service_uuid: form.service_uuid.trim(),
        });
      }

      // Update ClassDevice
      if (academicInfo.classId) {
        await deviceService.updateClassDevice(academicInfo.classId, {
          department: Number(form.department),
          course: Number(form.course),
          semester: Number(form.semester),
          division: Number(form.division),
          classroom: Number(form.classroom),
          class_data: form.class_data.trim(),
          is_active: true,
        });
      }

      setSuccess("Device updated successfully.");

      setTimeout(() => {
        navigate("/admin/devices/view", {
          state: {
            department: academicInfo.departmentName,
            course: academicInfo.courseName,
            semester: academicInfo.semesterName,
            division: academicInfo.divisionName,
            classId: academicInfo.classId,
          },
          replace: true,
        });
      }, 1500);
    } catch (err) {
      if (err.response?.status === 400 && typeof err.response.data === "object") {
        const errors = Object.fromEntries(
          Object.entries(err.response.data).map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : value,
          ])
        );
        setFieldErrors(errors);
      } else {
        showError(err, "Failed to update device.");
      }
    } finally {
      setLoading(false);
    }
  }

  const optionLabel = (isLoading, label) => (isLoading ? `Loading ${label}...` : `Select ${label}`);
  const isBusy = loading;

  if (isLoadingData) {
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
                <span className="menu-icon" aria-hidden="true">🗓️</span>
                Manage Timetable
              </a>
            </nav>
            <button
              type="button"
              className="menu-item logout-menu"
              onClick={() => {
                if (window.confirm("Are you sure you want to logout?")) {
                  ["access", "refresh", "email", "role"].forEach((key) => localStorage.removeItem(key));
                  navigate("/login", { replace: true });
                }
              }}
            >
              <span className="menu-icon" aria-hidden="true">🚪</span>
              Logout
            </button>
          </aside>
          <main className="content">
            <div className="page-heading">
              <div>
                <h1>Edit Device</h1>
                <p>Loading device details...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const renderAcademicInfo = () => {
    if (!academicInfo.classId) {
      return (
        <div className="alert-card">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h3>No Device Selected</h3>
            <p>Unable to determine the device information.</p>
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
          Select the academic details for this device assignment.
        </p>
        <div className="form-row device-form-row">
          <Field
            label="Department"
            name="department"
            value={form.department}
            onChange={handleChange}
            error={fieldErrors.department}
            disabled={isBusy || academicLoading.departments}
          >
            <option value="">{optionLabel(academicLoading.departments, "Department")}</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Field>
          <Field
            label="Course"
            name="course"
            value={form.course}
            onChange={handleChange}
            error={fieldErrors.course}
            disabled={isBusy || !form.department || academicLoading.courses}
          >
            <option value="">{optionLabel(academicLoading.courses, "Course")}</option>
            {courses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Field>
          <Field
            label="Semester"
            name="semester"
            value={form.semester}
            onChange={handleChange}
            error={fieldErrors.semester}
            disabled={isBusy || !form.course || academicLoading.semesters}
          >
            <option value="">{optionLabel(academicLoading.semesters, "Semester")}</option>
            {semesters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Field>
          <Field
            label="Division"
            name="division"
            value={form.division}
            onChange={handleChange}
            error={fieldErrors.division}
            disabled={isBusy || !form.semester || academicLoading.classes}
          >
            <option value="">{optionLabel(academicLoading.classes, "Division")}</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.division}
              </option>
            ))}
          </Field>
          <Field
            label="Room No"
            name="classroom"
            value={form.classroom}
            onChange={handleChange}
            error={fieldErrors.classroom}
            disabled={isBusy || !form.division || academicLoading.classrooms}
          >
            <option value="">{optionLabel(academicLoading.classrooms, "Room")}</option>
            {classrooms.map((item) => (
              <option key={item.classroom_id} value={item.classroom_id}>
                {item.room_no}
              </option>
            ))}
          </Field>
        </div>
      </section>
    );
  };

  function handleGoBack() {
    navigate("/admin/devices/view", {
      state: {
        department: academicInfo.departmentName,
        course: academicInfo.courseName,
        semester: academicInfo.semesterName,
        division: academicInfo.divisionName,
        classId: academicInfo.classId,
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
              <span className="menu-icon" aria-hidden="true">🗓️</span>
              Manage Timetable
            </a>
          </nav>
          <button
            type="button"
            className="menu-item logout-menu"
            onClick={() => {
              if (window.confirm("Are you sure you want to logout?")) {
                ["access", "refresh", "email", "role"].forEach((key) => localStorage.removeItem(key));
                navigate("/login", { replace: true });
              }
            }}
          >
            <span className="menu-icon" aria-hidden="true">🚪</span>
            Logout
          </button>
        </aside>
        <main className="content">
          <div className="page-heading">
            <div>
              <h1>Edit Device</h1>
              <p>Update ESP32 device and classroom assignment</p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={handleGoBack} disabled={isBusy}>
              ← Go Back
            </button>
          </div>

          {error && <div className="card error-message device-message">{error}</div>}
          {success && <div className="card success-message device-message device-success-message">{success}</div>}

          {renderAcademicInfo()}

          <form onSubmit={handleSubmit} noValidate>
            <section className="card">
              <h2 className="card-title">ESP32 Device Information</h2>
              <div className="form-row device-form-row">
                <TextField
                  label="Name of ESP32"
                  name="device_name"
                  value={form.device_name}
                  onChange={handleChange}
                  error={fieldErrors.device_name}
                  disabled={isBusy}
                  placeholder="Enter ESP32 device name"
                />
                <TextField
                  label="Service UUID"
                  name="service_uuid"
                  value={form.service_uuid}
                  onChange={handleChange}
                  error={fieldErrors.service_uuid}
                  disabled={isBusy}
                  placeholder="Enter BLE Service UUID"
                />
                <TextField
                  label="Class Data (Service Data)"
                  name="class_data"
                  value={form.class_data}
                  onChange={handleChange}
                  error={fieldErrors.class_data}
                  disabled={isBusy}
                  placeholder="Enter class (service) data"
                />
              </div>
            </section>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={isBusy}>
                Clear
              </button>
              <button type="submit" className="btn btn-primary" disabled={isBusy}>
                {isBusy ? "Updating..." : "Update Device"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, error, disabled, children }) {
  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label} <span className="required">*</span>
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`filter-input ${error ? "error" : ""}`}
      >
        {children}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function TextField({ label, name, value, onChange, error, disabled, placeholder }) {
  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label} <span className="required">*</span>
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`filter-input ${error ? "error" : ""}`}
        placeholder={placeholder}
        maxLength={name === "service_uuid" ? 50 : 100}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export default DeviceEdit;