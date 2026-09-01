import api from "./api";
import * as studentService from "./studentService";

export const getSubjects = (courseId, semesterId = "", search = "") =>
  api.get("/academics/subjects/", {
    params: { course: courseId, semester: semesterId, search },
  });

export const getSubject = (subjectId) => {
  if (!subjectId || isNaN(Number(subjectId))) {
    return Promise.reject(new Error("Invalid subject ID"));
  }
  return api.get(`/academics/subjects/${subjectId}/`);
};

export const createSubject = (formData) =>
  api.post("/academics/subjects/", formData);

export const createSubjects = (subjectsData) =>
  api.post("/academics/subjects/", subjectsData);

export const updateSubject = (subjectId, formData) =>
  api.patch(`/academics/subjects/${subjectId}/`, formData);

export const deleteSubject = (subjectId) =>
  api.delete(`/academics/subjects/${subjectId}/`);

// Reuse department and course APIs from studentService
export const getDepartments = studentService.getDepartments;
export const getCourses = studentService.getCourses;
export const getSemesters = studentService.getSemesters;