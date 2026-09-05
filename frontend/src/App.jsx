import "./App.css";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./services/api";
import { useNavigate } from "react-router-dom";

import Login from "./pages/login/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentManage from "./pages/admin/StudentManage";
import StudentRegistration from "./pages/admin/StudentRegistration";
import StudentUpdate from "./pages/admin/StudentUpdate";
import FacultyManage from "./pages/admin/FacultyManage";
import FacultyRegistration from "./pages/admin/FacultyRegistration";
import FacultyUpdate from "./pages/admin/FacultyUpdate";
import SubjectManage from "./pages/admin/SubjectManage";
import SubjectAdd from "./pages/admin/SubjectAdd";
import SubjectView from "./pages/admin/SubjectView";
import SubjectUpdate from "./pages/admin/SubjectUpdate";
import DeviceManage from "./pages/admin/DeviceManage";
import DeviceAdd from "./pages/admin/DeviceAdd";
import DeviceView from "./pages/admin/DeviceView";
import DeviceEdit from "./pages/admin/DeviceEdit";
import TimetableManage from "./pages/admin/TimetableManage";
import TimetableCreate from "./pages/admin/TimetableCreate";
import TimetableView from "./pages/admin/TimetableView";
import TimetableUpdate from "./pages/admin/TimetableUpdate";
import StudentDashboard from "./pages/student/StudentDashboard";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";

// Protected route component for admin routes
function AdminProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("access");
      const role = localStorage.getItem("role");

      if (!accessToken || role !== "ADMIN") {
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
        return;
      }

      // Verify token with backend - let api.js interceptor handle 401/refresh
      try {
        const response = await api.get("/adminpanel/dashboard/");
        if (response.status === 200) {
          setIsAuthenticated(true);
        } else {
          throw new Error("Token verification failed");
        }
      } catch {
        // If api.js interceptor already tried refresh and it failed,
        // the interceptor would have redirected to login.
        // This catch handles edge cases or if interceptor didn't catch it.
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <div className="circle-top" aria-hidden="true" />
        <div className="circle-bottom" aria-hidden="true" />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "16px" }}>🔄</div>
            <p>Verifying authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Protected route for student dashboard
function StudentProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("access");
      const role = localStorage.getItem("role");

      if (!accessToken || role !== "STUDENT") {
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
        return;
      }

      try {
        await api.get("/adminpanel/dashboard/");
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>🔄</div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Protected route for faculty dashboard
function FacultyProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("access");
      const role = localStorage.getItem("role");

      if (!accessToken || role !== "FACULTY") {
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
        return;
      }

      try {
        await api.get("/adminpanel/dashboard/");
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>🔄</div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/admin-dashboard"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route path="/login" element={<Login />} />
        
        {/* Admin Protected Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/students" 
          element={
            <AdminProtectedRoute>
              <StudentManage />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/students/register" 
          element={
            <AdminProtectedRoute>
              <StudentRegistration />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/students/edit" 
          element={
            <AdminProtectedRoute>
              <StudentUpdate />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/faculty" 
          element={
            <AdminProtectedRoute>
              <FacultyManage />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/faculty/register" 
          element={
            <AdminProtectedRoute>
              <FacultyRegistration />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/faculty/edit" 
          element={
            <AdminProtectedRoute>
              <FacultyUpdate />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/subjects" 
          element={
            <AdminProtectedRoute>
              <SubjectManage />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/subjects/add" 
          element={
            <AdminProtectedRoute>
              <SubjectAdd />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/subjects/view" 
          element={
            <AdminProtectedRoute>
              <SubjectView />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/subjects/edit" 
          element={
            <AdminProtectedRoute>
              <SubjectUpdate />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/devices" 
          element={
            <AdminProtectedRoute>
              <DeviceManage />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/devices/add" 
          element={
            <AdminProtectedRoute>
              <DeviceAdd />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/devices/view" 
          element={
            <AdminProtectedRoute>
              <DeviceView />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/devices/edit" 
          element={
            <AdminProtectedRoute>
              <DeviceEdit />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/timetable" 
          element={
            <AdminProtectedRoute>
              <TimetableManage />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/timetable/create" 
          element={
            <AdminProtectedRoute>
              <TimetableCreate />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/timetable/view" 
          element={
            <AdminProtectedRoute>
              <TimetableView />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/timetable/update" 
          element={
            <AdminProtectedRoute>
              <TimetableUpdate />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/:section" 
          element={
            <AdminProtectedRoute>
              <AdminFeature />
            </AdminProtectedRoute>
          } 
        />
        
        {/* Student Protected Routes */}
        <Route 
          path="/student-dashboard" 
          element={
            <StudentProtectedRoute>
              <StudentDashboard />
            </StudentProtectedRoute>
          } 
        />

        {/* Faculty Protected Routes */}
        <Route 
          path="/faculty-dashboard" 
          element={
            <FacultyProtectedRoute>
              <FacultyDashboard />
            </FacultyProtectedRoute>
          } 
        />

      </Routes>
    </BrowserRouter>
  );
}

function AdminFeature() {
  return <main className="admin-feature">This section is coming soon.</main>;
}

export default App;