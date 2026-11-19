import api from "./axios";

export const getFaculties = () => api.get("/faculties");
export const createFaculty = (name) => api.post("/faculties", { name });
export const renameFaculty = (id, name) => api.patch(`/faculties/${id}`, { name });
export const deleteFaculty = (id) => api.delete(`/faculties/${id}`);

export const createDepartment = (facultyId, name) =>
  api.post(`/faculties/${facultyId}/departments`, { name });
export const updateDepartment = (id, payload) => api.patch(`/faculties/departments/${id}`, payload);
export const deleteDepartment = (id) => api.delete(`/faculties/departments/${id}`);
