<template>
  <div class="settings-page">
    <div class="page-header">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">
        Manage your account preferences and system configuration
      </p>
    </div>

    <div class="settings-grid">
      <main class="settings-main">
        <section class="settings-card profile-card">
          <h2>Personal Profile</h2>

          <div class="profile-top">
            <div class="avatar" style="overflow: hidden; display: flex; align-items: center; justify-content: center;">
              <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;" />
              <template v-else>{{ initials }}</template>
            </div>

            <div class="profile-actions">
              <div class="button-row">
                <label class="outline-btn" style="cursor: pointer; display: inline-block; margin: 0;">
                  Change Photo
                  <input type="file" ref="fileInput" accept="image/*" @change="onPhotoSelected" style="display: none;" />
                </label>

                <button class="danger-btn" @click="handleRemovePhoto">
                  Remove
                </button>
              </div>

              <p>JPG or PNG. Max size 200KB</p>
            </div>
          </div>

          <div class="form-grid">
            <label class="form-label">
              First Name
              <input v-model.trim="profile.firstName" class="form-input" />
            </label>

            <label class="form-label">
              Last Name
              <input v-model.trim="profile.lastName" class="form-input" />
            </label>

            <label class="form-label">
              Phone Number
              <input v-model.trim="profile.phone" class="form-input" />
            </label>

            <label class="form-label">
              Email
              <input v-model.trim="profile.email" class="form-input" />
            </label>
          </div>

          <div class="actions-row">
            <AppButton @click="saveProfile">
              Update Profile
            </AppButton>
          </div>
        </section>

        <section class="settings-card">
          <h2>Grading Policy</h2>

          <div class="grading-grid">
            <label
              v-for="grade in grades"
              :key="grade.label"
              class="form-label"
            >
              {{ grade.label }}

              <input
                v-model.number="grade.value"
                class="form-input"
                type="number"
              />
            </label>
          </div>

          <div class="toggle-row">
            <div>
              <strong>Show grades instantly</strong>
              <p>Students see results immediately after submission.</p>
            </div>

            <AppToggle v-model="showGrades" />
          </div>

          <div class="actions-row">
            <AppButton @click="savePolicy">
              Save Policy
            </AppButton>
          </div>
        </section>

        <section class="settings-card">
          <div class="section-header">
            <h2>Integrations</h2>
            <span>{{ connectedIntegrations }} Connected</span>
          </div>

          <div
            v-for="integration in integrations"
            :key="integration.id"
            class="integration-row"
          >
            <div>
              <h3>{{ integration.name }}</h3>
              <p>{{ integration.description }}</p>
            </div>

            <div class="integration-actions">
              <AppBadge :type="integration.badgeType">
                {{ integration.status }}
              </AppBadge>

              <AppToggle v-model="integration.enabled" />
            </div>
          </div>
        </section>

        <section class="settings-card">
          <h2>API Access</h2>

          <div class="api-key-box">
            <span>
              {{ revealApiKey ? apiKey : maskedKey }}
            </span>
          </div>

          <div class="api-actions">
            <button
              class="outline-btn"
              @click="revealApiKey = !revealApiKey"
            >
              {{ revealApiKey ? "Hide Key" : "Reveal Key" }}
            </button>

            <button class="outline-btn" @click="regenerateApiKey">
              Regenerate Key
            </button>
          </div>
        </section>
      </main>

      <aside class="settings-sidebar">
        <section class="settings-card sidebar-card">
          <h2>Access & Authentication</h2>

          <label
            v-for="setting in accessSettings"
            :key="setting.label"
            class="checkbox-row"
          >
            <input type="checkbox" v-model="setting.enabled" />
            <span>{{ setting.label }}</span>
          </label>
        </section>

        <section class="settings-card sidebar-card">
          <h2>Platform Preferences</h2>

          <label
            v-for="setting in platformSettings"
            :key="setting.label"
            class="checkbox-row"
          >
            <input type="checkbox" v-model="setting.enabled" />
            <span>{{ setting.label }}</span>
          </label>
        </section>

        <section class="settings-card status-card">
          <h2>Configuration Status</h2>

          <div class="status-item">
            <span>Profile</span>
            <AppBadge type="success">Saved</AppBadge>
          </div>

          <div class="status-item">
            <span>Integrations</span>
            <AppBadge type="success">Active</AppBadge>
          </div>

          <div class="status-item">
            <span>API Access</span>
            <AppBadge type="warning">Restricted</AppBadge>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth.store";
