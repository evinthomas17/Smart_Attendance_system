import "./App.css";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

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
import StudentDashboard from "./pages/student/StudentDashboard";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";

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
        <Route path="/admin/students/register" element={<StudentRegistration />} />
        <Route path="/admin/students/edit" element={<StudentUpdate />} />
        <Route path="/admin/faculty" element={<FacultyManage />} />
        <Route path="/admin/faculty/register" element={<FacultyRegistration />} />
        <Route path="/admin/faculty/edit" element={<FacultyUpdate />} />
        <Route path="/admin/subjects" element={<SubjectManage />} />
        <Route path="/admin/subjects/add" element={<SubjectAdd />} />
        <Route path="/admin/subjects/view" element={<SubjectView />} />
        <Route path="/admin/subjects/edit" element={<SubjectUpdate />} />
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