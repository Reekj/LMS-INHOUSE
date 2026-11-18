<template>
  <section class="student-settings-page">
    <div class="page-heading">
      <h1>Settings</h1>
      <p>Manage your account preferences and system notifications</p>
    </div>

    <div class="settings-grid">
      <main>
        <section class="settings-card profile-card">
          <h2>Personal Profile</h2>

          <div class="photo-row">
            <div class="profile-avatar">
              <img v-if="profilePhoto" :src="profilePhoto" alt="Profile" />
              <span v-else>{{ form.initials }}</span>
            </div>

            <div class="photo-actions">
              <div>
                <button type="button" class="outline-btn" @click="photoInput?.click()">
                  Change Photo
                </button>

                <button type="button" class="remove-btn" @click="removePhoto">
                  Remove
                </button>
              </div>

              <p>JPG or PNG. Max size 2MB</p>

              <input
                ref="photoInput"
                type="file"
                hidden
                accept="image/png,image/jpeg"
                @change="handlePhotoUpload"
              />
            </div>
          </div>

          <form class="profile-form" @submit.prevent="updateProfile">
            <label>
              Department
              <input v-model.trim="form.department" type="text" disabled readonly />
            </label>

            <label>
              Level
              <input v-model.trim="form.level" type="text" disabled readonly />
            </label>

            <label>
              Matric No.
              <input v-model.trim="form.matricNo" type="text" disabled readonly />
            </label>

            <label>
              First Name
              <input v-model.trim="form.firstName" type="text" />
            </label>

            <label>
              Last Name
              <input v-model.trim="form.lastName" type="text" />
            </label>

            <label>
              Phone Number
              <input v-model.trim="form.phone" type="tel" />
            </label>

            <label>
              Email
              <input v-model.trim="form.email" type="email" />
            </label>

            <p v-if="profileMessage" class="success-message">{{ profileMessage }}</p>
            <p v-if="profileError" class="error-message">{{ profileError }}</p>

            <div class="form-actions">
              <button type="submit" class="green-btn">
                Update Profile
              </button>
            </div>
          </form>
        </section>

        <section class="settings-card security-card">
          <h2>Security & Access</h2>

          <form class="security-form" @submit.prevent="changePassword">
            <label class="full">
              Current Password
              <input v-model.trim="password.current" type="password" />
            </label>

            <label>
              New Password
              <input v-model.trim="password.new" type="password" />
            </label>

            <label>
              Confirm New Password
              <input v-model.trim="password.confirm" type="password" />
            </label>

            <p v-if="passwordMessage" class="success-message full">
              {{ passwordMessage }}
            </p>

            <p v-if="passwordError" class="error-message full">
              {{ passwordError }}
            </p>

            <div class="password-actions full">
              <button type="submit" class="outline-btn large">
                Change Password
              </button>
            </div>
          </form>
        </section>
      </main>

      <aside class="side-column">
        <section class="settings-card side-card">
          <h2>Notifications</h2>

          <label
            v-for="item in notifications"
            :key="item.key"
            class="check-row"
          >
            <input v-model="item.enabled" type="checkbox" />
            <span>{{ item.label }}</span>
          </label>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { useAuthStore } from "../../stores/auth.store";
import { useStudentStore } from "../../stores/student.store";
import { changePassword as apiChangePassword, uploadPhoto as uploadPhotoApi, removePhoto as removePhotoApi } from "../../api/auth.api";
import { updateUser } from "../../api/user.api";

const authStore = useAuthStore();
const studentStore = useStudentStore();

const photoInput = ref(null);
const profilePhoto = ref("");
const profileMessage = ref("");
const profileError = ref("");
const passwordMessage = ref("");
const passwordError = ref("");

const form = reactive({
  initials: "",
  department: "",
  level: "",
  matricNo: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
});

const password = reactive({
  current: "",
  new: "",
  confirm: "",
});

