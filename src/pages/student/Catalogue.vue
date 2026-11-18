<template>
  <section class="course-catalogue-page">
    <!-- Header -->
    <div class="page-header catalogue-header">
      <div class="header-text">
        <h1 class="page-title">Course Catalogue</h1>
        <p class="page-subtitle">
          Browse and enroll in available academic courses across all university faculties and departments
        </p>
      </div>

      <div class="header-actions">
        <RouterLink to="/student/courses" class="enrolled-link-btn">
          <BookOpen :size="16" />
          <span>My Enrolled Courses</span>
          <span class="enrolled-badge-count">{{ enrolledCount }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Student Department & Stats Banner -->
    <div class="catalogue-banner">
      <div class="banner-dept-info">
        <div class="dept-icon-box">
          <GraduationCap :size="22" />
        </div>
        <div class="dept-meta">
          <span class="dept-label">Your Registered Department</span>
          <strong class="dept-name">{{ studentDepartment }}</strong>
        </div>
      </div>

      <div class="banner-stats">
        <div class="stat-pill">
          <span class="stat-num">{{ catalogueCourses.length }}</span>
          <span class="stat-label">System Courses</span>
        </div>
        <div class="stat-pill highlight">
          <span class="stat-num">{{ enrolledCount }}</span>
          <span class="stat-label">Enrolled</span>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition name="fade">
      <div v-if="toastMessage" class="catalogue-toast">
        <Check :size="16" :stroke-width="3" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Controls Row (Search, Department Filter, Status Filter) -->
    <div class="catalogue-controls">
      <!-- Search -->
      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by course code, title, lecturer, or department..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-search-btn"
          @click="searchQuery = ''"
        >
          <X :size="14" />
        </button>
      </div>

      <!-- Department Filter Select -->
      <div class="filter-dropdown-wrapper">
        <select v-model="selectedDepartment" class="filter-select">
          <option
            v-for="opt in departmentOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Status Filter Tabs -->
      <div class="status-tabs">
        <button
          type="button"
          class="status-tab-btn"
          :class="{ active: statusFilter === 'ALL' }"
          @click="statusFilter = 'ALL'"
        >
          All ({{ catalogueCourses.length }})
        </button>
        <button
          type="button"
          class="status-tab-btn"
          :class="{ active: statusFilter === 'AVAILABLE' }"
          @click="statusFilter = 'AVAILABLE'"
        >
          Available ({{ availableCount }})
        </button>
        <button
          type="button"
          class="status-tab-btn"
          :class="{ active: statusFilter === 'ENROLLED' }"
          @click="statusFilter = 'ENROLLED'"
        >
          Enrolled ({{ enrolledCount }})
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading course catalogue...</p>
    </div>

    <!-- Catalogue Courses Grid -->
    <div
      v-else-if="filteredCatalogueCourses.length > 0"
      class="catalogue-grid"
    >
      <article
        v-for="(course, idx) in filteredCatalogueCourses"
        :key="course.id"
        class="catalogue-card"
        :class="{ 'card-enrolled': isEnrolled(course.id, course.code) }"
        :style="{
          '--card-accent': getCardTheme(idx).borderTop,
          '--card-bg-hover': getCardTheme(idx).hover,
        }"
      >
        <!-- Card Top Bar -->
        <div class="card-top-bar">
          <div class="course-code-pill">{{ course.code }}</div>
          <div class="card-badges">
            <span
              v-if="isHomeDepartment(course.department)"
              class="badge badge-home-dept"
            >
              My Dept
            </span>
            <span v-if="course.department" class="badge badge-dept">
              {{ course.department }}
            </span>
          </div>
        </div>

        <!-- Course Title -->
        <h2 class="course-card-title">{{ course.title }}</h2>

        <!-- Course Details -->
        <div class="course-details">
          <div class="detail-item">
            <span class="detail-label">Units:</span>
            <span class="detail-value">{{ course.units }} Units</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Lecturer:</span>
            <span class="detail-value">{{ course.lecturer }}</span>
          </div>
          <div v-if="course.level" class="detail-item">
            <span class="detail-label">Level:</span>
            <span class="detail-value">{{ course.level }}</span>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="card-footer">
          <template v-if="isEnrolled(course.id, course.code)">
            <div class="enrolled-badge-box">
              <Check :size="15" :stroke-width="3" />
              <span>Enrolled</span>
            </div>
            <button
              type="button"
              class="btn-open-workspace"
              @click="openWorkspace(course)"
            >
              <span>View Materials</span>
              <ArrowRight :size="15" />
            </button>
          </template>

          <template v-else>
            <button
              type="button"
              class="btn-enroll"
              :disabled="enrollingId === course.id"
              @click="handleEnroll(course)"
            >
              <span v-if="enrollingId === course.id" class="enrolling-spinner"></span>
              <Plus v-else :size="16" :stroke-width="2.5" />
              <span>{{ enrollingId === course.id ? "Enrolling..." : "Enroll in Course" }}</span>
            </button>
          </template>
        </div>
      </article>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-catalogue">
      <div class="empty-icon-box">
        <BookOpen :size="36" />
      </div>
      <template v-if="catalogueCourses.length === 0">
        <h2>No courses in catalogue</h2>
        <p>No courses have been created in the database yet. Please check back later or contact your departmental administrator.</p>
      </template>
      <template v-else>
        <h2>No matching courses found</h2>
        <p>
          No courses matched "{{ searchQuery }}"
          <span v-if="selectedDepartment !== 'All'"> in {{ selectedDepartment }}</span>.
        </p>
        <button
          type="button"
          class="reset-filters-btn"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  BookOpen,
  Check,
  Plus,
  Search,
  X,
  ArrowRight,
  GraduationCap,
} from "lucide-vue-next";

