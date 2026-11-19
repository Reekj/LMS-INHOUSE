<template>
  <div class="faculties-page">
    <div class="page-header faculties-header">
      <div>
        <h1 class="page-title">Faculties &amp; Departments</h1>
        <p class="page-subtitle">
          Set up your institution's faculties and their departments. They appear in the user and course forms.
        </p>
      </div>

      <AppButton @click="openFacultyModal()">Add Faculty</AppButton>
    </div>

    <p v-if="pageError" class="page-error">{{ pageError }}</p>

    <section v-if="store.unassigned.length" class="unassigned-card">
      <h2>Departments in use but not set up</h2>
      <p>
        These department names are already on users or courses. Add each one to a faculty so it appears in the
        forms.
      </p>

      <div v-for="item in store.unassigned" :key="item.name" class="unassigned-row">
        <div>
          <strong>{{ item.name }}</strong>
          <span>{{ usageLabel(item) }}</span>
        </div>

        <div class="unassigned-actions">
          <AppSelect v-model="assignTargets[item.name]">
            <option value="">Choose a faculty</option>
            <option v-for="faculty in store.faculties" :key="faculty._id" :value="faculty._id">
              {{ faculty.name }}
            </option>
          </AppSelect>
          <AppButton
            variant="secondary"
            :disabled="!assignTargets[item.name] || busy"
            @click="addDepartment(assignTargets[item.name], item.name)"
          >
            Add
          </AppButton>
        </div>
      </div>
      <p v-if="!store.faculties.length" class="hint">Add a faculty first.</p>
    </section>

    <div v-if="!store.loaded && !store.error" class="empty-card">Loading...</div>

    <div v-else-if="!store.faculties.length" class="empty-card">
      <Building2 :size="28" />
      <strong>No faculties yet</strong>
      <span>Add your first faculty, then add its departments.</span>
    </div>

    <div class="faculty-grid">
      <section v-for="faculty in store.faculties" :key="faculty._id" class="faculty-card">
        <header class="faculty-head">
          <div>
            <h2>{{ faculty.name }}</h2>
            <span>{{ faculty.departments.length }} department{{ faculty.departments.length === 1 ? "" : "s" }}</span>
          </div>
          <div class="row-actions">
            <button type="button" class="action-btn" @click="openFacultyModal(faculty)">Rename</button>
            <button type="button" class="action-btn danger" :disabled="busy" @click="removeFaculty(faculty)">
              Delete
            </button>
          </div>
        </header>

        <ul class="department-list">
          <li v-if="!faculty.departments.length" class="no-departments">No departments yet.</li>
          <li v-for="department in faculty.departments" :key="department._id" class="department-row">
            <div>
              <strong>{{ department.name }}</strong>
              <span>{{ usageLabel(department) }}</span>
            </div>
            <div class="row-actions">
              <button type="button" class="action-btn" @click="openDepartmentModal(department, faculty)">
                Edit
              </button>
              <button
                type="button"
                class="action-btn danger"
                :disabled="busy"
                @click="removeDepartment(department)"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>

        <form class="add-department" @submit.prevent="addDepartment(faculty._id, newDepartment[faculty._id])">
          <input
            v-model="newDepartment[faculty._id]"
            class="form-input"
            maxlength="120"
            placeholder="New department name"
          />
          <AppButton type="submit" variant="secondary" :disabled="!newDepartment[faculty._id]?.trim() || busy">
            Add
          </AppButton>
        </form>
      </section>
    </div>

    <AppModal v-model="modal.open">
      <div class="modal-header">
        <div>
          <h2>{{ modal.title }}</h2>
          <p v-if="modal.kind === 'department'">Renaming updates every user and course in this department.</p>
        </div>
        <button type="button" class="close-btn" @click="modal.open = false">×</button>
      </div>

      <form @submit.prevent="saveModal">
        <div class="modal-fields">
          <label class="form-label">
            {{ modal.kind === "faculty" ? "Faculty name" : "Department name" }}
            <input v-model="modal.name" class="form-input" maxlength="120" />
          </label>

          <label v-if="modal.kind === 'department'" class="form-label">
            Faculty
            <select v-model="modal.facultyId" class="form-select">
              <option v-for="faculty in store.faculties" :key="faculty._id" :value="faculty._id">
                {{ faculty.name }}
              </option>
            </select>
          </label>
        </div>

        <p v-if="modal.error" class="form-error">{{ modal.error }}</p>

        <div class="modal-actions">
          <AppButton type="button" variant="secondary" @click="modal.open = false">Cancel</AppButton>
          <AppButton type="submit" :disabled="busy">{{ busy ? "Saving..." : "Save" }}</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { Building2 } from "lucide-vue-next";

import AppButton from "../../components/common/AppButton.vue";
import AppModal from "../../components/common/AppModal.vue";
import AppSelect from "../../components/common/AppSelect.vue";
import { useFacultiesStore } from "../../stores/faculties.store";
import {
  createDepartment,
  createFaculty,
  deleteDepartment,
  deleteFaculty,
  renameFaculty,
  updateDepartment,
} from "../../api/faculty.api";

