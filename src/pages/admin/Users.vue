<template>
  <div class="users-page">
    <div class="page-header users-header">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">Manage students, lecturers, and administrators</p>
      </div>

      <AppButton v-if="authStore.userRole === 'admin'" @click="openAddUser">Add User</AppButton>
    </div>

    <div class="filters-card">
      <div class="filters-row">
        <div class="search-container">
          <AppSearch
            v-model="search"
            placeholder="Search by name, ID, or email..."
          />
        </div>

        <AppSelect v-model="roleFilter">
          <option value="">All Roles</option>
          <option value="Student">Student</option>
          <option v-if="authStore.userRole === 'admin'" value="Lecturer">Lecturer</option>
          <option v-if="authStore.userRole === 'admin'" value="Admin">Admin</option>
        </AppSelect>

        <AppSelect v-model="facultyFilter">
          <option value="">All Faculties</option>
          <option value="Science, Eng & Technology">Science, Eng & Technology</option>
          <option value="Management & Social Sci.">Management & Social Sci.</option>
          <option value="Health Sciences">Health Sciences</option>
          <option value="Humanities & Culture">Humanities & Culture</option>
        </AppSelect>
      </div>
    </div>

    <AppTable>
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Faculty & Department</th>
          <th>Status</th>
          <th>Last Login</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td>
            <div class="user-cell">
              <div class="avatar" :class="user.role.toLowerCase()">
                {{ getInitials(user.name) }}
              </div>

              <div>
                <strong>{{ user.name }}</strong>
                <span>{{ user.identifier }}</span>
              </div>
            </div>
          </td>

          <td>{{ user.role }}</td>
          <td>
            <div style="font-weight: 800; color: #1e293b; font-size: 13.5px;">{{ user.department }}</div>
            <div style="font-size: 11.5px; color: #64748b; margin-top: 1px;">{{ user.faculty }}</div>
          </td>

          <td>
            <AppBadge :type="user.status === 'Active' ? 'success' : 'danger'">
              {{ user.status }}
            </AppBadge>
          </td>

          <td>{{ user.lastLogin }}</td>

          <td>
            <button class="action-btn" @click="openEditUser(user)">
              Edit
            </button>
          </td>
        </tr>
      </tbody>
    </AppTable>

    <AppModal v-model="isModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2>{{ modalMode === "add" ? "Add User" : "Edit User" }}</h2>
            <p>
              {{ modalMode === "add"
                ? "Create a new LMS user account."
                : "Update user details and account status." }}
            </p>
          </div>

          <button type="button" class="close-btn" @click="closeModal">×</button>
        </div>

        <form @submit.prevent="handleSaveUser">
          <div class="form-grid">
            <label class="form-label">
              Full Name
              <input
                v-model.trim="userForm.name"
                class="form-input"
                maxlength="80"
                autocomplete="off"
              />
            </label>

            <label class="form-label">
              Identifier / Matric No.
              <input
                v-model.trim="userForm.identifier"
                class="form-input"
                maxlength="40"
                autocomplete="off"
                :disabled="authStore.userRole !== 'admin'"
              />
            </label>

            <label class="form-label">
              Email
              <input
                v-model.trim="userForm.email"
                class="form-input"
                type="email"
                maxlength="120"
                autocomplete="off"
              />
            </label>

            <label class="form-label">
              Role
              <select v-model="userForm.role" class="form-select" :disabled="authStore.userRole !== 'admin'">
                <option>Student</option>
                <option>Lecturer</option>
                <option>Admin</option>
              </select>
            </label>

            <label class="form-label">
              Faculty
              <select v-model="userForm.faculty" class="form-select" @change="onFacultyChange">
                <option value="">Select Faculty</option>
                <option v-for="(deps, fac) in facultyDepartments" :key="fac" :value="fac">
                  {{ fac }}
                </option>
              </select>
            </label>

            <label class="form-label">
              Department
              <select v-model="userForm.department" class="form-select" :disabled="!userForm.faculty">
                <option value="">Select Department</option>
                <option v-for="dep in selectableDepartments" :key="dep" :value="dep">
                  {{ dep }}
                </option>
              </select>
            </label>

            <label class="form-label">
              Last Login
              <input
                v-model.trim="userForm.lastLogin"
                class="form-input"
                disabled
              />
            </label>
          </div>

          <div class="status-row">
            <div>
              <strong>Account Status</strong>
              <span>{{ userForm.isActive ? "Active" : "Inactive" }}</span>
            </div>

            <AppToggle v-model="userForm.isActive" :disabled="authStore.userRole !== 'admin'" />
          </div>

          <p v-if="formError" class="form-error">{{ formError }}</p>

          <div class="modal-actions">
            <AppButton type="button" variant="secondary" @click="closeModal">
              Cancel
            </AppButton>

            <AppButton type="submit">
              {{ modalMode === "add" ? "Create User" : "Save Changes" }}
            </AppButton>
          </div>
        </form>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";

