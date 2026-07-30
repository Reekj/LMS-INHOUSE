import api from "./axios";

export const getAllUsers = () => {
  return api.get("/auth/users");
};

export const createUser = (payload) => {
  return api.post("/auth/register", payload);
};

export const updateUser = (id, payload) => {
  return api.put(`/auth/edit-user/${id}`, payload);
};
