<template>
  <div class="create-page">
    <div class="page-header">
      <button type="button" class="back-link" @click="router.push('/platform-admin/institutions')">
        <ArrowLeft :size="15" /> All institutions
      </button>
      <h1 class="page-title">Add Institution</h1>
      <p class="page-subtitle">
        Register an institution and its first administrator. The administrator then adds lecturers,
        students and courses inside it.
      </p>
    </div>

    <form class="create-form" @submit.prevent="handleSubmit">
      <section class="form-card">
        <h2>Institution</h2>
        <div class="form-grid">
          <label class="form-label">
            Institution Name
            <input
              v-model="form.name"
              class="form-input"
              maxlength="120"
              placeholder="e.g. Osun State University"
              @input="suggestCode"
            />
          </label>

          <label class="form-label">
            Institution Code
            <input
              v-model="form.code"
              class="form-input"
              maxlength="48"
              placeholder="e.g. uniosun"
              @input="codeEdited = true"
            />
            <small>Users type this at sign-in. Lowercase letters, digits and hyphens only.</small>
          </label>
        </div>
      </section>

      <section class="form-card">
        <h2>First Administrator</h2>
        <AdminFields v-model="admin" />
      </section>

      <p v-if="formError" class="form-error">{{ formError }}</p>

      <div class="form-actions">
        <AppButton type="button" variant="secondary" @click="router.push('/platform-admin/institutions')">
          Cancel
        </AppButton>
        <AppButton type="submit" :disabled="saving">
          {{ saving ? "Creating..." : "Create Institution" }}
        </AppButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";

import AppButton from "../../components/common/AppButton.vue";
import AdminFields from "./AdminFields.vue";
import { createInstitution } from "../../api/institution.api";
import { CODE_PATTERN, emptyAdmin, validateAdminFields } from "./platformFormat";

const router = useRouter();
const saving = ref(false);
const formError = ref("");
const codeEdited = ref(false);
const form = reactive({ name: "", code: "" });
const admin = ref(emptyAdmin());

// Offer a code from the name's initials until the user types their own.
function suggestCode() {
  if (codeEdited.value) return;
  form.code = form.name
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word && !["of", "the", "and"].includes(word))
    .map((word) => word.replace(/[^a-z0-9]/g, "")[0] || "")
    .join("");
}

function validate() {
  if (!form.name.trim()) return "Institution name is required.";
  if (!CODE_PATTERN.test(form.code.trim().toLowerCase())) {
    return "Institution code may only contain lowercase letters, digits and hyphens.";
  }
  return validateAdminFields(admin.value);
}

async function handleSubmit() {
  formError.value = validate();
  if (formError.value) return;

  saving.value = true;
  try {
    const res = await createInstitution({
      name: form.name.trim(),
      code: form.code.trim().toLowerCase(),
      adminName: admin.value.name.trim(),
      adminEmail: admin.value.email.trim().toLowerCase(),
      adminIdentifier: admin.value.identifier.trim(),
      adminPassword: admin.value.password,
      department: admin.value.department.trim() || undefined,
    });
    const { institution } = res.data;
    router.push({ path: `/platform-admin/institutions/${institution._id}`, query: { created: "1" } });
  } catch (err) {
    formError.value = err.response?.data?.error || "Could not create the institution.";
  } finally {
    saving.value = false;
  }
}
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

.create-form {
  display: grid;
  gap: 20px;
  max-width: 860px;
}

.form-card {
  padding: 24px;
  border: 1px solid #d5deeb;
  border-radius: 10px;
  background: #ffffff;
}

.form-card h2 {
  margin: 0 0 20px;
  color: #1e293b;
  font-size: 18px;
  font-weight: 900;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}

.form-label small {
  color: #94a3b8;
  font-size: 11.5px;
  font-weight: 600;
}

.form-error {
  margin: 0;
  color: #dc2626;
  font-size: 13px;
  font-weight: 700;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
