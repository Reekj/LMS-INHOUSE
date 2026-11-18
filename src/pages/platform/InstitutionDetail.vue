<template>
  <div class="detail-page">
    <div class="page-header">
      <button type="button" class="back-link" @click="router.push('/platform-admin/institutions')">
        <ArrowLeft :size="15" /> All institutions
      </button>

      <div v-if="institution" class="detail-header">
        <div>
          <h1 class="page-title">{{ institution.name }}</h1>
          <p class="page-subtitle">
            Sign-in code <strong class="code">{{ institution.code }}</strong>
            · Created {{ formatDate(institution.createdAt) }}
          </p>
        </div>

        <AppBadge :type="institution.status === 'active' ? 'success' : 'danger'">
          {{ institution.status === "active" ? "Active" : "Suspended" }}
        </AppBadge>
      </div>
      <h1 v-else-if="loading" class="page-title">Loading...</h1>
    </div>

    <p v-if="createdNotice" class="notice">
      Institution created. Share the sign-in code <strong>{{ institution?.code }}</strong> and the temporary
      password with its administrator.
    </p>
    <p v-if="error" class="page-error">{{ error }}</p>

    <template v-if="institution">
      <div class="stats-grid">
        <StatCard title="Administrators" :value="String(institution.counts.admin)" subtitle="Manage the institution" :icon="ShieldCheck" color="purple" />
        <StatCard title="Lecturers" :value="String(institution.counts.lecturer)" subtitle="Added by its admins" :icon="Users" color="blue" />
        <StatCard title="Students" :value="String(institution.counts.student)" subtitle="Added by its admins" :icon="GraduationCap" color="green" />
      </div>

      <section class="detail-card">
        <h2>Institution Details</h2>
        <form class="details-form" @submit.prevent="saveDetails">
          <label class="form-label">
            Institution Name
            <input v-model="details.name" class="form-input" maxlength="120" />
          </label>

          <div class="status-row">
            <div>
              <strong>Institution Status</strong>
              <span>
                {{ details.active ? "Active: its users can sign in." : "Suspended: none of its users can sign in." }}
              </span>
            </div>
            <AppToggle v-model="details.active" />
          </div>

          <p v-if="detailsError" class="form-error">{{ detailsError }}</p>
          <p v-if="detailsSaved" class="form-success">Changes saved.</p>

          <div class="card-actions">
            <AppButton type="submit" :disabled="savingDetails || !detailsChanged">
              {{ savingDetails ? "Saving..." : "Save Changes" }}
            </AppButton>
          </div>
        </form>
      </section>

      <div class="section-header">
        <div>
          <h2>Administrators</h2>
          <p>Administrators create lecturers, students and courses for this institution.</p>
        </div>
        <AppButton @click="openAddAdmin">Add Admin</AppButton>
      </div>

      <AppTable>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Status</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!admins.length">
            <td colspan="6" class="empty-cell">No administrators yet.</td>
          </tr>
          <tr v-for="admin in admins" :key="admin.id">
            <td>
              <div class="user-cell">
                <div class="avatar">{{ getInitials(admin.name) }}</div>
                <div>
                  <strong>{{ admin.name }}</strong>
                  <span>{{ admin.identifier }}</span>
                </div>
              </div>
            </td>
            <td>{{ admin.email }}</td>
            <td>{{ admin.department || "—" }}</td>
            <td>
              <AppBadge :type="admin.status === 'active' ? 'success' : 'danger'">
                {{ admin.status === "active" ? "Active" : "Suspended" }}
              </AppBadge>
            </td>
            <td>{{ admin.lastActive ? formatDate(admin.lastActive) : "Never" }}</td>
            <td>
              <button
                class="action-btn"
                :class="{ danger: admin.status === 'active' }"
                :disabled="updatingAdminId === admin.id"
                @click="toggleAdmin(admin)"
              >
                {{ admin.status === "active" ? "Suspend" : "Activate" }}
              </button>
            </td>
          </tr>
        </tbody>
      </AppTable>
    </template>

    <AppModal v-model="isModalOpen">
      <div class="modal-header">
        <div>
          <h2>Add Admin</h2>
          <p>Create another administrator for {{ institution?.name }}.</p>
        </div>
        <button type="button" class="close-btn" @click="isModalOpen = false">×</button>
      </div>

      <form @submit.prevent="saveAdmin">
        <AdminFields v-model="adminForm" />
        <p v-if="adminError" class="form-error">{{ adminError }}</p>
        <div class="modal-actions">
          <AppButton type="button" variant="secondary" @click="isModalOpen = false">Cancel</AppButton>
          <AppButton type="submit" :disabled="savingAdmin">
            {{ savingAdmin ? "Creating..." : "Create Admin" }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, GraduationCap, ShieldCheck, Users } from "lucide-vue-next";

import StatCard from "../../components/cards/StatCard.vue";
import AppBadge from "../../components/common/AppBadge.vue";
import AppButton from "../../components/common/AppButton.vue";
import AppModal from "../../components/common/AppModal.vue";
import AppToggle from "../../components/common/AppToggle.vue";
import AppTable from "../../components/tables/AppTable.vue";
import AdminFields from "./AdminFields.vue";
import {
  addInstitutionAdmin,
  getInstitution,
  setInstitutionAdminStatus,
  updateInstitution,
} from "../../api/institution.api";
import { emptyAdmin, formatDate, getInitials, validateAdminFields } from "./platformFormat";

