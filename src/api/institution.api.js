import api from "./axios";

export const getManagedInstitutions = () => api.get("/institutions/manage");

export const getInstitution = (id) => api.get(`/institutions/${id}`);

export const createInstitution = (payload) => api.post("/institutions", payload);

export const updateInstitution = (id, payload) => api.patch(`/institutions/${id}`, payload);

export const addInstitutionAdmin = (id, payload) => api.post(`/institutions/${id}/admins`, payload);

export const setInstitutionAdminStatus = (id, adminId, status) =>
  api.patch(`/institutions/${id}/admins/${adminId}/status`, { status });
