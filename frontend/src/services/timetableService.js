import api from "./api";

export const getTimetables = (classId) =>
  api.get("/academics/timetables/", { params: { class_id: classId } });

export const getTimetable = (timetableId) =>
  api.get(`/academics/timetables/${timetableId}/`);

export const createTimetable = (timetableData) =>
  api.post("/academics/timetables/", timetableData);

export const deleteTimetable = (timetableId) =>
  api.delete(`/academics/timetables/${timetableId}/`);

export const getClassSubjects = (classId) =>
  api.get("/academics/class-subjects/", { params: { class_id: classId } });

export const getClassFaculty = (classId) =>
  api.get("/academics/class-faculty/", { params: { class_id: classId } });