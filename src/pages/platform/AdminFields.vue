<template>
  <div class="form-grid">
    <label class="form-label">
      Full Name
      <input v-model="model.name" class="form-input" maxlength="120" autocomplete="off" />
    </label>

    <label class="form-label">
      Email
      <input v-model="model.email" class="form-input" type="email" maxlength="120" autocomplete="off" />
    </label>

    <label class="form-label">
      Staff Identifier
      <input v-model="model.identifier" class="form-input" maxlength="80" autocomplete="off" />
    </label>

    <label class="form-label">
      Department (optional)
      <input v-model="model.department" class="form-input" maxlength="120" autocomplete="off" />
    </label>

    <label class="form-label">
      Temporary Password
      <input v-model="model.password" class="form-input" type="password" autocomplete="new-password" />
      <small>At least 12 characters. Share it privately; the administrator should change it after signing in.</small>
    </label>

    <label class="form-label">
      Confirm Password
      <input v-model="model.confirmPassword" class="form-input" type="password" autocomplete="new-password" />
    </label>
  </div>
</template>

<script setup>
const model = defineModel({ type: Object, required: true });
</script>

<style scoped>
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

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