import AppBadge from "../../components/common/AppBadge.vue";
import AppButton from "../../components/common/AppButton.vue";
import AppModal from "../../components/common/AppModal.vue";
import AppSearch from "../../components/common/AppSearch.vue";
import AppSelect from "../../components/common/AppSelect.vue";
import AppToggle from "../../components/common/AppToggle.vue";
import AppTable from "../../components/tables/AppTable.vue";
import { getAllUsers, createUser, updateUser } from "../../api/user.api";
import { useAuthStore } from "../../stores/auth.store";

const authStore = useAuthStore();
const search = ref("");
const roleFilter = ref("");
const facultyFilter = ref("");
const isModalOpen = ref(false);
const modalMode = ref("add");
const editingUserId = ref(null);
const formError = ref("");

const users = ref([]);

const facultyDepartments = {
  "Science, Eng & Technology": [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Mathematics",
    "Physics",
  ],
  "Management & Social Sci.": [
    "Accounting",
    "Business Administration",
    "Economics",
    "Political Science",
  ],
  "Health Sciences": [
    "Nursing",
    "Medicine",
    "Public Health",
    "Anatomy",
  ],
  "Humanities & Culture": [
    "History",
    "English",
    "Linguistics",
    "French",
  ],
  "ICT": [
    "ICT"
  ]
};

function getFacultyFromDepartment(department) {
  for (const [faculty, deps] of Object.entries(facultyDepartments)) {
    if (deps.includes(department)) {
      return faculty;
    }
  }
  return "Science, Eng & Technology"; // Default fallback
}

onMounted(async () => {
  if (import.meta.env.VITE_API_URL) {
    try {
      const res = await getAllUsers();
      if (res.data && res.data.users) {
        let rawUsers = res.data.users;
        if (authStore.userRole === "lecturer") {
          rawUsers = rawUsers.filter(u => u.role === "student" || u._id === authStore.user.id);
        } else if (authStore.userRole === "admin") {
          rawUsers = rawUsers.filter(u => u.role === "student" || u.role === "lecturer");
        }
        users.value = rawUsers.map(u => ({
          id: u._id,
          name: u.name,
          identifier: u.identifier,
          email: u.email,
          role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Student",
          faculty: getFacultyFromDepartment(u.department),
          department: u.department || "General",
          status: u.status === "active" ? "Active" : "Inactive",
          isActive: u.status === "active",
          lastLogin: u.lastActive ? new Date(u.lastActive).toLocaleDateString() : "Never"
        }));
      }
    } catch (err) {
      console.error("Failed to load users from API:", err);
    }
  } else {
    // Mock data fallback if offline
    users.value = [
      {
        id: 1,
        name: "Adebayo Johnson",
        identifier: "UNIOSUN/CSC/20/001",
        email: "adebayo@student.edu",
        role: "Student",
        faculty: "Science, Eng & Technology",
        department: "Computer Science",
        status: "Active",
        isActive: true,
        lastLogin: "Today, 09:32",
      },
      {
        id: 2,
        name: "Dr. Folake Adesanya",
        identifier: "STAFF001",
        email: "folake@uniosun.edu.ng",
        role: "Lecturer",
        faculty: "Science, Eng & Technology",
        department: "Computer Science",
        status: "Active",
        isActive: true,
        lastLogin: "Yesterday, 16:08",
      },
      {
        id: 3,
        name: "Sola Adeyemi",
        identifier: "ADM001",
        email: "sola@uniosun.edu.ng",
        role: "Admin",
        faculty: "ICT",
        department: "ICT",
        status: "Active",
        isActive: true,
        lastLogin: "Today, 11:21",
      },
      {
        id: 4,
        name: "Kehinde Adebisi",
        identifier: "UNIOSUN/ACC/21/044",
        email: "kehinde@student.edu",
        role: "Student",
        faculty: "Management & Social Sci.",
        department: "Accounting",
        status: "Inactive",
        isActive: false,
        lastLogin: "2 weeks ago",
      },
    ];
  }
});

const userForm = reactive({
  name: "",
  identifier: "",
  email: "",
  role: "Student",
  faculty: "",
  department: "",
  lastLogin: "Never",
  isActive: true,
});

const selectableDepartments = computed(() => {
  if (!userForm.faculty) return [];
  return facultyDepartments[userForm.faculty] || [];
});

function onFacultyChange() {
  const departments = facultyDepartments[userForm.faculty] || [];
  if (!departments.includes(userForm.department)) {
    userForm.department = "";
  }
}

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase();

  return users.value.filter((user) => {
    const matchesSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.identifier.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);

    const matchesRole = !roleFilter.value || user.role === roleFilter.value;
    const matchesFaculty = !facultyFilter.value || user.faculty === facultyFilter.value;

    return matchesSearch && matchesRole && matchesFaculty;
  });
});

function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function resetForm() {
  Object.assign(userForm, {
    name: "",
    identifier: "",
    email: "",
    role: "Student",
    faculty: "",
    department: "",
    lastLogin: "Never",
    isActive: true,
  });

  editingUserId.value = null;
  formError.value = "";
}

