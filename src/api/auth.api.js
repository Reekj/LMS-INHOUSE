import api from "./axios";

export const loginUser = (payload) => {
  return api.post("/auth/login", payload);
};

export const registerUser = (payload) => {
  return api.post("/auth/register", payload);
};

export const getCurrentUser = () => {
  return api.get("/auth/me");
};

export const logoutUser = () => {
  return api.post("/auth/logout");
};

export const uploadPhoto = (id, formData) => {
  return api.put(`/auth/upload-photo/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const removePhoto = (id) => {
  return api.delete(`/auth/remove-photo/${id}`);
};

export const changePassword = (payload) => {
  return api.put("/auth/change-password", payload);
};