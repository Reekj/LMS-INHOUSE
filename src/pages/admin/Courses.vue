<template>
  <div class="courses-page">
    <div class="page-header courses-header">
      <div>
        <h1 class="page-title">Courses</h1>
        <p class="page-subtitle">Manage course catalogues and lecturer assignments</p>
      </div>

      <AppButton @click="openAddCourse">Add Course</AppButton>
    </div>

    <div class="filters-card">
      <div class="filters-row">
        <div class="search-container">
          <AppSearch
            v-model="search"
            placeholder="Search by course code or title..."
          />
        </div>

        <AppSelect v-model="facultyFilter">
          <option value="">All Faculties</option>
          <option v-for="(deps, fac) in facultyDepartments" :key="fac" :value="fac">{{ fac }}</option>
        </AppSelect>

        <AppSelect v-model="levelFilter">
          <option value="">All Levels</option>
          <option value="100">100 Level</option>
          <option value="200">200 Level</option>
          <option value="300">300 Level</option>
          <option value="400">400 Level</option>
        </AppSelect>
      </div>
    </div>

    <AppTable>
      <thead>
        <tr>
          <th>Course</th>
          <th>Faculty & Department</th>
          <th>Lecturer</th>
          <th>Level</th>
          <th>Students</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="course in filteredCourses" :key="course.id">
          <td>
            <div class="course-cell">
              <strong>{{ course.code }}</strong>
              <span>{{ course.title }}</span>
            </div>
          </td>

          <td>
            <div style="font-weight: 800; color: #1e293b; font-size: 13.5px;">{{ course.department }}</div>
            <div style="font-size: 11.5px; color: #64748b; margin-top: 1px;">{{ course.faculty }}</div>
          </td>
          <td>{{ course.lecturer }}</td>
          <td>{{ course.level }}</td>
          <td>{{ course.students }}</td>

          <td>
            <AppBadge :type="course.status === 'Active' ? 'success' : 'warning'">
              {{ course.status }}
            </AppBadge>
          </td>

          <td>
            <button class="action-btn" @click="openEditCourse(course)">
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
            <h2>{{ modalMode === "add" ? "Add Course" : "Edit Course" }}</h2>
            <p>
              {{ modalMode === "add"
                ? "Create a new course entry."
                : "Update course details and lecturer assignment." }}
            </p>
          </div>

          <button type="button" class="close-btn" @click="closeModal">×</button>
        </div>

        <form @submit.prevent="handleSaveCourse">
          <p v-if="!Object.keys(facultyDepartments).length" class="setup-hint">
            No faculties or departments are set up yet.
            <RouterLink to="/admin/faculties">Add them on Faculties &amp; Departments</RouterLink>
            first.
          </p>

          <div class="form-grid">
            <label class="form-label">
              Course Code
              <input
                v-model.trim="courseForm.code"
                class="form-input"
                maxlength="20"
                autocomplete="off"
              />
            </label>

            <label class="form-label">
              Course Title
              <input
                v-model.trim="courseForm.title"
                class="form-input"
                maxlength="100"
                autocomplete="off"
              />
            </label>

            <label class="form-label">
              Faculty
              <select v-model="courseForm.faculty" class="form-select" @change="onFacultyChange">
                <option value="">Select Faculty</option>
                <option v-for="(deps, fac) in facultyDepartments" :key="fac" :value="fac">
                  {{ fac }}
                </option>
              </select>
            </label>

            <label class="form-label">
              Department
              <select v-model="courseForm.department" class="form-select" :disabled="!courseForm.faculty">
                <option value="">Select Department</option>
                <option v-for="dep in selectableDepartments" :key="dep" :value="dep">
                  {{ dep }}
                </option>
              </select>
            </label>

            <label class="form-label">
              Lecturer
              <select v-model="courseForm.lecturer" class="form-select">
                <option value="">Select Lecturer</option>
                <option v-for="lec in lecturers" :key="lec.id" :value="lec.name">
                  {{ lec.name }}
                </option>
              </select>
            </label>

            <label class="form-label">
              Level
              <select v-model="courseForm.level" class="form-select">
                <option>100</option>
                <option>200</option>
                <option>300</option>
                <option>400</option>
              </select>
            </label>

            <label class="form-label">
              Students
              <input
                v-model.number="courseForm.students"
                class="form-input"
                type="number"
                min="0"
                max="10000"
              />
            </label>
          </div>

          <div class="status-row">
            <div>
              <strong>Course Status</strong>
              <span>{{ courseForm.isActive ? "Active" : "Draft" }}</span>
            </div>

            <AppToggle v-model="courseForm.isActive" />
          </div>

          <p v-if="formError" class="form-error">{{ formError }}</p>

          <div class="modal-actions">
            <AppButton type="button" variant="secondary" @click="closeModal">
              Cancel
            </AppButton>

            <AppButton type="submit">
              {{ modalMode === "add" ? "Create Course" : "Save Changes" }}
            </AppButton>
          </div>
        </form>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { RouterLink } from "vue-router";