import { useStudentStore } from "../../stores/student.store";
import { useAuthStore } from "../../stores/auth.store";
import { getCourses, enrollCourse } from "../../api/course.api";

const router = useRouter();
const studentStore = useStudentStore();
const authStore = useAuthStore();

const catalogueCourses = ref([]);
const isLoading = ref(true);
const searchQuery = ref("");
const selectedDepartment = ref("All");
const statusFilter = ref("ALL"); // ALL | AVAILABLE | ENROLLED
const enrollingId = ref(null);
const toastMessage = ref("");

// Student department
const studentDepartment = computed(() => {
  return (
    authStore.user?.department ||
    studentStore.currentStudent?.department ||
    "Nursing"
  );
});

// Enrolled count
const enrolledCount = computed(() => {
  return (studentStore.courses || []).length;
});

// Available count
const availableCount = computed(() => {
  return catalogueCourses.value.filter(
    (c) => !isEnrolled(c.id, c.code)
  ).length;
});

// Themes for visual variety
const THEMES = [
  { borderTop: "#2563eb", hover: "#eff6ff" },
  { borderTop: "#8b5cf6", hover: "#faf5ff" },
  { borderTop: "#16a34a", hover: "#f0fdf4" },
  { borderTop: "#0284c7", hover: "#f0f9ff" },
  { borderTop: "#f59e0b", hover: "#fffbeb" },
  { borderTop: "#475569", hover: "#f8fafc" },
  { borderTop: "#ef4444", hover: "#fef2f2" },
];

function getCardTheme(idx) {
  return THEMES[idx % THEMES.length];
}

// Department dropdown options
const departmentOptions = computed(() => {
  const depts = new Set();
  catalogueCourses.value.forEach((c) => {
    if (c.department) depts.add(c.department);
  });

  return [
    { label: "All Departments (All Courses)", value: "All" },
    { label: `My Department (${studentDepartment.value})`, value: "MY_DEPT" },
    ...Array.from(depts)
      .sort()
      .map((d) => ({ label: d, value: d })),
  ];
});

// Filtered catalogue list
const filteredCatalogueCourses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const dept = selectedDepartment.value;
  const status = statusFilter.value;

  return catalogueCourses.value.filter((c) => {
    // 1. Enrollment status filter
    const enrolled = isEnrolled(c.id, c.code);
    if (status === "ENROLLED" && !enrolled) return false;
    if (status === "AVAILABLE" && enrolled) return false;

    // 2. Department filter
    if (dept === "MY_DEPT") {
      if ((c.department || "").toLowerCase() !== studentDepartment.value.toLowerCase()) {
        return false;
      }
    } else if (dept !== "All") {
      if ((c.department || "").toLowerCase() !== dept.toLowerCase()) {
        return false;
      }
    }

    // 3. Search query filter
    if (!q) return true;
    const matchCode = (c.code || "").toLowerCase().includes(q);
    const matchTitle = (c.title || "").toLowerCase().includes(q);
    const matchLecturer = (c.lecturer || "").toLowerCase().includes(q);
    const matchDept = (c.department || "").toLowerCase().includes(q);

    return matchCode || matchTitle || matchLecturer || matchDept;
  });
});

function isEnrolled(courseId, courseCode) {
  const normalizedCode = (courseCode || "").toUpperCase().replace(/\s+/g, "");
  return (studentStore.courses || []).some((c) => {
    const cCode = (c.code || c.courseCode || "").toUpperCase().replace(/\s+/g, "");
    const cId = String(c.id || c._id || "");
    const targetId = String(courseId || "");
    return (
      (cId && targetId && cId === targetId) ||
      (normalizedCode && cCode === normalizedCode)
    );
  });
}

function isHomeDepartment(courseDept) {
  if (!courseDept) return false;
  return courseDept.toLowerCase() === studentDepartment.value.toLowerCase();
}

