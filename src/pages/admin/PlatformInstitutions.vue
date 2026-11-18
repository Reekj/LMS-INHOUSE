<template>
  <main class="platform-page">
    <section class="platform-card">
      <header>
        <div>
          <h1>Register an Institution</h1>
          <p>Each institution receives an isolated data space and its own administrator.</p>
        </div>
        <button type="button" class="sign-out" @click="logout">Sign out</button>
      </header>

      <form @submit.prevent="createInstitution">
        <h2>Institution</h2>
        <label>
          Institution name
          <input v-model.trim="form.name" required maxlength="120" />
        </label>
        <label>
          Institution code
          <input
            v-model.trim="form.code"
            required
            pattern="[a-zA-Z0-9-]+"
            maxlength="48"
            placeholder="e.g. uniosun"
          />
        </label>

        <h2>First institution administrator</h2>
        <label>
          Full name
          <input v-model.trim="form.adminName" required maxlength="120" />
        </label>
        <label>
          Email
          <input v-model.trim="form.adminEmail" required type="email" />
        </label>
        <label>
          Staff identifier
          <input v-model.trim="form.adminIdentifier" required maxlength="80" />
        </label>
        <label>
          Department (optional)
          <input v-model.trim="form.department" maxlength="120" />
        </label>
        <label>
          Temporary password (minimum 12 characters)
          <input v-model="form.adminPassword" required type="password" minlength="12" autocomplete="new-password" />
        </label>

        <p v-if="message" class="success">{{ message }}</p>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="saving">
          {{ saving ? "Creating..." : "Create institution" }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../../api/axios";
import { useAuthStore } from "../../stores/auth.store";

const router = useRouter();
const auth = useAuthStore();
const saving = ref(false);
const error = ref("");
const message = ref("");
const form = reactive({
  name: "",
  code: "",
  adminName: "",
  adminEmail: "",
  adminIdentifier: "",
  department: "",
  adminPassword: "",
});

async function createInstitution() {
  saving.value = true;
  error.value = "";
  message.value = "";
  try {
    const response = await api.post("/institutions", form);
    message.value = `${response.data.institution.name} was created. Its administrator can sign in with institution code "${response.data.institution.code}".`;
    Object.assign(form, {
      name: "",
      code: "",
      adminName: "",
      adminEmail: "",
      adminIdentifier: "",
      department: "",
      adminPassword: "",
    });
  } catch (err) {
    error.value = err.response?.data?.error || err.message || "Failed to create institution.";
  } finally {
    saving.value = false;
  }
}

async function logout() {
  await auth.logout();
  await router.replace("/login");
}
</script>

<style scoped>
.platform-page {
  min-height: 100vh;
  padding: 32px 16px;
  background: #f1f5f9;
}

.platform-card {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
  border: 1px solid #d5deeb;
  border-radius: 14px;
  background: white;
}

header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 8px;
}

header p {
  color: #64748b;
}

form {
  display: grid;
  gap: 14px;
}

form h2 {
  margin: 14px 0 0;
  font-size: 17px;
}

label {
  display: grid;
  gap: 6px;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

input {
  min-height: 42px;
  padding: 0 11px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

button {
  min-height: 42px;
  border: 0;
  border-radius: 6px;
  padding: 0 16px;
  background: #15803d;
  color: white;
  font-weight: 800;
}

button:disabled {
  opacity: 0.6;
}

.sign-out {
  background: transparent;
  color: #334155;
}

.success {
  margin: 0;
  color: #166534;
}

.error {
  margin: 0;
  color: #b91c1c;
}
</style>
