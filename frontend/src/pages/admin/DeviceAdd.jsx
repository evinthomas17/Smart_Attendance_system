import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as deviceService from "../../services/deviceService";
import * as studentService from "../../services/studentService";
import "./DeviceAdd.css";

const navigationItems = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Manage Students", icon: "👨‍🎓", path: "/admin/students" },
  { label: "Manage Faculty", icon: "👨‍🏫", path: "/admin/faculty" },
  { label: "Manage Subjects", icon: "📚", path: "/admin/subjects" },
  { label: "Manage Devices", icon: "📡", path: "/admin/devices" },
  { label: "Manage Reports", icon: "📊", path: "/admin/reports" },
  { label: "Manage Timetable", icon: "🗓️", path: "/admin/timetable" },
];

const initialForm = { department: "", course: "", semester: "", division: "", classroom: "", device_name: "", service_uuid: "", class_data: "" };

function DeviceAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState({ departments: false, courses: false, semesters: false, classes: false, classrooms: false, submitting: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const showError = useCallback((err, fallback) => {
    if (err.response?.status === 403) setError("You do not have permission to add a device.");
    else if (err.response?.status === 401) setError("Session expired. Please log in again.");
    else if (err.response?.status >= 500) setError("Server error. Please try again later.");
    else if (err.request) setError("Network error. Please check your connection.");
    else setError(err.response?.data?.detail || fallback);
  }, []);

  const load = useCallback(async (key, request, setter, fallback) => {
    setLoading((previous) => ({ ...previous, [key]: true }));
    try { const response = await request(); setter(response.data); }
    catch (err) { showError(err, fallback); }
    finally { setLoading((previous) => ({ ...previous, [key]: false })); }
  }, [showError]);

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
    if (key === "department") { setCourses([]); setSemesters([]); setClasses([]); setClassrooms([]); if (value) load("courses", () => studentService.getCourses(value), setCourses, "Failed to load courses."); }
    if (key === "course") { setSemesters([]); setClasses([]); setClassrooms([]); if (value) load("semesters", () => studentService.getSemesters(value), setSemesters, "Failed to load semesters."); }
    if (key === "semester") { setClasses([]); setClassrooms([]); if (value) load("classes", () => studentService.getClasses(form.course, value), setClasses, "Failed to load divisions."); }
    if (key === "division") { setClassrooms([]); if (value) load("classrooms", () => deviceService.getClassrooms({ department: form.department, course: form.course, semester: form.semester, division: value, available: "true" }), setClassrooms, "Failed to load rooms."); }
  }

  function handleClear() { setForm(initialForm); setCourses([]); setSemesters([]); setClasses([]); setClassrooms([]); setError(""); setSuccess(""); setFieldErrors({}); }
  function handleChange(event) { selectValue(event.target.name, event.target.value); }

  async function handleSubmit(event) {
    event.preventDefault(); setError(""); setSuccess(""); setFieldErrors({});
    const missing = Object.fromEntries(Object.entries(form).filter(([, value]) => !String(value).trim()).map(([key]) => [key, "This field is required."]));
    if (Object.keys(missing).length) { setFieldErrors(missing); return; }
    setLoading((previous) => ({ ...previous, submitting: true }));
    try {
      await deviceService.registerDevice(form);
      setSuccess("Device registered successfully. Redirecting to Device Management...");
      window.setTimeout(() => navigate("/admin/devices", { replace: true }), 1500);
    }
    catch (err) {
      if (err.response?.status === 400 && typeof err.response.data === "object") {
        const errors = Object.fromEntries(Object.entries(err.response.data).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
        setFieldErrors(errors);
      } else showError(err, "Failed to add device.");
    } finally { setLoading((previous) => ({ ...previous, submitting: false })); }
  }

  const optionLabel = (isLoading, label) => isLoading ? `Loading ${label}...` : `Select ${label}`;
  const isBusy = loading.submitting;
  return <div className="admin-dashboard">
    <div className="circle-top" aria-hidden="true" /><div className="circle-bottom" aria-hidden="true" />
    <header className="header"><div className="brand"><div className="logo">SA</div><div className="brand-name">Smart Attendance System</div></div><div className="admin-area"><button type="button" className="notification" onClick={() => window.alert("No new notifications.")} aria-label="Show notifications">🔔</button><div className="admin-profile"><div className="profile-circle">A</div><span>Admin</span></div></div></header>
    <div className="layout"><aside className="sidebar" aria-label="Admin navigation"><div className="sidebar-title">ADMIN</div>{navigationItems.map((item) => <Link key={item.path} to={item.path} className={`menu-item${item.path === "/admin/devices" ? " active" : ""}`}><span className="menu-icon">{item.icon}</span>{item.label}</Link>)}<button type="button" className="menu-item logout-menu" onClick={() => { if (window.confirm("Are you sure you want to logout?")) { ["access", "refresh", "email", "role"].forEach((key) => localStorage.removeItem(key)); navigate("/login", { replace: true }); } }}><span className="menu-icon">🚪</span>Logout</button></aside>
      <main className="content"><div className="page-heading"><div><h1>Add Device</h1><p>Register and assign a new ESP32 device</p></div><button type="button" className="btn btn-secondary" onClick={() => navigate("/admin/devices", { replace: true })} disabled={isBusy}>← Go Back</button></div>
      {error && <div className="card error-message device-message">{error}</div>}
      {success && <div className="card success-message device-message device-success-message">{success}</div>}
      <form onSubmit={handleSubmit} noValidate><section className="card"><h2 className="card-title">Academic Information</h2><div className="form-row device-form-row">
        <Field label="Department" name="department" value={form.department} onChange={handleChange} error={fieldErrors.department} disabled={isBusy || loading.departments}><option value="">{optionLabel(loading.departments, "Department")}</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Field>
        <Field label="Course" name="course" value={form.course} onChange={handleChange} error={fieldErrors.course} disabled={isBusy || !form.department || loading.courses}><option value="">{optionLabel(loading.courses, "Course")}</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Field>
        <Field label="Semester" name="semester" value={form.semester} onChange={handleChange} error={fieldErrors.semester} disabled={isBusy || !form.course || loading.semesters}><option value="">{optionLabel(loading.semesters, "Semester")}</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Field>
        <Field label="Division" name="division" value={form.division} onChange={handleChange} error={fieldErrors.division} disabled={isBusy || !form.semester || loading.classes}><option value="">{optionLabel(loading.classes, "Division")}</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.division}</option>)}</Field>
        <Field label="Room No" name="classroom" value={form.classroom} onChange={handleChange} error={fieldErrors.classroom} disabled={isBusy || !form.division || loading.classrooms}><option value="">{optionLabel(loading.classrooms, "Room")}</option>{classrooms.map((item) => <option key={item.classroom_id} value={item.classroom_id}>{item.room_no}</option>)}</Field>
      </div></section>
      <section className="card"><h2 className="card-title">ESP32 Device Information</h2><div className="form-row device-form-row"><TextField label="Name of ESP32" name="device_name" value={form.device_name} onChange={handleChange} error={fieldErrors.device_name} disabled={isBusy} placeholder="Enter ESP32 device name" /><TextField label="Service UUID" name="service_uuid" value={form.service_uuid} onChange={handleChange} error={fieldErrors.service_uuid} disabled={isBusy} placeholder="Enter BLE Service UUID" /><TextField label="Class Data (Service Data)" name="class_data" value={form.class_data} onChange={handleChange} error={fieldErrors.class_data} disabled={isBusy} placeholder="Enter class (service) data" /></div></section>
      <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={handleClear} disabled={isBusy}>Clear</button><button type="submit" className="btn btn-primary" disabled={isBusy}>{isBusy ? "Adding..." : "Add Device"}</button></div></form></main></div></div>;
}

function Field({ label, name, value, onChange, error, disabled, children }) { return <div className="form-group"><label htmlFor={name}>{label} <span className="required">*</span></label><select id={name} name={name} value={value} onChange={onChange} disabled={disabled} className={`filter-input ${error ? "error" : ""}`}>{children}</select>{error && <p className="field-error">{error}</p>}</div>; }
function TextField({ label, name, value, onChange, error, disabled, placeholder }) { return <div className="form-group"><label htmlFor={name}>{label} <span className="required">*</span></label><input id={name} name={name} value={value} onChange={onChange} disabled={disabled} className={`filter-input ${error ? "error" : ""}`} placeholder={placeholder} maxLength={name === "service_uuid" ? 50 : 100} />{error && <p className="field-error">{error}</p>}</div>; }
export default DeviceAdd;
