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

      <div class="profile-dropdown-wrapper" ref="profileDropdownRef">
        <button
          type="button"
          class="avatar-button"
          aria-label="User profile"
          @click="toggleProfileDropdown"
        >
          <img v-if="auth.user?.profileImage" :src="auth.user.profileImage" alt="Avatar" class="avatar-img" />
          <template v-else>{{ auth.userInitials }}</template>
        </button>

        <button
          type="button"
          class="chevron-button"
          :class="{ active: isProfileOpen }"
          aria-label="Toggle profile menu"
          :aria-expanded="isProfileOpen"
          @click="toggleProfileDropdown"
        >
          <ChevronDown :size="15" class="chevron" :class="{ rotated: isProfileOpen }" />
        </button>

        <!-- Profile Dropdown Popup -->
        <transition name="dropdown-fade">
          <div v-if="isProfileOpen" class="profile-dropdown-menu">
            <div class="profile-menu-header">
              <div class="profile-menu-avatar">
                <img v-if="auth.user?.profileImage" :src="auth.user.profileImage" alt="Avatar" class="avatar-img" />
                <template v-else>{{ auth.userInitials }}</template>
              </div>
              <div class="profile-menu-info">
                <strong class="user-name">{{ auth.userName }}</strong>
                <span class="user-role">{{ roleLabel }}</span>
                <span v-if="auth.user?.identifier || auth.user?.email" class="user-email">
                  {{ auth.user?.identifier || auth.user?.email }}
                </span>
              </div>
            </div>

            <div class="profile-menu-items">
              <button type="button" class="profile-menu-item" @click="handleViewProfile">
                <User :size="15" :stroke-width="2" class="menu-icon" />
                <span>View Profile</span>
              </button>

              <button type="button" class="profile-menu-item logout-item" @click="handleLogout">
                <LogOut :size="15" :stroke-width="2" class="menu-icon" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </transition>
      </div>

      <div class="notify-wrapper" ref="notifyDropdownRef" style="position: relative;">
        <button type="button" class="notify-button" aria-label="Notifications" @click="toggleNotifications">
          <Bell :size="18" :stroke-width="1.9" />
          <span v-if="unreadCount > 0" class="unread-dot"></span>
        </button>

        <!-- Dropdown Popup -->
        <div v-if="isOpen" class="notifications-dropdown">
          <div class="dropdown-header">
            <h3>Notifications</h3>
            <span v-if="unreadCount > 0">{{ unreadCount }} new</span>
            <button
              v-if="unreadCount > 0"
              type="button"
              class="mark-all-btn"
              @click.stop="notificationsStore.markAllRead()"
            >
              Mark all read
            </button>
          </div>
          <div class="dropdown-body">
            <template v-if="notifications.length > 0">
              <div 
                v-for="item in notifications.slice(0, 5)" 
                :key="item.id" 
                class="notification-item"
                :class="{ unread: item.unread }"
                @click="openNotification(item)"
              >
                <div class="item-icon" :class="item.type">
                  <Megaphone v-if="item.type === 'announcement'" :size="14" />
                  <MessageSquare v-else-if="item.type === 'discussion' || item.type === 'reply'" :size="14" />
                  <Bell v-else :size="14" />
                </div>
                <div class="item-text">
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.message }}</p>
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
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Megaphone,
  MessageSquare,
  User,
  LogOut,
} from "lucide-vue-next";

import { useAuthStore } from "../../stores/auth.store";
import { useNotificationsStore } from "../../stores/notifications.store";

defineProps({
  currentPage: {
    type: String,
    default: "Dashboard",
  },
});

const router = useRouter();
const auth = useAuthStore();

const notificationsStore = useNotificationsStore();
const notifications = computed(() => notificationsStore.items);
const isOpen = ref(false);
const isProfileOpen = ref(false);
const profileDropdownRef = ref(null);
const notifyDropdownRef = ref(null);

