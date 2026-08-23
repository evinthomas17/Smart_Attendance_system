import api from "./api";

export const getDepartments = () => api.get("/api/academics/departments/");

export const getCourses = (departmentId) =>
  api.get("/api/academics/courses/", { params: { department: departmentId } });

export const getSemesters = (courseId) =>
  api.get("/api/academics/semesters/", { params: { course: courseId } });

export const getClasses = (courseId, semesterId) =>
  api.get("/api/academics/classes/", {
    params: { course: courseId, semester: semesterId },
  });

export const getStudents = (classId, search = "") =>
  api.get("/api/students/", { params: { class_id: classId, search } });