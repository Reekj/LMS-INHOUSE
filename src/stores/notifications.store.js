import { defineStore } from "pinia";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notification.api";
import { useAuthStore } from "./auth.store";

// Read state lives on the server, so it survives reloads, logout and other devices.

function timeAgo(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString();
}

const CATEGORY_BY_TYPE = {
  discussion: "Discussions",
  reply: "Discussions",
  announcement: "Announcements",
};

// Where clicking a notification takes the user.
function linkFor(item, role) {
  if (!item.courseId) return "";
  if (role === "student") return `/student/my-courses/${item.courseId}/discussion`;
  if (role === "lecturer") return `/lecturer/courses/${item.courseId}/discussion`;
  return "";
}

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    items: [],
    loaded: false,
  }),

  getters: {
    unreadCount: (state) => state.items.filter((item) => item.unread).length,
  },

  actions: {
    async fetch() {
      const auth = useAuthStore();
      if (!import.meta.env.VITE_API_URL || !auth.isAuthenticated || auth.userRole === "platform_admin") {
        return;
      }
      try {
        const res = await getNotifications();
        this.items = (res.data.notifications || []).map((item) => ({
          id: item.id,
          source: item.source,
          type: item.type,
          category: CATEGORY_BY_TYPE[item.type] || "Announcements",
          title: item.title,
          message: item.message,
          courseCode: item.courseCode,
          courseTitle: item.courseTitle,
          link: linkFor(item, auth.userRole),
          unread: !item.read,
          time: timeAgo(item.createdAt),
          createdAt: item.createdAt,
        }));
        this.loaded = true;
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    },

    async markRead(id) {
      const item = this.items.find((entry) => entry.id === id);
      if (!item || !item.unread) return;
      item.unread = false;
      try {
        await markNotificationRead(id);
      } catch (err) {
        item.unread = true;
        console.error("Failed to mark notification as read:", err);
      }
    },

    async markAllRead() {
      const unread = this.items.filter((item) => item.unread);
      if (!unread.length) return;
      unread.forEach((item) => {
        item.unread = false;
      });
      try {
        await markAllNotificationsRead();
      } catch (err) {
        unread.forEach((item) => {
          item.unread = true;
        });
        console.error("Failed to mark notifications as read:", err);
      }
    },
  },
});
