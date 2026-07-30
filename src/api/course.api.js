import api from "./axios";

export const getCourses = () => {
  return api.get("/courses");
};

export const createCourse = (payload) => {
  return api.post("/courses/create-course", payload);
};

export const editCourse = (id, payload) => {
  return api.put(`/courses/edit-course/${id}`, payload);
};

export const uploadMaterial = (courseCode, formData) => {
  return api.post(`/courses/${courseCode}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getMaterialDownloadUrl = (key, download = false) => {
  return api.get(`/courses/material/download?key=${encodeURIComponent(key)}${download ? "&download=true" : ""}`);
};