const unreadCount = computed(() => notificationsStore.unreadCount);

const roleLabel = computed(() => {
  if (auth.user?.role === "platform_admin") return "Platform Admin";
  return auth.user?.role || "User";
});

const portalLabel = computed(() => {
  const role = auth.userRole;

  if (role === "admin") return "Admin Portal";
  if (role === "lecturer") return "Lecturer Portal";
  if (role === "student") return "Student Portal";
  if (role === "platform_admin") return "Platform Console";

  return "Portal";
});

function toggleProfileDropdown() {
  isProfileOpen.value = !isProfileOpen.value;
  if (isProfileOpen.value) {
    isOpen.value = false;
  }
}

function toggleNotifications() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    isProfileOpen.value = false;
  }
}

function handleViewProfile() {
  isProfileOpen.value = false;
  const role = auth.userRole;
  if (role === "platform_admin") {
    router.push("/platform-admin/institutions");
  } else if (role === "admin") {
    router.push("/admin/settings");
  } else if (role === "lecturer") {
    router.push("/lecturer/settings");
  } else {
    router.push("/student/settings");
  }
}

function handleDocumentClick(event) {
  if (
    profileDropdownRef.value &&
    !profileDropdownRef.value.contains(event.target)
  ) {
    isProfileOpen.value = false;
  }
  if (
    notifyDropdownRef.value &&
    !notifyDropdownRef.value.contains(event.target)
  ) {
    isOpen.value = false;
  }
}

function loadNotifications() {
  return notificationsStore.fetch();
}

// Mark as read on the server, then go to the discussion it is about.
function openNotification(item) {
  notificationsStore.markRead(item.id);
  if (item.link) {
    isOpen.value = false;
    router.push(item.link);
  }
}

async function handleLogout() {
  isProfileOpen.value = false;
  await auth.logout();
  router.replace("/");
}

let notificationInterval = null;

onMounted(() => {
  loadNotifications();
  notificationInterval = setInterval(loadNotifications, 60000);
  document.addEventListener("click", handleDocumentClick);
});

onUnmounted(() => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  document.removeEventListener("click", handleDocumentClick);
});

watch(
  () => router.currentRoute.value.fullPath,
  () => {
    isProfileOpen.value = false;
    isOpen.value = false;
  }
);
</script>

<style scoped>
.mark-all-btn {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: #0875f5;
  font-size: 12px;
  font-weight: 800;
}

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

.profile-dropdown-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 3px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.avatar-button:hover {
  transform: scale(1.03);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chevron-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  padding: 3px;
  background: transparent;
  border: 0;
  border-radius: 4px;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.chevron-button:hover,
.chevron-button.active {
  background: #f1f5f9;
  color: #0f172a;
}

.chevron {
  color: inherit;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.chevron.rotated {
  transform: rotate(180deg);
}

.profile-dropdown-menu {
  position: absolute;
  top: 48px;
  right: 0;
  width: 230px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.profile-menu-header {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.profile-menu-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #f59e0b;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.profile-menu-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.profile-menu-info .user-name {
  font-size: 13px;
  font-weight: 800;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.profile-menu-info .user-role {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: capitalize;
  margin-top: 2px;
}

.profile-menu-info .user-email {
  font-size: 10.5px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.profile-menu-items {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  text-align: left;
}

.profile-menu-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.profile-menu-item .menu-icon {
  color: #64748b;
  transition: color 0.15s ease;
}

.profile-menu-item:hover .menu-icon {
  color: #0f172a;
}

.profile-menu-item.logout-item {
  color: #ef4444;
}

.profile-menu-item.logout-item .menu-icon {
  color: #ef4444;
}

.profile-menu-item.logout-item:hover {
  background: #fef2f2;
  color: #dc2626;
}

.profile-menu-item.logout-item:hover .menu-icon {
  color: #dc2626;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
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
  gap: 8px;
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