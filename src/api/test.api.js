import api from "./axios";

// Configure and schedule a test session (Lecturer)
export const createTest = (payload) => {
  return api.post("/tests/settings", payload);
};

// Update an existing test session configuration (Lecturer)
export const updateTest = (testId, payload) => {
  return api.patch(`/tests/settings/${testId}`, payload);
};

// Add a single question to an existing test configuration (Lecturer)
export const addQuestion = (testId, payload) => {
  return api.post(`/tests/${testId}/questions`, payload);
};

// Bulk upload questions (Lecturer)
export const bulkUploadQuestions = (testId, payload) => {
  return api.post(`/tests/${testId}/questions/bulk`, payload);
};

// Edit a question (Lecturer)
export const editQuestion = (questionId, payload) => {
  return api.patch(`/tests/questions/${questionId}`, payload);
};

// Delete a question (Lecturer)
export const deleteQuestion = (questionId) => {
  return api.delete(`/tests/questions/${questionId}`);
};

// Retrieve all questions for a test (Lecturer Review)
export const getLecturerQuestions = (testId) => {
  return api.get(`/tests/${testId}/questions`);
};

// Retrieve test questions for student (Student)
export const getStudentQuestions = (testId) => {
  return api.get(`/tests/${testId}/questions/student`);
};

// Submit student test answers (Student)
export const submitTest = (testId, payload) => {
  return api.post(`/tests/${testId}/submit`, payload);
};

// Retrieve test results and answers overview (Student)
export const getTestResults = (testId) => {
  return api.get(`/tests/${testId}/results`);
};

// Retrieve scheduled tests for a course (Student/Lecturer)
export const getCourseTests = (courseId) => {
  return api.get(`/tests/courses/${courseId}`);
};
