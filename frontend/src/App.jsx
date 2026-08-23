import "./App.css";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentManage from "./pages/StudentManage";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";

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
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<StudentManage />} />
        <Route path="/admin/:section" element={<AdminFeature />} />

        <Route
          path="/student-dashboard"
          element={<StudentDashboard />}
        />

        <Route
          path="/faculty-dashboard"
          element={<FacultyDashboard />}
        />

      </Routes>

    </BrowserRouter>
  );
}

function AdminFeature() {
  return <main className="admin-feature">This section is coming soon.</main>;
}

export default App;