import api from "./api";

export const getFaculty = (courseId, search = "") =>
  api.get("/faculty/", { params: { course: courseId, search } });

export const getFacultyById = (facultyId) =>
  api.get(`/faculty/${facultyId}/`);

export const registerFaculty = (formData) =>
  api.post("/faculty/", formData);

export const updateFaculty = (facultyId, formData) =>
  api.patch(`/faculty/${facultyId}/`, formData);

export const deleteFaculty = (facultyId) =>
  api.delete(`/faculty/${facultyId}/`);

export const getFacultyCourses = (facultyId) =>
  api.get(`/faculty/${facultyId}/courses/`);

export const assignFacultyCourse = (facultyId, courseId) =>
  api.post(`/faculty/${facultyId}/courses/`, { course: courseId });

export const removeFacultyCourse = (facultyId, assignmentId) =>
  api.delete(`/faculty/${facultyId}/courses/${assignmentId}/`);

// Department and Course APIs (reusing academics endpoints)
export const getDepartments = () => api.get("/academics/departments/");

export const getCourses = (departmentId) =>
  api.get("/academics/courses/", { params: { department: departmentId } });