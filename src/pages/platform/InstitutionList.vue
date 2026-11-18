<template>
  <div class="institutions-page">
    <div class="page-header institutions-header">
      <div>
        <h1 class="page-title">Institutions</h1>
        <p class="page-subtitle">Every institution has its own isolated data and administrators.</p>
      </div>

      <AppButton @click="router.push('/platform-admin/new-institution')">Add Institution</AppButton>
    </div>

    <div class="stats-grid">
      <StatCard
        title="Institutions"
        :value="String(institutions.length)"
        subtitle="Registered on the platform"
        :icon="Building2"
        color="blue"
      />
      <StatCard
        title="Active"
        :value="String(activeCount)"
        :subtitle="`${institutions.length - activeCount} suspended`"
        :icon="ShieldCheck"
        color="green"
      />
      <StatCard
        title="Administrators"
        :value="String(adminCount)"
        subtitle="Across all institutions"
        :icon="Users"
        color="purple"
      />
    </div>

    <div class="filters-card">
      <div class="filters-row">
        <div class="search-container">
          <AppSearch v-model="search" placeholder="Search by name or code..." />
        </div>

        <AppSelect v-model="statusFilter">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </AppSelect>
      </div>
    </div>

    <p v-if="error" class="page-error">{{ error }}</p>

    <AppTable>
      <thead>
        <tr>
          <th>Institution</th>
          <th>Status</th>
          <th>Admins</th>
          <th>Lecturers</th>
          <th>Students</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td colspan="7" class="empty-cell">Loading institutions...</td>
        </tr>
        <tr v-else-if="!filteredInstitutions.length">
          <td colspan="7" class="empty-cell">
            {{ institutions.length ? "No institutions match your filters." : "No institutions yet. Add the first one." }}
          </td>
        </tr>
        <tr v-for="institution in filteredInstitutions" v-else :key="institution._id">
          <td>
            <div class="institution-cell">
              <div class="avatar">{{ getInitials(institution.name) }}</div>
              <div>
                <strong>{{ institution.name }}</strong>
                <span>{{ institution.code }}</span>
              </div>
            </div>
          </td>
          <td>
            <AppBadge :type="institution.status === 'active' ? 'success' : 'danger'">
              {{ institution.status === "active" ? "Active" : "Suspended" }}
            </AppBadge>
          </td>
          <td>{{ institution.counts.admin }}</td>
          <td>{{ institution.counts.lecturer }}</td>
          <td>{{ institution.counts.student }}</td>
          <td>{{ formatDate(institution.createdAt) }}</td>
          <td>
            <div class="actions">
              <button class="action-btn" @click="router.push(`/platform-admin/institutions/${institution._id}`)">
                Manage
              </button>
              <button
                class="action-btn"
                :class="{ danger: institution.status === 'active' }"
                :disabled="updatingId === institution._id"
                @click="toggleStatus(institution)"
              >
                {{ institution.status === "active" ? "Suspend" : "Activate" }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </AppTable>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Building2, ShieldCheck, Users } from "lucide-vue-next";

import StatCard from "../../components/cards/StatCard.vue";
import AppBadge from "../../components/common/AppBadge.vue";
import AppButton from "../../components/common/AppButton.vue";
import AppSearch from "../../components/common/AppSearch.vue";
import AppSelect from "../../components/common/AppSelect.vue";
import AppTable from "../../components/tables/AppTable.vue";
import { getManagedInstitutions, updateInstitution } from "../../api/institution.api";
import { formatDate, getInitials } from "./platformFormat";

const router = useRouter();
const institutions = ref([]);
const loading = ref(true);
const error = ref("");
const search = ref("");
const statusFilter = ref("");
const updatingId = ref("");

const activeCount = computed(() => institutions.value.filter((i) => i.status === "active").length);
const adminCount = computed(() => institutions.value.reduce((sum, i) => sum + i.counts.admin, 0));

const filteredInstitutions = computed(() => {
  const query = search.value.trim().toLowerCase();
  return institutions.value.filter((institution) => {
    const matchesSearch =
      !query ||
      institution.name.toLowerCase().includes(query) ||
      institution.code.toLowerCase().includes(query);
    const matchesStatus = !statusFilter.value || institution.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

async function loadInstitutions() {
  loading.value = true;
  error.value = "";
  try {
    const res = await getManagedInstitutions();
    institutions.value = res.data.institutions || [];
  } catch (err) {
    error.value = err.response?.data?.error || "Could not load institutions.";
  } finally {
    loading.value = false;
  }
}

async function toggleStatus(institution) {
  const status = institution.status === "active" ? "suspended" : "active";
  if (
    status === "suspended" &&
    !window.confirm(`Suspend ${institution.name}? None of its users will be able to sign in until it is activated again.`)
  ) {
    return;
  }

  updatingId.value = institution._id;
  error.value = "";
  try {
    await updateInstitution(institution._id, { status });
    institution.status = status;
  } catch (err) {
    error.value = err.response?.data?.error || "Could not update the institution.";
  } finally {
    updatingId.value = "";
  }
}

onMounted(loadInstitutions);
</script>

<style scoped>
.institutions-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;
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

.institution-cell {
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
  border-radius: 8px;
  background: #0875f5;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
}

.institution-cell strong {
  display: block;
  color: #26344d;
  font-size: 13px;
  font-weight: 800;
}

.institution-cell span {
  display: block;
  margin-top: 2px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 14px;
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

.page-error {
  margin: 0 0 16px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .institutions-header,
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
