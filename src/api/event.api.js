import api from "./axios";

export const getEvents = () => {
  return api.get("/events");
};

export const createEvent = (payload) => {
  return api.post("/events/create", payload);
};

export const editEvent = (id, payload) => {
  return api.put(`/events/${id}`, payload);
};

export const deleteEvent = (id) => {
  return api.delete(`/events/${id}`);
};