const route = useRoute();
const router = useRouter();
const institutionId = route.params.id;

const institution = ref(null);
const admins = ref([]);
const loading = ref(true);
const error = ref("");
const createdNotice = ref(route.query.created === "1");

const details = reactive({ name: "", active: true });
const savingDetails = ref(false);
const detailsError = ref("");
const detailsSaved = ref(false);

const isModalOpen = ref(false);
const adminForm = ref(emptyAdmin());
const adminError = ref("");
const savingAdmin = ref(false);
const updatingAdminId = ref("");

const detailsChanged = computed(() => {
  if (!institution.value) return false;
  return (
    details.name.trim() !== institution.value.name ||
    details.active !== (institution.value.status === "active")
  );
});

function syncDetails() {
  details.name = institution.value.name;
  details.active = institution.value.status === "active";
}

async function loadInstitution() {
  loading.value = true;
  error.value = "";
  try {
    const res = await getInstitution(institutionId);
    institution.value = res.data.institution;
    admins.value = res.data.admins || [];
    syncDetails();
  } catch (err) {
    error.value = err.response?.data?.error || "Could not load this institution.";
  } finally {
    loading.value = false;
  }
  if (createdNotice.value) router.replace({ query: {} });
}

async function saveDetails() {
  detailsError.value = "";
  detailsSaved.value = false;
  if (!details.name.trim()) {
    detailsError.value = "Institution name cannot be empty.";
    return;
  }
  const status = details.active ? "active" : "suspended";
  if (
    status === "suspended" &&
    institution.value.status === "active" &&
    !window.confirm(`Suspend ${institution.value.name}? None of its users will be able to sign in.`)
  ) {
    return;
  }

  savingDetails.value = true;
  try {
    const res = await updateInstitution(institutionId, { name: details.name.trim(), status });
    institution.value = { ...institution.value, ...res.data.institution };
    syncDetails();
    detailsSaved.value = true;
  } catch (err) {
    detailsError.value = err.response?.data?.error || "Could not save changes.";
  } finally {
    savingDetails.value = false;
  }
}

function openAddAdmin() {
  adminForm.value = emptyAdmin();
  adminError.value = "";
  isModalOpen.value = true;
}

async function saveAdmin() {
  adminError.value = validateAdminFields(adminForm.value);
  if (adminError.value) return;

  savingAdmin.value = true;
  try {
    const res = await addInstitutionAdmin(institutionId, {
      name: adminForm.value.name.trim(),
      email: adminForm.value.email.trim().toLowerCase(),
      identifier: adminForm.value.identifier.trim(),
      department: adminForm.value.department.trim() || undefined,
      password: adminForm.value.password,
    });
    admins.value = [...admins.value, res.data.admin].sort((a, b) => a.name.localeCompare(b.name));
    institution.value.counts.admin += 1;
    isModalOpen.value = false;
  } catch (err) {
    adminError.value = err.response?.data?.error || "Could not create the administrator.";
  } finally {
    savingAdmin.value = false;
  }
}

async function toggleAdmin(admin) {
  const status = admin.status === "active" ? "suspended" : "active";
  if (status === "suspended" && !window.confirm(`Suspend ${admin.name}? They will not be able to sign in.`)) {
    return;
  }
  updatingAdminId.value = admin.id;
  error.value = "";
  try {
    const res = await setInstitutionAdminStatus(institutionId, admin.id, status);
    admin.status = res.data.admin.status;
  } catch (err) {
    error.value = err.response?.data?.error || "Could not update the administrator.";
  } finally {
    updatingAdminId.value = "";
  }
}

onMounted(loadInstitution);
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #0875f5;
  font-size: 13px;
  font-weight: 800;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.code {
  color: #26344d;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.notice {
  margin: 0 0 20px;
  padding: 14px 16px;
  border: 1px solid #86efac;
  border-radius: 10px;
  background: #f0fdf4;
  color: #166534;
  font-size: 13px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.detail-card {
  margin-bottom: 32px;
  padding: 24px;
  border: 1px solid #d5deeb;
  border-radius: 10px;
  background: #ffffff;
}

.detail-card h2,
.section-header h2 {
  margin: 0 0 20px;
  color: #1e293b;
  font-size: 18px;
  font-weight: 900;
}

.details-form {
  max-width: 560px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

.card-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.section-header h2 {
  margin-bottom: 4px;
}

.section-header p {
  margin: 0;
  color: #71829b;
  font-size: 13px;
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
  flex: 0 0 38px;
  border-radius: 999px;
  background: #f59e0b;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
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
  padding: 0;
  border: 0;
  background: transparent;
  color: #0875f5;
  font-size: 13px;
  font-weight: 800;
}

.action-btn.danger {
  color: #dc2626;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-cell {
  text-align: center;
  color: #94a3b8;
}

.page-error,
.form-error {
  margin: 0 0 16px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 700;
}

.form-error {
  margin: 12px 0 0;
}

.form-success {
  margin: 12px 0 0;
  color: #15803d;
  font-size: 13px;
  font-weight: 700;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

@media (max-width: 900px) {
  .detail-header,
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