import AppBadge from "../../components/common/AppBadge.vue";
import AppButton from "../../components/common/AppButton.vue";
import AppModal from "../../components/common/AppModal.vue";
import AppSearch from "../../components/common/AppSearch.vue";
import AppSelect from "../../components/common/AppSelect.vue";
import AppToggle from "../../components/common/AppToggle.vue";
import AppTable from "../../components/tables/AppTable.vue";
import { useFacultiesStore } from "../../stores/faculties.store";
import { getCourses, createCourse, editCourse } from "../../api/course.api";
import { getAllUsers } from "../../api/user.api";

const search = ref("");
const facultyFilter = ref("");
const levelFilter = ref("");
const isModalOpen = ref(false);
const modalMode = ref("add");
const editingCourseId = ref(null);
const formError = ref("");

const courses = ref([]);
const lecturers = ref([]);

// Set up by the institution's admins on the Faculties & Departments page.
const facultiesStore = useFacultiesStore();
const facultyDepartments = computed(() => facultiesStore.facultyDepartments);

function getFacultyFromDepartment(department) {
  return facultiesStore.facultyOf(department) || "Not assigned";
}

onMounted(async () => {
  await facultiesStore.fetch();
  if (import.meta.env.VITE_API_URL) {
    try {
      const res = await getCourses();
      if (res.data && res.data.courses) {
        courses.value = res.data.courses.map(c => ({
          id: c._id,
          code: c.courseCode,
          title: c.title,
          faculty: getFacultyFromDepartment(c.department),
          department: c.department || "General",
          lecturer: c.lecturer || "Not Assigned",
          level: c.level || "300",
          students: c.students || 0,
          status: c.status === "Active" ? "Active" : "Draft",
          isActive: c.status === "Active"
        }));
      }
    } catch (err) {
      console.error("Failed to load courses from API:", err);
    }

    try {
      const userRes = await getAllUsers();
      if (userRes.data && userRes.data.users) {
        lecturers.value = userRes.data.users.filter(u => u.role === "lecturer");
      }
    } catch (err) {
      console.error("Failed to load lecturers:", err);
    }
  } else {
    // Mock data fallback if offline
    courses.value = [
      {
        id: 1,
        code: "CSC 322",
        title: "Operating Systems",
        faculty: "Science, Eng & Technology",
        department: "Computer Science",
        lecturer: "Dr. Folake Adesanya",
        level: "300",
        students: 214,
        status: "Active",
        isActive: true,
      },
      {
        id: 2,
        code: "CSC 412",
        title: "Computer Networks",
        faculty: "Science, Eng & Technology",
        department: "Computer Science",
        lecturer: "Prof. Taiwo Akinwale",
        level: "400",
        students: 173,
        status: "Active",
        isActive: true,
      },
      {
        id: 3,
        code: "ACC 201",
        title: "Financial Accounting",
        faculty: "Management & Social Sci.",
        department: "Accounting",
        lecturer: "Dr. Yusuf Ibrahim",
        level: "200",
        students: 118,
        status: "Draft",
        isActive: false,
      },
    ];

    lecturers.value = [
      { id: "lec-001", name: "Dr. Folake Adesanya" },
      { id: "lec-002", name: "Prof. Taiwo Akinwale" },
      { id: "lec-003", name: "Dr. Yusuf Ibrahim" }
    ];
  }
});

const courseForm = reactive({
  code: "",
  title: "",
  faculty: "",
  department: "",
  lecturer: "",
  level: "300",
  students: 0,
  isActive: true,
});

const selectableDepartments = computed(() => {
  if (!courseForm.faculty) return [];
  return facultyDepartments.value[courseForm.faculty] || [];
});

function onFacultyChange() {
  const departments = facultyDepartments.value[courseForm.faculty] || [];
  if (!departments.includes(courseForm.department)) {
    courseForm.department = "";
  }
}

