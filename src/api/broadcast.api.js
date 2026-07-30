import api from "./axios";

export const createBroadcast = (payload) => {
  return api.post("/broadcasts", payload);
};

export const getBroadcasts = () => {
  return api.get("/broadcasts");
};

export const deleteBroadcast = (id) => {
  return api.delete(`/broadcasts/${id}`);
};