import { updateUser } from "../../api/user.api";
import { uploadPhoto, removePhoto } from "../../api/auth.api";

import AppButton from "../../components/common/AppButton.vue";
import AppBadge from "../../components/common/AppBadge.vue";
import AppToggle from "../../components/common/AppToggle.vue";

const revealApiKey = ref(false);
const authStore = useAuthStore();

const profile = reactive({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  avatarUrl: "",
});

const fileInput = ref(null);

onMounted(() => {
  if (authStore.user) {
    const fullName = authStore.user.name || "";
    const nameParts = fullName.split(" ");
    profile.firstName = nameParts[0] || "";
    profile.lastName = nameParts.slice(1).join(" ") || "";
    profile.email = authStore.user.email || "";
    profile.phone = authStore.user.phone || "+234 803 456 7890";
    profile.avatarUrl = authStore.user.profileImage || "";
  } else {
    // Offline fallback default profile values
    profile.firstName = "Adeyinka";
    profile.lastName = "Oladapo";
    profile.phone = "+234 803 456 7890";
    profile.email = "a.oladapo@uniosun.edu.ng";
    profile.avatarUrl = "";
  }
});

const grades = reactive([
  { label: "A (%)", value: 70 },
  { label: "B (%)", value: 60 },
  { label: "C (%)", value: 50 },
  { label: "D (%)", value: 45 },
  { label: "F (%)", value: 0 },
]);

const showGrades = ref(true);

const integrations = reactive([
  {
    id: 1,
    name: "UNIOSUN Student Portal",
    description: "SSO and student records synchronization",
    status: "Connected",
    badgeType: "success",
    enabled: true,
  },
  {
    id: 2,
    name: "SMTP Mail Service",
    description: "Notifications and transactional email",
    status: "Active",
    badgeType: "success",
    enabled: true,
  },
  {
    id: 3,
    name: "Cloud Storage",
    description: "Video and course file storage",
    status: "78% Capacity",
    badgeType: "warning",
    enabled: true,
  },
  {
    id: 4,
    name: "Analytics Engine",
    description: "Advanced reporting and insights",
    status: "Disconnected",
    badgeType: "info",
    enabled: false,
  },
]);

const accessSettings = reactive([
  {
    label: "Single Sign-On (SSO)",
    enabled: true,
  },
  {
    label: "Two-factor Authentication",
    enabled: true,
  },
  {
    label: "Force Password Reset",
    enabled: false,
  },
  {
    label: "Session Timeout (30 mins)",
    enabled: true,
  },
]);

const platformSettings = reactive([
  {
    label: "Allow Self Enrollment",
    enabled: true,
  },
  {
    label: "Public Course Catalogue",
    enabled: false,
  },
  {
    label: "Maintenance Mode",
    enabled: false,
  },
  {
    label: "Activity Logging",
    enabled: true,
  },
]);

const apiKey = ref("demo-api-key-uniosun-admin");

const maskedKey = computed(() => {
  return "demo-api-key-••••••••••••";
});

const initials = computed(() => {
  return (
    profile.firstName.charAt(0) +
    profile.lastName.charAt(0)
  ).toUpperCase();
});

const connectedIntegrations = computed(() => {
  return integrations.filter((item) => item.enabled).length;
});