function resetFilters() {
  searchQuery.value = "";
  selectedDepartment.value = "All";
  statusFilter.value = "ALL";
}

function openWorkspace(course) {
  router.push(`/student/my-courses/${course.id}/materials`);
}

async function handleEnroll(course) {
  if (isEnrolled(course.id, course.code)) return;

  enrollingId.value = course.id;
  try {
    await enrollCourse({ courseId: course.id, courseCode: course.code });
  } catch (err) {
    // Only the server can enroll a student; never fake it locally.
    alert(
      err.response?.data?.error ||
        "Could not reach the server, so you were not enrolled. Please try again."
    );
    return;
  } finally {
    enrollingId.value = null;
  }

  // Reload courses, tests and timetable from the server.
  await studentStore.fetchStudentDataFromDB();

  toastMessage.value = `Successfully enrolled in ${course.code}: ${course.title}!`;
  setTimeout(() => {
    toastMessage.value = "";
  }, 4500);
}

async function loadCatalogue() {
  isLoading.value = true;
  try {
    const res = await getCourses();
    const courses = res.data?.courses || [];
    catalogueCourses.value = courses.map((c) => ({
      id: c._id,
      code: c.courseCode,
      title: c.title,
      units: c.units || 3,
      lecturer: c.lecturer || "Not Assigned",
      department: c.department || "General",
      level: c.level || null,
      fromDb: true,
    }));
  } catch (err) {
    console.warn("Error fetching catalogue courses:", err);
    catalogueCourses.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await loadCatalogue();
  if (authStore.user) {
    await studentStore.fetchStudentDataFromDB(
      authStore.user.id || authStore.user._id,
      authStore.user.enrolledCourses
    );
  }
});
</script>

<style scoped>
.course-catalogue-page {
  width: 100%;
}

/* Header */
.catalogue-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 6px 0;
  color: #0f172a;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.page-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.enrolled-link-btn {
  height: 42px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.enrolled-link-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.enrolled-badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #0875f5;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
}

/* Banner */
.catalogue-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  margin-bottom: 24px;
}

.banner-dept-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dept-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #0875f5;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dept-meta {
  display: flex;
  flex-direction: column;
}

.dept-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #0369a1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dept-name {
  font-size: 16px;
  font-weight: 800;
  color: #0c4a6e;
}

.banner-stats {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.stat-pill.highlight {
  border-color: #86efac;
  background: #f0fdf4;
}

.stat-num {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.stat-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

/* Toast */
.catalogue-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 10px;
  background: #16a34a;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Controls */
.catalogue-controls {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1 1 320px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 38px 0 40px;
  border: 1px solid #d5deeb;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #0875f5;
  box-shadow: 0 0 0 3px rgba(8, 117, 245, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.filter-dropdown-wrapper {
  flex: 0 0 auto;
}

.filter-select {
  height: 44px;
  padding: 0 16px;
  border: 1px solid #d5deeb;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #0875f5;
}

.status-tabs {
  display: flex;
  gap: 6px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
}

.status-tab-btn {
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: #64748b;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #0875f5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Grid */
.catalogue-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

@media (max-width: 1024px) {
  .catalogue-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .catalogue-grid {
    grid-template-columns: 1fr;
  }
}

/* Card */
.catalogue-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top: 5px solid var(--card-accent);
  border-radius: 14px;
  padding: 20px 22px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.catalogue-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.catalogue-card.card-enrolled {
  border-color: #cbd5e1;
  background: #fafcfb;
}

.card-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.course-code-pill {
  font-size: 12.5px;
  font-weight: 800;
  color: #0f172a;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

.card-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
}

.badge-dept {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.badge-home-dept {
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.course-card-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
}

.course-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.detail-label {
  color: #64748b;
  font-weight: 600;
}

.detail-value {
  color: #1e293b;
  font-weight: 700;
}

/* Footer */
.card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-enroll {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  background: #16a34a;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(22, 163, 74, 0.2);
}

.btn-enroll:hover:not(:disabled) {
  background: #15803d;
  transform: translateY(-1px);
}

.btn-enroll:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.enrolling-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.enrolled-badge-box {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
  font-size: 13px;
  font-weight: 700;
}

.btn-open-workspace {
  flex: 1;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-open-workspace:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

/* Empty State */
.empty-catalogue {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #ffffff;
  padding: 40px;
  text-align: center;
}

.empty-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-catalogue h2 {
  margin: 0 0 8px 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
}

.empty-catalogue p {
  margin: 0 0 20px 0;
  color: #64748b;
  font-size: 14px;
  max-width: 440px;
}

.reset-filters-btn {
  height: 38px;
  padding: 0 18px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-filters-btn:hover {
  background: #f8fafc;
}
</style>
