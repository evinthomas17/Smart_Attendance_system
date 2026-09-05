import api from "./api";

export const getTimetables = (classId, type = null) =>
  api.get("/academics/timetables/", { params: { class_id: classId, type } });

export const getTimetable = (timetableId) =>
  api.get(`/academics/timetables/${timetableId}/`);

export const createTimetable = (timetableData) =>
  api.post("/academics/timetables/", timetableData);

export const updateTimetable = (timetableId, timetableData) =>
  api.put(`/academics/timetables/${timetableId}/`, timetableData);

export const patchTimetable = (timetableId, timetableData) =>
  api.patch(`/academics/timetables/${timetableId}/`, timetableData);

export const deleteTimetable = (timetableId) =>
  api.delete(`/academics/timetables/${timetableId}/`);

export const getArchivedTimetables = (classId = null, type = null, dateFrom = null, dateTo = null) => {
  const params = {};
  if (classId) params.class_id = classId;
  if (type) params.type = type;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  return api.get("/academics/timetables/archive/", { params });
};

export const getClassSubjects = (classId) =>
  api.get("/academics/class-subjects/", { params: { class_id: classId } });

export const getClassFaculty = (classId) =>
  api.get("/academics/class-faculty/", { params: { class_id: classId } });