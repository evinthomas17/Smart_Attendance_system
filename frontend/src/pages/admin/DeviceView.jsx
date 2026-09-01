import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as deviceService from "../../services/deviceService";
import "./DeviceView.css";

const navigationItems = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Manage Students", icon: "👨‍🎓", path: "/admin/students" },
  { label: "Manage Faculty", icon: "👨‍🏫", path: "/admin/faculty" },
  { label: "Manage Subjects", icon: "📚", path: "/admin/subjects" },
  { label: "Manage Devices", icon: "📡", path: "/admin/devices" },
  { label: "Manage Reports", icon: "📊", path: "/admin/reports" },
  { label: "Manage Timetable", icon: "🗓️", path: "/admin/timetable" },
];

function DeviceView() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await deviceService.getRegisteredDevices();
      setDevices(response.data);
    } catch (err) {
      if (err.response?.status === 401) setError("Session expired. Please log in again.");
      else if (err.response?.status === 403) setError("You do not have permission to access this page.");
      else if (err.response?.status === 404) setError("Device data was not found.");
      else if (err.response?.status >= 500) setError("Server error. Please try again later.");
      else if (err.request) setError("Network error. Please check your connection.");
      else setError("Failed to load devices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestId = window.setTimeout(loadDevices, 0);
    return () => window.clearTimeout(requestId);
  }, [loadDevices]);

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return devices;
    return devices.filter((device) => {
      const roomNo = String(device.classroom_room_no || "");
      return [
        device.device_name, device.department_name, device.course_name,
        device.semester_name, device.division_name, roomNo, `Room ${roomNo}`,
        device.device_service_uuid, device.class_data,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [devices, search]);

  const handleEdit = (device) => {
    navigate("/admin/devices/edit", {
      state: {
        classId: device.class_id,
        deviceId: device.device_id,
        deviceName: device.device_name,
        deviceServiceUuid: device.device_service_uuid,
        classData: device.class_data,
        departmentId: device.department,
        departmentName: device.department_name,
        courseId: device.course,
        courseName: device.course_name,
        semesterId: device.semester,
        semesterName: device.semester_name,
        divisionId: device.division,
        divisionName: device.division_name,
        classroomId: device.classroom,
        classroomRoomNo: device.classroom_room_no,
      },
      replace: true,
    });
  };

  const handleDelete = async (device) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete device "${device.device_name}" (${device.classroom_room_no})?`
    );
    if (!confirmed) return;

    setDeletingId(device.class_id);
    setError("");
    setSuccess("");

    try {
      await deviceService.deleteClassDevice(device.class_id);
      setSuccess("Device deleted successfully!");
      setTimeout(() => loadDevices(), 1000);
    } catch (err) {
      if (err.response?.status === 401) setError("Session expired. Please log in again.");
      else if (err.response?.status === 403) setError("You do not have permission to delete devices.");
      else if (err.response?.status === 404) setError("Device not found.");
      else if (err.response?.status >= 500) setError("Server error. Please try again later.");
      else if (err.request) setError("Network error. Please check your connection.");
      else setError(err.response?.data?.detail || "Failed to delete device.");
    } finally {
      setDeletingId(null);
    }
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
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item${item.path === "/admin/devices" ? " active" : ""}`}
            >
              <span className="menu-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
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
            <span className="menu-icon">🚪</span>
            Logout
          </button>
        </aside>
        <main className="content">
          <div className="page-heading">
            <div>
              <h1>View Devices</h1>
              <p>View registered ESP32 devices</p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/admin/devices", { replace: true })}>
              ← Go Back
            </button>
          </div>
          {error && <div className="card error-message device-view-message">{error}</div>}
          {success && <div className="card success-message device-view-message" style={{ borderColor: "#51cf66", background: "#f3fff3" }}>{success}</div>}
          <section className="card" aria-labelledby="device-list-title">
            <div className="device-view-header">
              <div>
                <h2 id="device-list-title" className="card-title">Device List</h2>
                <p className="device-view-description">Registered ESP32 devices</p>
              </div>
            </div>
            <div className="search-wrapper">
              <input
                id="device-search"
                type="search"
                className="search-box"
                placeholder="Search devices using room no..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={loading}
              />
            </div>
            {loading ? (
              <p className="student-message">Loading devices...</p>
            ) : filteredDevices.length === 0 ? (
              <p className="student-message">
                <strong>No devices found</strong>
                <br />
                {devices.length === 0 ? "No registered ESP32 devices are available." : "No device matches your search."}
              </p>
            ) : (
              <div className="table-container">
                <table className="student-table device-view-table">
                  <thead>
                    <tr>
                      <th>ESP32 Name</th>
                      <th>Department</th>
                      <th>Course</th>
                      <th>Semester</th>
                      <th>Division</th>
                      <th>Room No</th>
                      <th>Service UUID</th>
                      <th>Class Data</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.map((device) => (
                      <tr key={device.class_id}>
                        <td>{device.device_name || "-"}</td>
                        <td>{device.department_name || "-"}</td>
                        <td>{device.course_name || "-"}</td>
                        <td>{device.semester_name || "-"}</td>
                        <td>{device.division_name || "-"}</td>
                        <td>{device.classroom_room_no || "-"}</td>
                        <td>{device.device_service_uuid || "-"}</td>
                        <td>{device.class_data || "-"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="edit-button"
                              onClick={() => handleEdit(device)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => handleDelete(device)}
                              disabled={deletingId === device.class_id}
                            >
                              {deletingId === device.class_id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default DeviceView;


