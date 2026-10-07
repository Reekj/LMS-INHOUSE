import api from "./axios";

// Create a new assignment (Lecturer)
export const createAssignment = (payload) => {
  return api.post("/assignments", payload);
};

// Fetch all submissions for a specific assignment (Lecturer)
export const getSubmissions = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}/submissions`);
};

// Grade a submission (Lecturer)
export const gradeSubmission = (submissionId, payload) => {
  return api.post(`/assignments/submissions/${submissionId}/grade`, payload);
};

// Create a group (Student)
export const createGroup = (assignmentId) => {
  return api.post(`/assignments/${assignmentId}/groups`);
};

// Join a group (Student)
export const joinGroup = (assignmentId, payload) => {
  return api.post(`/assignments/${assignmentId}/groups/join`, payload);
};

// Get student's active group details (Student)
export const getMyGroup = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}/groups/my-group`);
};

// Submit assignment (Student)
export const submitAssignment = (assignmentId, formData) => {
  return api.post(`/assignments/${assignmentId}/submit`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Retrieve all assignments for a course
export const getCourseAssignments = (courseId) => {
  return api.get(`/assignments/courses/${courseId}`);
};