function openAddUser() {
  modalMode.value = "add";
  resetForm();
  isModalOpen.value = true;
}

function openEditUser(user) {
  modalMode.value = "edit";
  editingUserId.value = user.id;
  formError.value = "";

  Object.assign(userForm, {
    name: user.name,
    identifier: user.identifier,
    email: user.email,
    role: user.role,
    faculty: user.faculty,
    department: user.department,
    lastLogin: user.lastLogin,
    isActive: user.isActive,
  });

  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  resetForm();
}

function validateUserForm() {
  if (!sanitizeText(userForm.name)) return "Full name is required.";
  if (!sanitizeText(userForm.identifier)) return "Identifier is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
    return "Enter a valid email address.";
  }
  if (!userForm.faculty) return "Faculty selection is required.";
  if (!userForm.department) return "Department selection is required.";

  return "";
}

function buildPayload() {
  return {
    name: sanitizeText(userForm.name),
    identifier: sanitizeText(userForm.identifier),
    email: sanitizeText(userForm.email).toLowerCase(),
    role: sanitizeText(userForm.role),
    faculty: sanitizeText(userForm.faculty),
    department: sanitizeText(userForm.department),
    lastLogin: sanitizeText(userForm.lastLogin) || "Never",
    isActive: Boolean(userForm.isActive),
    status: userForm.isActive ? "Active" : "Inactive",
  };
}

async function handleSaveUser() {
  const error = validateUserForm();

  if (error) {
    formError.value = error;
    return;
  }

  const payload = buildPayload();

  if (import.meta.env.VITE_API_URL) {
    try {
      if (modalMode.value === "edit") {
        const backendPayload = {
          name: payload.name,
          email: payload.email,
          identifier: payload.identifier,
          role: payload.role.toLowerCase(),
          department: payload.department,
          status: payload.isActive ? "active" : "suspended"
        };
        await updateUser(editingUserId.value, backendPayload);
      } else {
        const backendPayload = {
          name: payload.name,
          identifier: payload.identifier,
          email: payload.email,
          password: "Password123", // default temporary password
          role: payload.role.toLowerCase(),
          department: payload.department
        };
        await createUser(backendPayload);
      }

      // Re-fetch users to keep the table fully synced with DB
      const res = await getAllUsers();
      if (res.data && res.data.users) {
        let rawUsers = res.data.users;
        if (authStore.userRole === "lecturer") {
          rawUsers = rawUsers.filter(u => u.role === "student" || u._id === authStore.user.id);
        } else if (authStore.userRole === "admin") {
          rawUsers = rawUsers.filter(u => u.role === "student" || u.role === "lecturer");
        }
        users.value = rawUsers.map(u => ({
          id: u._id,
          name: u.name,
          identifier: u.identifier,
          email: u.email,
          role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Student",
          faculty: getFacultyFromDepartment(u.department),
          department: u.department || "General",
          status: u.status === "active" ? "Active" : "Inactive",
          isActive: u.status === "active",
          lastLogin: u.lastActive ? new Date(u.lastActive).toLocaleDateString() : "Never"
        }));
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save user:", err);
      formError.value = err.response?.data?.error || err.message || "Failed to save user details.";
    }
  } else {
    // Fallback local mutation mode
    if (modalMode.value === "edit") {
      users.value = users.value.map((user) =>
        user.id === editingUserId.value
          ? { ...user, ...payload }
          : user
      );
    } else {
      users.value.unshift({
        id: Date.now(),
        ...payload,
      });
    }
    closeModal();
  }
}

function getInitials(name) {
  return sanitizeText(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
</script>

<style scoped>
.users-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.filters-card {
  margin-bottom: 24px;
  padding: 18px;
  border: 1px solid #d5deeb;
  border-radius: 10px;
  background: #ffffff;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.search-container {
  flex: 1;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
}

.avatar.student {
  background: #0875f5;
}

.avatar.lecturer {
  background: #8b5cf6;
}

.avatar.admin {
  background: #f59e0b;
}

.user-cell strong {
  display: block;
  color: #26344d;
  font-size: 13px;
  font-weight: 800;
}

.user-cell span {
  display: block;
  margin-top: 2px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
}

.action-btn {
  border: 0;
  background: transparent;
  color: #0875f5;
  font-size: 13px;
  font-weight: 800;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.modal-header h2 {
  margin: 0 0 6px;
  color: #111827;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 34px;
  font-weight: 900;
}

.modal-header p {
  margin: 0;
  color: #64748b;
}

.close-btn {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 26px;
  line-height: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding: 14px 0;
}

.status-row strong {
  display: block;
  color: #334155;
  font-size: 14px;
  font-weight: 800;
}

.status-row span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.form-error {
  margin: 8px 0 0;
  color: #dc2626;
  font-size: 13px;
  font-weight: 700;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

@media (max-width: 900px) {
  .filters-row,
  .users-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>