const notifications = reactive([
  {
    key: "materials",
    label: "Email for new materials",
    enabled: true,
  },
  {
    key: "deadlines",
    label: "Assignment deadlines",
    enabled: true,
  },
  {
    key: "discussion",
    label: "Discussion chat replies",
    enabled: false,
  },
  {
    key: "push",
    label: "Push Notifications",
    enabled: true,
  },
]);

const getUserStorageKey = () => {
  const uid = authStore.user?.id || authStore.user?._id || authStore.user?.email || "guest";
  return `uniosun_lms_student_settings_${uid}`;
};

function populateFromUser() {
  const user = authStore.user;
  if (!user) return;

  const fullName = user.name || "";
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = user.firstName || nameParts[0] || "";
  const lastName = user.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

  // Form fields strictly bind to the currently logged in user
  form.firstName = firstName;
  form.lastName = lastName;
  form.email = user.email || "";
  form.matricNo = user.identifier || user.matricNo || "";
  form.department = user.department || "Nursing";
  form.level = user.level || "100L";
  form.phone = user.phone || form.phone || "";
  form.initials = authStore.userInitials || `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "ST";

  if (user.profileImage) {
    profilePhoto.value = user.profileImage;
  }

  loadUserSettings();
}

function loadUserSettings() {
  try {
    // Clear obsolete global key that leaked another user's profile
    localStorage.removeItem("uniosun_lms_student_settings_v1");

    const key = getUserStorageKey();
    const saved = JSON.parse(localStorage.getItem(key) || "{}");

    // Clean up any legacy department from user settings storage
    if (saved.department) {
      delete saved.department;
      localStorage.setItem(key, JSON.stringify(saved));
    }

    // Only load saved phone if not provided by authStore
    if (saved.phone && typeof saved.phone === "string" && !form.phone) {
      form.phone = saved.phone.trim();
    }

    if (saved.profilePhoto && !profilePhoto.value) {
      profilePhoto.value = saved.profilePhoto;
    }

    if (Array.isArray(saved.notifications)) {
      saved.notifications.forEach((savedItem) => {
        const target = notifications.find((item) => item.key === savedItem.key);
        if (target) target.enabled = Boolean(savedItem.enabled);
      });
    }
  } catch (e) {
    console.error("Error loading student settings:", e);
  }
}

watch(
  () => authStore.user,
  () => {
    populateFromUser();
  },
  { deep: true, immediate: true }
);

function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

watch(
  notifications,
  () => {
    persistSettings();
  },
  { deep: true }
);

function persistSettings() {
  if (!authStore.user) return;

  const key = getUserStorageKey();
  localStorage.setItem(
    key,
    JSON.stringify({
      phone: form.phone,
      profilePhoto: profilePhoto.value,
      notifications,
    })
  );
}

async function handlePhotoUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) return;

  if (!["image/jpeg", "image/png"].includes(file.type)) {
    profileError.value = "Only JPG and PNG images are allowed.";
    profileMessage.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    profileError.value = "Photo must not be larger than 2MB.";
    profileMessage.value = "";
    return;
  }

  if (import.meta.env.VITE_API_URL && authStore.user) {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await uploadPhotoApi(authStore.user.id, formData);
      if (res.data && res.data.profileImage) {
        profilePhoto.value = res.data.profileImage;
        authStore.user.profileImage = res.data.profileImage;
        localStorage.setItem("uniosun_lms_auth", JSON.stringify({ user: authStore.user, token: authStore.token }));
        profileError.value = "";
        profileMessage.value = "Profile photo updated successfully!";
        persistSettings();
      }
    } catch (err) {
      console.error("Failed to upload photo:", err);
      profileError.value = err.response?.data?.error || err.message || "Failed to upload photo.";
      profileMessage.value = "";
    }
  } else {
    const reader = new FileReader();
    reader.onload = () => {
      profilePhoto.value = String(reader.result || "");
      profileError.value = "";
      profileMessage.value = "Profile photo updated locally (Offline mode).";
      persistSettings();
      if (authStore.user) {
        authStore.user.profileImage = profilePhoto.value;
        localStorage.setItem("uniosun_lms_auth", JSON.stringify({ user: authStore.user, token: authStore.token }));
      }
    };
    reader.readAsDataURL(file);
  }
}

async function removePhoto() {
  if (import.meta.env.VITE_API_URL && authStore.user) {
    try {
      await removePhotoApi(authStore.user.id);
      profilePhoto.value = "";
      authStore.user.profileImage = "";
      localStorage.setItem("uniosun_lms_auth", JSON.stringify({ user: authStore.user, token: authStore.token }));
      profileError.value = "";
      profileMessage.value = "Profile photo removed successfully!";
      persistSettings();
    } catch (err) {
      console.error("Failed to remove photo:", err);
      profileError.value = err.response?.data?.error || err.message || "Failed to remove photo.";
      profileMessage.value = "";
    }
  } else {
    profilePhoto.value = "";
    profileMessage.value = "Profile photo removed.";
    profileError.value = "";
    persistSettings();
    if (authStore.user) {
      authStore.user.profileImage = "";
      localStorage.setItem("uniosun_lms_auth", JSON.stringify({ user: authStore.user, token: authStore.token }));
    }
  }
}

async function updateProfile() {
  profileError.value = "";
  profileMessage.value = "";

  const firstName = sanitizeText(form.firstName);
  const lastName = sanitizeText(form.lastName);
  const phone = sanitizeText(form.phone);
  const email = sanitizeText(form.email);
  const department = authStore.user?.department || form.department || "Nursing";

  if (!firstName || !lastName || !email) {
    profileError.value = "Please complete all required profile fields.";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    profileError.value = "Enter a valid email address.";
    return;
  }

  if (import.meta.env.VITE_API_URL && authStore.user) {
    try {
      const payload = {
        name: `${firstName} ${lastName}`.trim(),
        email: email,
        phone: phone,
        department: department,
      };
      const res = await updateUser(authStore.user.id, payload);
      if (res.data && res.data.user) {
        authStore.user.name = res.data.user.name;
        authStore.user.email = res.data.user.email;
        authStore.user.phone = res.data.user.phone || phone;
        authStore.user.department = res.data.user.department || department;
        localStorage.setItem("uniosun_lms_auth", JSON.stringify({ user: authStore.user, token: authStore.token }));
      }
    } catch (err) {
      console.error("Failed to update student profile:", err);
      profileError.value = err.response?.data?.error || err.message || "Failed to update profile.";
      return;
    }
  }

  form.firstName = firstName;
  form.lastName = lastName;
  form.phone = phone;
  form.email = email;
  form.department = department;
  form.initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  if (authStore.user) {
    authStore.user.name = `${firstName} ${lastName}`.trim();
    authStore.user.email = email;
    authStore.user.phone = phone;
    authStore.user.department = department;
    localStorage.setItem("uniosun_lms_auth", JSON.stringify({ user: authStore.user, token: authStore.token }));
  }

  if (studentStore.currentStudent) {
    studentStore.currentStudent.department = department;
    studentStore.currentStudent.name = `${firstName} ${lastName}`.trim();
    studentStore.currentStudent.firstName = firstName;
    studentStore.currentStudent.initials = form.initials;
    studentStore.currentStudent.phone = phone;
    studentStore.persist();
  }

  profileMessage.value = "Profile updated successfully.";
  persistSettings();
}

async function changePassword() {
  passwordError.value = "";
  passwordMessage.value = "";

  if (!password.current || !password.new || !password.confirm) {
    passwordError.value = "Please complete all password fields.";
    return;
  }

  if (password.new.length < 8) {
    passwordError.value = "New password must be at least 8 characters.";
    return;
  }

  if (password.new !== password.confirm) {
    passwordError.value = "New password and confirmation do not match.";
    return;
  }

  if (import.meta.env.VITE_API_URL) {
    try {
      await apiChangePassword({
        currentPassword: password.current,
        newPassword: password.new,
        confirmPassword: password.confirm,
      });
      passwordMessage.value = "Password changed successfully.";
      password.current = "";
      password.new = "";
      password.confirm = "";
    } catch (err) {
      console.error("Failed to change password:", err);
      passwordError.value = err.response?.data?.error || err.message || "Failed to update password.";
    }
  } else {
    password.current = "";
    password.new = "";
    password.confirm = "";
    passwordMessage.value = "Password changed successfully (Mock).";
  }
}
</script>

<style scoped>
.student-settings-page {
  color: #0f172a;
}

.page-heading {
  margin-bottom: 24px;
}

.page-heading h1 {
  margin: 0 0 8px;
  color: #111827;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 28px;
  font-weight: 900;
}

.page-heading p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 775px) 334px;
  gap: 20px;
  align-items: start;
}

.settings-card {
  border: 1px solid #cbd8ea;
  border-radius: 16px;
  background: #ffffff;
}

.profile-card {
  min-height: 386px;
  padding: 24px;
}

.security-card {
  min-height: 256px;
  margin-top: 20px;
  padding: 24px;
}

.side-card {
  padding: 20px;
}

.settings-card h2 {
  margin: 0 0 18px;
  color: #111827;
  font-size: 16px;
  font-weight: 900;
}

.photo-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.profile-avatar {
  width: 49px;
  height: 49px;
  display: grid;
  place-items: center;
  flex: 0 0 49px;
  overflow: hidden;
  border-radius: 999px;
  background: #1e3a8a;
  color: #ffffff;
  font-size: 16px;
  font-weight: 900;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-actions {
  display: grid;
  gap: 8px;
}

.photo-actions > div {
  display: flex;
  gap: 8px;
}

.photo-actions p {
  margin: 0;
  color: #64748b;
  font-size: 11px;
}

.outline-btn,
.remove-btn,
.green-btn {
  height: 30px;
  border-radius: 4px;
  padding: 0 13px;
  font-size: 12px;
  font-weight: 900;
}

.outline-btn {
  border: 1px solid #16a34a;
  background: white;
  color: #16a34a;
}

.outline-btn.large {
  height: 32px;
  padding: 0 16px;
}

.remove-btn,
.green-btn {
  border: 1px solid #16a34a;
  background: #16a34a;
  color: white;
}

.profile-form,
.security-form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 15px;
}

.security-form {
  grid-template-columns: repeat(2, 1fr);
}

.profile-form label,
.security-form label {
  display: grid;
  gap: 7px;
  color: #334155;
  font-size: 11px;
  font-weight: 800;
}

.profile-form label:nth-of-type(4),
.profile-form label:nth-of-type(6) {
  grid-column: span 1;
}

.profile-form label:nth-of-type(5),
.profile-form label:nth-of-type(7) {
  grid-column: span 2;
}

.security-form .full {
  grid-column: 1 / -1;
}

.profile-form input,
.security-form input {
  width: 100%;
  height: 32px;
  border: 1px solid #d5deeb;
  border-radius: 4px;
  padding: 0 10px;
  color: #334155;
  background: white;
  font-size: 13px;
  font-weight: 700;
  outline: none;
}

.profile-form input:disabled,
.profile-form input:read-only:disabled {
  background: #f1f5f9;
  color: #64748b;
  border-color: #cbd5e1;
  cursor: not-allowed;
  user-select: none;
  -webkit-user-select: none;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
}

.password-actions {
  display: flex;
  justify-content: flex-start;
}

.check-row {
  min-height: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
}

.check-row input {
  width: 15px;
  height: 15px;
  accent-color: #16a34a;
}

.success-message,
.error-message {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 12px;
  font-weight: 900;
}

.success-message {
  color: #16a34a;
}

.error-message {
  color: #dc2626;
}

@media (max-width: 1120px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .profile-form,
  .security-form {
    grid-template-columns: 1fr;
  }

  .profile-form label:nth-of-type(5),
  .profile-form label:nth-of-type(7) {
    grid-column: span 1;
  }

  .photo-row {
    align-items: flex-start;
  }
}
</style>