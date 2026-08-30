import api from "./api";

export const getDevices = (status = "") =>
  api.get("/devices/devices/", {
    params: { status },
  });

export const getDevice = (deviceId) =>
  api.get(`/devices/devices/${deviceId}/`);

export const createDevice = (formData) =>
  api.post("/devices/devices/", formData);

export const registerDevice = (formData) =>
  api.post("/devices/devices/register/", formData);

export const updateDevice = (deviceId, formData) =>
  api.patch(`/devices/devices/${deviceId}/`, formData);

export const deleteDevice = (deviceId) =>
  api.delete(`/devices/devices/${deviceId}/`);

export const getClassrooms = (params = {}) =>
  api.get("/devices/classrooms/", { params });

export const getClassroomsByAcademic = (departmentId, courseId, semesterId, division) =>
  api.get("/devices/classrooms/", {
    params: {
      department: departmentId,
      course: courseId,
      semester: semesterId,
      division: division,
    },
  });

export const getClassroom = (classroomId) =>
  api.get(`/devices/classrooms/${classroomId}/`);

export const createClassroom = (formData) =>
  api.post("/devices/classrooms/", formData);

export const updateClassroom = (classroomId, formData) =>
  api.patch(`/devices/classrooms/${classroomId}/`, formData);

export const deleteClassroom = (classroomId) =>
  api.delete(`/devices/classrooms/${classroomId}/`);

export const getClassDevices = (departmentId = "", courseId = "", semesterId = "", divisionId = "", classroomId = "", deviceId = "") =>
  api.get("/devices/classes/", {
    params: {
      department: departmentId,
      course: courseId,
      semester: semesterId,
      division: divisionId,
      classroom: classroomId,
      device: deviceId,
    },
  });

export const getRegisteredDevices = () =>
  api.get("/devices/classes/", { params: { registered: "true" } });

export const getClassDevice = (classId) =>
  api.get(`/devices/classes/${classId}/`);

export const createClassDevice = (formData) =>
  api.post("/devices/classes/", formData);

export const updateClassDevice = (classId, formData) =>
  api.patch(`/devices/classes/${classId}/`, formData);

export const deleteClassDevice = (classId) =>
  api.delete(`/devices/classes/${classId}/`);