const filteredCourses = computed(() => {
  const query = search.value.trim().toLowerCase();

  return courses.value.filter((course) => {
    const matchesSearch =
      !query ||
      course.code.toLowerCase().includes(query) ||
      course.title.toLowerCase().includes(query);

    const matchesFaculty = !facultyFilter.value || course.faculty === facultyFilter.value;
    const matchesLevel = !levelFilter.value || course.level === levelFilter.value;

    return matchesSearch && matchesFaculty && matchesLevel;
  });
});

function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function resetForm() {
  Object.assign(courseForm, {
    code: "",
    title: "",
    faculty: "",
    department: "",
    lecturer: "",
    level: "300",
    students: 0,
    isActive: true,
  });

  editingCourseId.value = null;
  formError.value = "";
}

function openAddCourse() {
  modalMode.value = "add";
  resetForm();
  isModalOpen.value = true;
}

function openEditCourse(course) {
  modalMode.value = "edit";
  editingCourseId.value = course.id;
  formError.value = "";

  Object.assign(courseForm, {
    code: course.code,
    title: course.title,
    faculty: course.faculty,
    department: course.department,
    lecturer: course.lecturer,
    level: course.level,
    students: course.students,
    isActive: course.isActive,
  });

  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  resetForm();
}

function validateCourseForm() {
  if (!sanitizeText(courseForm.code)) return "Course code is required.";
  if (!sanitizeText(courseForm.title)) return "Course title is required.";
  if (!sanitizeText(courseForm.lecturer)) return "Lecturer name is required.";
  if (!Object.keys(facultyDepartments.value).length) {
    return "Set up faculties and departments first (Faculties & Departments page).";
  }
  if (!courseForm.faculty) return "Faculty selection is required.";
  if (!courseForm.department) return "Department selection is required.";

  const students = Number(courseForm.students);

  if (!Number.isFinite(students) || students < 0) {
    return "Student count must be a valid positive number.";
  }

  return "";
}

function buildPayload() {
  return {
    code: sanitizeText(courseForm.code).toUpperCase(),
    title: sanitizeText(courseForm.title),
    faculty: sanitizeText(courseForm.faculty),
    department: sanitizeText(courseForm.department),
    lecturer: sanitizeText(courseForm.lecturer),
    level: sanitizeText(courseForm.level),
    students: Number(courseForm.students),
    isActive: Boolean(courseForm.isActive),
    status: courseForm.isActive ? "Active" : "Draft",
  };
}

async function handleSaveCourse() {
  const error = validateCourseForm();

  if (error) {
    formError.value = error;
    return;
  }

  const payload = buildPayload();

  if (import.meta.env.VITE_API_URL) {
    try {
      if (modalMode.value === "edit") {
        const backendPayload = {
          courseCode: payload.code,
          title: payload.title,
          department: payload.department,
          lecturer: payload.lecturer,
          level: payload.level,
          students: payload.students,
          status: payload.isActive ? "Active" : "Draft"
        };
        await editCourse(editingCourseId.value, backendPayload);
      } else {
        const backendPayload = {
          courseCode: payload.code,
          title: payload.title,
          department: payload.department,
          lecturer: payload.lecturer,
          level: payload.level,
          students: payload.students,
          status: payload.isActive ? "Active" : "Draft"
        };
        await createCourse(backendPayload);
      }

      // Re-fetch courses from backend
      const res = await getCourses();
      if (res.data && res.data.courses) {
        courses.value = res.data.courses.map(c => ({
          id: c._id,
          code: c.courseCode,
          title: c.title,
          faculty: getFacultyFromDepartment(c.department),
          department: c.department || "General",
          lecturer: c.lecturer || "Not Assigned",
          level: c.level || "300",
          students: c.students || 0,
          status: c.status === "Active" ? "Active" : "Draft",
          isActive: c.status === "Active"
        }));
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save course:", err);
      formError.value = err.response?.data?.error || err.message || "Failed to save course details.";
    }
  } else {
    // Fallback local mutation mode
    if (modalMode.value === "edit") {
      courses.value = courses.value.map((course) =>
        course.id === editingCourseId.value
          ? { ...course, ...payload }
          : course
      );
    } else {
      courses.value.unshift({
        id: Date.now(),
        ...payload,
      });
    }
    closeModal();
  }
}
</script>

<style scoped>
.setup-hint {
  margin: 0 0 16px;
  padding: 12px 14px;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
}

.setup-hint a {
  color: #0875f5;
  font-weight: 800;
}

.courses-header {
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

.course-cell strong {
  display: block;
  color: #26344d;
  font-size: 13px;
  font-weight: 900;
}

.course-cell span {
  display: block;
  margin-top: 2px;
  color: #64748b;
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
  .courses-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>