async function saveProfile() {
  profile.firstName = profile.firstName.replace(/[<>]/g, "").trim();
  profile.lastName = profile.lastName.replace(/[<>]/g, "").trim();
  profile.phone = profile.phone.replace(/[<>]/g, "").trim();
  profile.email = profile.email.replace(/[<>]/g, "").trim();

  if (import.meta.env.VITE_API_URL && authStore.user) {
    try {
      const payload = {
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
      };
      const res = await updateUser(authStore.user.id, payload);
      if (res.data && res.data.user) {
        authStore.user.name = res.data.user.name;
        authStore.user.email = res.data.user.email;
        localStorage.setItem("uniosun_lms_auth", JSON.stringify({ user: authStore.user, token: authStore.token }));
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert(err.response?.data?.error || err.message || "Failed to update profile.");
    }
  } else {
    alert("Profile saved locally (Offline mode).");
  }
}

function savePolicy() {
  grades.forEach((grade) => {
    grade.value = Number(grade.value) || 0;
  });
}

function regenerateApiKey() {
  apiKey.value = `demo-api-key-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

async function onPhotoSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 200 * 1024) {
    alert("Image must be less than 200KB");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  if (import.meta.env.VITE_API_URL && authStore.user) {
    try {
      const res = await uploadPhoto(authStore.user.id, formData);
      if (res.data && res.data.profileImage) {
        profile.avatarUrl = res.data.profileImage;
        authStore.user.profileImage = res.data.profileImage;
        localStorage.setItem("uniosun_lms_auth", JSON.stringify({ user: authStore.user, token: authStore.token }));
        alert("Profile photo updated successfully!");
      }
    } catch (err) {
      console.error("Failed to upload photo:", err);
      alert(err.response?.data?.error || err.message || "Failed to upload photo.");
    }
  } else {
    // Offline local simulation fallback
    const reader = new FileReader();
    reader.onload = (e) => {
      profile.avatarUrl = e.target.result;
      alert("Photo uploaded locally (Offline mode).");
    };
    reader.readAsDataURL(file);
  }
}

async function handleRemovePhoto() {
  if (import.meta.env.VITE_API_URL && authStore.user) {
    try {
      await removePhoto(authStore.user.id);
      profile.avatarUrl = "";
      authStore.user.profileImage = "";
      localStorage.setItem("uniosun_lms_auth", JSON.stringify({ user: authStore.user, token: authStore.token }));
      alert("Profile photo removed successfully!");
    } catch (err) {
      console.error("Failed to remove photo:", err);
      alert(err.response?.data?.error || err.message || "Failed to remove photo.");
    }
  } else {
    profile.avatarUrl = "";
    alert("Photo removed locally (Offline mode).");
  }
}
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 24px;
}

.settings-main {
  display: grid;
  gap: 22px;
}

.settings-sidebar {
  display: grid;
  gap: 18px;
}

.settings-card {
  background: white;
  border: 1px solid #d5deeb;
  border-radius: 10px;
  padding: 24px;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.settings-card h2 {
  margin: 0 0 20px;
  color: #1e293b;
  font-size: 18px;
  font-weight: 900;
}

.profile-top {
  display: flex;
  gap: 18px;
  margin-bottom: 20px;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: #8b5cf6;
  color: white;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 900;
}

.button-row {
  display: flex;
  gap: 8px;
}

.profile-actions p {
  margin-top: 10px;
  color: #94a3b8;
  font-size: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.grading-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  margin-top: 22px;
}

.toggle-row strong {
  display: block;
  margin-bottom: 4px;
}

.toggle-row p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-header span {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
}

.integration-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid #edf2f7;
}

.integration-row:last-child {
  border-bottom: none;
}

.integration-row h3 {
  margin: 0 0 6px;
  font-size: 14px;
}

.integration-row p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.integration-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.api-key-box {
  display: flex;
  align-items: center;
  min-height: 42px;
  border: 1px solid #d7e0eb;
  border-radius: 4px;
  padding: 0 12px;
  font-weight: 700;
  overflow-x: auto;
}

.api-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.outline-btn,
.danger-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 800;
  transition: 0.2s ease;
}

.outline-btn {
  border: 1px solid #16a34a;
  background: white;
  color: #16a34a;
}

.outline-btn:hover {
  background: #f0fdf4;
}

.danger-btn {
  border: 1px solid #ef4444;
  background: white;
  color: #ef4444;
}

.danger-btn:hover {
  background: #fef2f2;
}

.checkbox-row {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  color: #64748b;
  font-weight: 600;
}

.checkbox-row input {
  accent-color: #16a34a;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
}

@media (max-width: 1100px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .form-grid,
  .grading-grid {
    grid-template-columns: 1fr;
  }

  .profile-top {
    flex-direction: column;
  }
}
</style>