const store = useFacultiesStore();
const busy = ref(false);
const pageError = ref("");
const newDepartment = reactive({});
const assignTargets = reactive({});
const modal = reactive({
  open: false,
  kind: "faculty",
  title: "",
  id: "",
  name: "",
  facultyId: "",
  originalFacultyId: "",
  error: "",
});

onMounted(async () => {
  await store.fetch();
  pageError.value = store.error;
});

function usageLabel(item) {
  const parts = [];
  if (item.users) parts.push(`${item.users} user${item.users === 1 ? "" : "s"}`);
  if (item.courses) parts.push(`${item.courses} course${item.courses === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : "Not used yet";
}

// Runs a change, reloads the list, and returns the error message, if any.
async function run(action) {
  busy.value = true;
  pageError.value = "";
  try {
    await action();
    await store.fetch();
    return "";
  } catch (err) {
    return err.response?.data?.error || "Something went wrong. Please try again.";
  } finally {
    busy.value = false;
  }
}

function openFacultyModal(faculty = null) {
  Object.assign(modal, {
    open: true,
    kind: "faculty",
    title: faculty ? "Rename Faculty" : "Add Faculty",
    id: faculty?._id || "",
    name: faculty?.name || "",
    error: "",
  });
}

function openDepartmentModal(department, faculty) {
  Object.assign(modal, {
    open: true,
    kind: "department",
    title: "Edit Department",
    id: department._id,
    name: department.name,
    facultyId: faculty._id,
    originalFacultyId: faculty._id,
    error: "",
  });
}

async function saveModal() {
  const name = modal.name.trim();
  if (!name) {
    modal.error = "Name is required.";
    return;
  }

  let error;
  if (modal.kind === "faculty") {
    error = await run(() => (modal.id ? renameFaculty(modal.id, name) : createFaculty(name)));
  } else {
    const payload = { name };
    if (modal.facultyId !== modal.originalFacultyId) payload.facultyId = modal.facultyId;
    error = await run(() => updateDepartment(modal.id, payload));
  }

  if (error) {
    modal.error = error;
  } else {
    modal.open = false;
  }
}

async function addDepartment(facultyId, name) {
  const clean = String(name || "").trim();
  if (!facultyId || !clean) return;
  const error = await run(() => createDepartment(facultyId, clean));
  if (error) {
    pageError.value = error;
  } else {
    newDepartment[facultyId] = "";
    delete assignTargets[clean];
  }
}

async function removeFaculty(faculty) {
  if (!window.confirm(`Delete the faculty "${faculty.name}"?`)) return;
  pageError.value = await run(() => deleteFaculty(faculty._id));
}

async function removeDepartment(department) {
  if (!window.confirm(`Delete the department "${department.name}"?`)) return;
  pageError.value = await run(() => deleteDepartment(department._id));
}
</script>

<style scoped>
.faculties-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.faculties-header :deep(.app-button) {
  flex-shrink: 0;
  white-space: nowrap;
}

.page-error {
  margin: 0 0 18px;
  padding: 12px 14px;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
}

.unassigned-card {
  margin-bottom: 24px;
  padding: 20px 22px;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  background: #fffbeb;
}

.unassigned-card h2 {
  margin: 0 0 6px;
  color: #92400e;
  font-size: 16px;
  font-weight: 900;
}

.unassigned-card > p {
  margin: 0 0 14px;
  color: #92400e;
  font-size: 13px;
}

.unassigned-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-top: 1px solid #fde68a;
}

.unassigned-row strong,
.department-row strong {
  display: block;
  color: #26344d;
  font-size: 13.5px;
  font-weight: 800;
}

.unassigned-row span,
.department-row span {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
}

.unassigned-actions {
  display: flex;
  gap: 10px;
}

.hint {
  margin: 8px 0 0;
  color: #92400e;
  font-size: 12px;
  font-weight: 700;
}

.empty-card {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 40px 20px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  color: #64748b;
  text-align: center;
}

.empty-card strong {
  color: #1e293b;
  font-size: 15px;
}

.faculty-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.faculty-card {
  display: flex;
  flex-direction: column;
  border: 1px solid #d5deeb;
  border-radius: 10px;
  background: #ffffff;
}

.faculty-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #edf2f7;
}

.faculty-head h2 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 16px;
  font-weight: 900;
}

.faculty-head span {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}

.department-list {
  flex: 1;
  margin: 0;
  padding: 6px 20px;
  list-style: none;
}

.department-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.department-row:last-child {
  border-bottom: 0;
}

.no-departments {
  padding: 12px 0;
  color: #94a3b8;
  font-size: 13px;
}

.row-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
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

.add-department {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #edf2f7;
  background: #f8fafc;
  border-radius: 0 0 10px 10px;
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

.modal-fields {
  display: grid;
  gap: 16px;
}

.form-error {
  margin: 12px 0 0;
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
  .faculties-header,
  .unassigned-row {
    flex-direction: column;
    align-items: stretch;
  }

  .faculty-grid {
    grid-template-columns: 1fr;
  }
}
</style>
