import api from "./axios";

// Create a new forum post/thread
export const createForumPost = (payload) => {
  return api.post("/forum/posts", payload);
};

// Retrieve posts for a specific course
export const getCourseForumPosts = (courseId) => {
  return api.get(`/forum/courses/${courseId}/posts`);
};

// Retrieve a single post and its comments/replies
export const getForumPostDetails = (postId) => {
  return api.get(`/forum/posts/${postId}`);
};

// Like / unlike a post
export const likeForumPost = (postId) => {
  return api.post(`/forum/posts/${postId}/like`);
};

// Add comment/reply to a post
export const addForumComment = (postId, payload) => {
  return api.post(`/forum/posts/${postId}/comments`, payload);
};

// Mark comment as official instructor answer (Lecturers only)
export const resolveForumPost = (postId, payload) => {
  return api.post(`/forum/posts/${postId}/resolve`, payload);
};

// Delete post (Author/Lecturer/Admin only)
export const deleteForumPost = (postId) => {
  return api.delete(`/forum/posts/${postId}`);
};

// Delete comment (Author/Lecturer/Admin only)
export const deleteForumComment = (commentId) => {
  return api.delete(`/forum/comments/${commentId}`);
};
