import api from "./api";

export const getDepartments = () => api.get("/academics/departments/");

export const getCourses = (departmentId) =>
  api.get("/academics/courses/", { params: { department: departmentId } });

export const getSemesters = (courseId) =>
  api.get("/academics/semesters/", { params: { course: courseId } });

export const getClasses = (courseId, semesterId) =>
  api.get("/academics/classes/", {
    params: { course: courseId, semester: semesterId },
  });

export const getStudents = (classId, search = "") =>
  api.get("/students/", { params: { class_id: classId, search } });

export const registerStudentWithFace = (formData) =>
  api.post("/students/register/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getStudent = (studentId) =>
  api.get(`/students/${studentId}/`);

export const updateStudent = (studentId, formData) =>
  api.patch(`/students/${studentId}/`, formData);

export const deleteStudent = (studentId) =>
  api.delete(`/students/${studentId}/`);