<template>
  <header class="navbar">
    <div class="breadcrumb">
      <span>{{ portalLabel }}</span>
      <ChevronRight :size="13" :stroke-width="2" />
      <strong>{{ currentPage }}</strong>
    </div>

    <div class="profile-area">
      <div class="profile-text">
        <strong>{{ auth.userName }}</strong>
        <span>{{ roleLabel }}</span>
      </div>

      <button type="button" class="avatar-button" style="overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 0;">
        <img v-if="auth.user?.profileImage" :src="auth.user.profileImage" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;" />
        <template v-else>{{ auth.userInitials }}</template>
      </button>

      <ChevronDown :size="15" class="chevron" />

      <div class="notify-wrapper" style="position: relative;">
        <button type="button" class="notify-button" aria-label="Notifications" @click="isOpen = !isOpen">
          <Bell :size="18" :stroke-width="1.9" />
          <span v-if="unreadCount > 0" class="unread-dot"></span>
        </button>

        <!-- Dropdown Popup -->
        <div v-if="isOpen" class="notifications-dropdown">
          <div class="dropdown-header">
            <h3>Notifications</h3>
            <span v-if="unreadCount > 0">{{ unreadCount }} new</span>
          </div>
          <div class="dropdown-body">
            <template v-if="notifications.length > 0">
              <div 
                v-for="item in notifications.slice(0, 5)" 
                :key="item.id" 
                class="notification-item"
                :class="{ unread: item.unread }"
                @click="markAsRead(item)"
              >
                <div class="item-icon" :class="item.type">
                  <Megaphone v-if="item.type === 'announcement'" :size="14" />
                  <FileText v-else-if="item.type === 'assignment' || item.type === 'material'" :size="14" />
                  <BarChart3 v-else-if="item.type === 'grade'" :size="14" />
                  <MessageSquare v-else-if="item.type === 'discussion'" :size="14" />
                  <Bell v-else :size="14" />
                </div>
                <div class="item-text">
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.content }}</p>
                  <span>{{ item.time }}</span>
                </div>
              </div>
            </template>
            <div v-else class="dropdown-empty">
              No notifications yet
            </div>
          </div>
          <div v-if="auth.userRole === 'student'" class="dropdown-footer">
            <router-link to="/student/notifications" @click="isOpen = false">
              View All Notifications
            </router-link>
          </div>
        </div>
      </div>

      <button type="button" class="logout-button" @click="handleLogout">
        Logout
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Bell, ChevronDown, ChevronRight, Megaphone, FileText, BarChart3, MessageSquare } from "lucide-vue-next";

import { useAuthStore } from "../../stores/auth.store";
import { getBroadcasts } from "../../api/broadcast.api";

const props = defineProps({
  currentPage: {
    type: String,
    default: "Dashboard",
  },
});

const router = useRouter();
const auth = useAuthStore();

const notifications = ref([]);
const isOpen = ref(false);

const unreadCount = computed(() => {
  return notifications.value.filter((n) => n.unread).length;
});

const roleLabel = computed(() => {
  return auth.user?.role || "User";
});

const portalLabel = computed(() => {
  const role = auth.userRole;

  if (role === "admin") return "Admin Portal";
  if (role === "lecturer") return "Lecturer Portal";
  if (role === "student") return "Student Portal";

  return "Portal";
});

async function loadNotifications() {
  try {
    const list = [];

    // 1. Fetch backend announcements (broadcasts)
    if (import.meta.env.VITE_API_URL) {
      const res = await getBroadcasts();
      const broadcasts = res.data.broadcasts || [];
      broadcasts.forEach((b) => {
        list.push({
          id: b._id,
          title: b.title,
          content: b.content,
          type: "announcement",
          unread: true,
          time: new Date(b.createdAt).toLocaleDateString(),
        });
      });
    }



    notifications.value = list;
  } catch (err) {
    console.error("Failed to load navbar notifications:", err);
  }
}

function markAsRead(item) {
  item.unread = false;
  if (auth.userRole === "student") {
    const studentStore = useStudentStore();
    if (typeof item.id === "string" && item.id.startsWith("not-")) {
      studentStore.markNotificationRead(item.id);
    }
  }
}

async function handleLogout() {
  await auth.logout();
  router.replace("/login");
}

onMounted(() => {
  loadNotifications();
  // Refresh notifications every 60 seconds
  setInterval(loadNotifications, 60000);
});
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--page-padding-x);
  border-bottom: 1px solid #edf2f7;
  background: #ffffff;
  box-shadow: var(--shadow-topbar);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
}

.breadcrumb strong {
  color: var(--color-primary);
  font-weight: 700;
}

.profile-area {
  display: flex;
  align-items: center;
  gap: 9px;
}

.profile-text {
  text-align: right;
}

.profile-text strong {
  display: block;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
}

.profile-text span {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.avatar-button {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: #f59e0b;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
}

.chevron {
  color: #0f172a;
}

.notify-button {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid #b7c4d7;
  border-radius: 4px;
  background: #ffffff;
  color: #475569;
}

.unread-dot {
  position: absolute;
  top: 7px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ef4444;
  border: 1.5px solid #ffffff;
}

.notifications-dropdown {
  position: absolute;
  top: 48px;
  right: 0;
  width: 320px;
  max-height: 400px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #1e293b;
}

.dropdown-header span {
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  background: #fee2e2;
  padding: 2px 6px;
  border-radius: 999px;
}

.dropdown-body {
  overflow-y: auto;
  flex: 1;
}

.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f8fafc;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notification-item.unread:hover {
  background: #e1effe;
}

.item-icon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon.announcement {
  color: #dc2626;
  background: #fee2e2;
}

.item-icon.assignment,
.item-icon.material {
  color: #16a34a;
  background: #dcfce7;
}

.item-icon.grade {
  color: #d97706;
  background: #fef3c7;
}

.item-icon.discussion {
  color: #7c3aed;
  background: #f3e8ff;
}

.item-icon.info {
  color: #2563eb;
  background: #dbeafe;
}

.item-text {
  flex: 1;
  min-width: 0;
}

.item-text strong {
  display: block;
  font-size: 12px;
  color: #1e293b;
  font-weight: 800;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-text p {
  margin: 0 0 4px;
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-text span {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 600;
}

.dropdown-empty {
  padding: 32px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}

.dropdown-footer {
  padding: 10px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}

.dropdown-footer a {
  font-size: 11px;
  font-weight: 800;
  color: #0875f5;
  text-decoration: none;
}

.dropdown-footer a:hover {
  text-decoration: underline;
}

.logout-button {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #ef4444;
  border-radius: 4px;
  background: #ffffff;
  color: #ef4444;
  font-size: 12px;
  font-weight: 800;
  transition: 0.2s ease;
}

.logout-button:hover {
  background: #fef2f2;
}

@media (max-width: 900px) {
  .profile-text,
  .logout-button {
    display: none;
  }
}
</style>