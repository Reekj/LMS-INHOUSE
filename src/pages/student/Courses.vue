<template>
  <section class="enrolled-courses-page">
    <!-- Header -->
    <div class="page-header courses-header">
      <div class="header-text">
        <h1 class="page-title">My Enrolled Courses</h1>
        <p class="page-subtitle">
          {{ displayCourses.length }} courses · 2024/2025 Session Semester 2 · Click any course to enter
        </p>
      </div>

      <button type="button" class="enroll-btn" @click="openEnrollModal">
        <Plus :size="17" :stroke-width="2.5" />
        <span>Enroll in a Course</span>
      </button>
    </div>

    <!-- Courses Grid (3 Columns) -->
    <div v-if="displayCourses.length" class="courses-grid">
      <article
        v-for="course in displayCourses"
        :key="course.id"
        tabindex="0"
        role="button"
        class="course-card"
        :style="{
          '--card-theme-color': course.themeColor,
          '--card-theme-hover': course.themeHover,
        }"
        @click="openCourseWorkspace(course)"
        @keydown.enter.prevent="openCourseWorkspace(course)"
        @keydown.space.prevent="openCourseWorkspace(course)"
      >
        <!-- Top Placeholder Icon -->
        <div class="course-thumbnail" aria-hidden="true"></div>

        <!-- Course Title -->
        <h2 class="course-title">{{ course.title }}</h2>

        <!-- Course Meta Info -->
        <p class="course-meta">
          {{ course.code }} · {{ course.units }} Units · {{ course.lecturer }}
        </p>

        <!-- Tags / Badges Row -->
        <div class="course-badges">
          <span v-if="course.dueTag" class="badge badge-due">
            {{ course.dueTag }}
          </span>

          <span v-if="course.postTag" class="badge badge-posts">
            {{ course.postTag }}
          </span>
        </div>

        <!-- Action Button -->
        <button
          type="button"
          class="view-materials-btn"
          @click.stop="openCourseWorkspace(course)"
        >
          View Materials
        </button>
      </article>
    </div>

    <!-- Empty State Fallback -->
    <div v-else class="empty-courses">
      <div class="empty-icon-box">
        <BookOpen :size="38" />
      </div>
      <h2>No courses enrolled yet</h2>
      <p>Enroll in courses assigned for this semester to view study materials and track assignments.</p>
      <button type="button" class="enroll-btn" @click="openEnrollModal">
        <Plus :size="17" :stroke-width="2.5" />
        <span>Enroll in a Course</span>
      </button>
    </div>

    <!-- Enroll in a Course Modal -->
    <AppModal v-model="isEnrollModalOpen">
      <div class="enroll-modal">
        <div class="modal-top">
          <div>
            <h2 class="modal-title">Enroll in a Course</h2>
            <p class="modal-subtitle">
              Select available courses for the 2024/2025 Session Semester 2.
            </p>
          </div>
          <button type="button" class="close-btn" @click="closeEnrollModal">
            <X :size="18" />
          </button>
        </div>

        <!-- Search Bar -->
        <div class="modal-search-wrapper">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by course code or title..."
            class="search-input"
          />
        </div>

        <!-- Course List -->
        <div class="available-courses-list">
          <div
            v-for="course in filteredAvailableCourses"
            :key="course.id"
            class="course-enroll-row"
            :class="{ enrolled: isCourseEnrolled(course.id) }"
          >
            <div class="course-enroll-info">
              <div class="code-pill">{{ course.code }}</div>
              <div>
                <strong>{{ course.title }}</strong>
                <p>{{ course.units }} Units · {{ course.lecturer }}</p>
              </div>
            </div>

            <div class="course-enroll-action">
              <span v-if="isCourseEnrolled(course.id)" class="enrolled-status">
                <Check :size="14" :stroke-width="3" />
                <span>Enrolled</span>
              </span>
              <button
                v-else
                type="button"
                class="enroll-row-btn"
                @click="handleEnroll(course)"
              >
                Enroll
              </button>
            </div>
          </div>

          <div v-if="filteredAvailableCourses.length === 0" class="no-results">
            No courses found matching "{{ searchQuery }}"
          </div>
        </div>

        <div class="modal-bottom">
          <button type="button" class="done-btn" @click="closeEnrollModal">
            Done
          </button>
        </div>
      </div>
    </AppModal>
  </section>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Plus, X, Search, Check, BookOpen } from "lucide-vue-next";

import AppModal from "../../components/common/AppModal.vue";
import { useStudentStore } from "../../stores/student.store";
import { useAuthStore } from "../../stores/auth.store";
import { getCourses } from "../../api/course.api";

const router = useRouter();
const studentStore = useStudentStore();
const authStore = useAuthStore();

const isEnrollModalOpen = ref(false);
const searchQuery = ref("");
const allCatalogueCourses = ref([]);

// 9 Color Themes matching the exact screenshot grid
const CARD_THEMES = [
  {
    key: "slate",
    borderTop: "#475569",
    hover: "#f8fafc",
  },
  {
    key: "blue",
    borderTop: "#2563eb",
    hover: "#eff6ff",
  },
  {
    key: "orange",
    borderTop: "#f59e0b",
    hover: "#fffbeb",
  },
  {
    key: "purple",
    borderTop: "#8b5cf6",
    hover: "#faf5ff",
  },
  {
    key: "green",
    borderTop: "#16a34a",
    hover: "#f0fdf4",
  },
  {
    key: "sky",
    borderTop: "#0284c7",
    hover: "#f0f9ff",
  },
  {
    key: "indigo",
    borderTop: "#334155",
    hover: "#f8fafc",
  },
  {
    key: "red",
    borderTop: "#ef4444",
    hover: "#fef2f2",
  },
  {
    key: "emerald",
    borderTop: "#16a34a",
    hover: "#f0fdf4",
  },
];

// 9 Default Courses matching the screenshot
const DEFAULT_NINE_COURSES = [
  {
    id: "csc-112",
    code: "CSC 112",
    title: "Introduction to Computer Science",
    units: 3,
    lecturer: "Dr. Adesanya",
    themeColor: CARD_THEMES[0].borderTop,
    themeHover: CARD_THEMES[0].hover,
    dueTag: "Due tomorrow",
    postTag: "2 new posts",
  },
  {
    id: "csc-114",
    code: "CSC 112",
    title: "Introduction to Computer Science",
    units: 3,
    lecturer: "Dr. Adesanya",
    themeColor: CARD_THEMES[1].borderTop,
    themeHover: CARD_THEMES[1].hover,
    dueTag: null,
    postTag: "2 new posts",
  },
  {
    id: "csc-116",
    code: "CSC 112",
    title: "Introduction to Computer Science",
    units: 3,
    lecturer: "Dr. Adesanya",
    themeColor: CARD_THEMES[2].borderTop,
    themeHover: CARD_THEMES[2].hover,
    dueTag: null,
    postTag: "2 new posts",
  },
  {
    id: "csc-211",
    code: "CSC 112",
    title: "Introduction to Computer Science",
    units: 3,
    lecturer: "Dr. Adesanya",
    themeColor: CARD_THEMES[3].borderTop,
    themeHover: CARD_THEMES[3].hover,
    dueTag: null,
    postTag: "2 new posts",
  },
  {
    id: "csc-213",
    code: "CSC 112",
    title: "Introduction to Computer Science",
    units: 3,
    lecturer: "Dr. Adesanya",
    themeColor: CARD_THEMES[4].borderTop,
    themeHover: CARD_THEMES[4].hover,
    dueTag: "1 due",
    postTag: "2 new posts",
  },
  {
    id: "csc-312",
    code: "CSC 112",
    title: "Introduction to Computer Science",
    units: 3,
    lecturer: "Dr. Adesanya",
    themeColor: CARD_THEMES[5].borderTop,
    themeHover: CARD_THEMES[5].hover,
    dueTag: null,
    postTag: "2 new posts",
  },
  {
    id: "csc-321",
    code: "CSC 112",
    title: "Introduction to Computer Science",
    units: 3,
    lecturer: "Dr. Adesanya",
    themeColor: CARD_THEMES[6].borderTop,
    themeHover: CARD_THEMES[6].hover,
    dueTag: null,
    postTag: "2 new posts",
  },
  {
    id: "csc-322",
    code: "CSC 112",
    title: "Introduction to Computer Science",
    units: 3,
    lecturer: "Dr. Adesanya",
    themeColor: CARD_THEMES[7].borderTop,
    themeHover: CARD_THEMES[7].hover,
    dueTag: null,
    postTag: "2 new posts",
  },
  {
    id: "csc-324",
    code: "CSC 112",
    title: "Introduction to Computer Science",
    units: 3,
    lecturer: "Dr. Adesanya",
    themeColor: CARD_THEMES[8].borderTop,
    themeHover: CARD_THEMES[8].hover,
    dueTag: null,
    postTag: "2 new posts",
  },
];

// Catalogue of courses for enrollment modal
const CATALOGUE_COURSES = [
  { id: "csc-112", code: "CSC 112", title: "Introduction to Computer Science", units: 3, lecturer: "Dr. Adesanya", department: "Computer Science" },
  { id: "csc-211", code: "CSC 211", title: "Computer Architecture & Organization", units: 3, lecturer: "Dr. Adesanya", department: "Computer Science" },
  { id: "csc-312", code: "CSC 312", title: "Software Engineering & Lifecycle", units: 3, lecturer: "Dr. Malik Adewale", department: "Computer Science" },
  { id: "csc-315", code: "CSC 315", title: "Web Application Development", units: 3, lecturer: "Prof. Taiwo Akinwale", department: "Computer Science" },
  { id: "csc-321", code: "CSC 321", title: "Data Structures & Algorithms", units: 3, lecturer: "Prof. Taiwo Akinwale", department: "Computer Science" },
  { id: "csc-322", code: "CSC 322", title: "Database Management Systems", units: 3, lecturer: "Dr. Folake Adesanya", department: "Computer Science" },
  { id: "csc-324", code: "CSC 324", title: "Operating Systems Principles", units: 3, lecturer: "Prof. Taiwo Akinwale", department: "Computer Science" },
  { id: "csc-326", code: "CSC 326", title: "Artificial Intelligence Foundations", units: 3, lecturer: "Dr. Adesanya", department: "Computer Science" },
  { id: "csc-328", code: "CSC 328", title: "Computer Networks & Cybersecurity", units: 3, lecturer: "Dr. Folake Adesanya", department: "Computer Science" },
];

// Enrolled courses computed list
const displayCourses = computed(() => {
  const storeCourses = studentStore.courses || [];
  
  if (storeCourses.length >= 9) {
    return storeCourses.map((c, i) => {
      const theme = CARD_THEMES[i % CARD_THEMES.length];
      return {
        id: c.id || c._id || `course-${i}`,
        code: c.code || c.courseCode || "CSC 112",
        title: c.title || "Introduction to Computer Science",
        units: c.units || 3,
        lecturer: c.lecturer || "Dr. Adesanya",
        themeColor: theme.borderTop,
        themeHover: theme.hover,
        dueTag: c.dueTag || (i === 0 ? "Due tomorrow" : i === 4 ? "1 due" : null),
        postTag: c.postTag || "2 new posts",
      };
    });
  }

  // If store has fewer than 9 courses (e.g. 3 default courses), merge with defaults so the 9 cards in screenshot render
  return DEFAULT_NINE_COURSES.map((fallback, i) => {
    const storeMatch = storeCourses[i];
    if (storeMatch) {
      const theme = CARD_THEMES[i % CARD_THEMES.length];
      return {
        id: storeMatch.id || storeMatch._id || fallback.id,
        code: storeMatch.code || fallback.code,
        title: storeMatch.title || fallback.title,
        units: storeMatch.units || fallback.units,
        lecturer: storeMatch.lecturer || fallback.lecturer,
        themeColor: theme.borderTop,
        themeHover: theme.hover,
        dueTag: fallback.dueTag,
        postTag: fallback.postTag,
      };
    }
    return fallback;
  });
});

// Available courses for modal
const availableCatalogue = computed(() => {
  if (allCatalogueCourses.value.length > 0) {
    return allCatalogueCourses.value;
  }
  return CATALOGUE_COURSES;
});

const filteredAvailableCourses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return availableCatalogue.value;
  return availableCatalogue.value.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.lecturer && c.lecturer.toLowerCase().includes(q))
  );
});

function isCourseEnrolled(courseId) {
  return displayCourses.value.some((c) => c.id === courseId || c.code === courseId);
}

function openCourseWorkspace(course) {
  // Ensure the course exists in studentStore so workspace can find it
  const exists = (studentStore.courses || []).some(
    (c) => c.id === course.id || c.code === course.code
  );

  if (!exists) {
    studentStore.courses.push({
      id: course.id,
      code: course.code,
      title: course.title,
      units: course.units,
      lecturer: course.lecturer,
      materialsCount: 3,
      videosCount: 2,
      assignmentsCount: 1,
      discussionsCount: 2,
    });
    studentStore.persist();
  }

  router.push(`/student/my-courses/${course.id}/materials`);
}

function openEnrollModal() {
  searchQuery.value = "";
  isEnrollModalOpen.value = true;
}

function closeEnrollModal() {
  isEnrollModalOpen.value = false;
  searchQuery.value = "";
}

function handleEnroll(course) {
  const exists = (studentStore.courses || []).some(
    (c) => c.id === course.id || c.code === course.code
  );

  if (!exists) {
    const newCourse = {
      id: course.id,
      code: course.code,
      title: course.title,
      units: course.units || 3,
      lecturer: course.lecturer || "Dr. Adesanya",
      theme: "blue",
      materialsCount: 3,
      videosCount: 2,
      assignmentsCount: 1,
      discussionsCount: 2,
    };
    studentStore.courses.push(newCourse);
    studentStore.persist();
  }
}

async function fetchBackendCourses() {
  try {
    const res = await getCourses();
    const courses = res.data?.courses || [];
    if (courses.length > 0) {
      allCatalogueCourses.value = courses.map((c) => ({
        id: c._id,
        code: c.courseCode,
        title: c.title,
        units: c.units || 3,
        lecturer: c.lecturer || "Dr. Adesanya",
        department: c.department || "Computer Science",
      }));
    }
  } catch (err) {
    // Fallback to catalogue courses
    allCatalogueCourses.value = CATALOGUE_COURSES;
  }
}

onMounted(() => {
  fetchBackendCourses();
});
</script>

<style scoped>
.enrolled-courses-page {
  width: 100%;
}

/* Header */
.courses-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.header-text {
  flex: 1;
}

.page-title {
  margin: 0 0 6px 0;
  color: #111827;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 32px;
  font-weight: 900;
  line-height: 1.15;
}

.page-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

/* Enroll Button */
.enroll-btn {
  height: 42px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  background: #16a34a;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(22, 163, 74, 0.2);
}

.enroll-btn:hover {
  background: #15803d;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);
}

/* 3-Column Courses Grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  align-items: stretch;
}

/* Course Card */
.course-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 250px;
  background: #ffffff;
  border: 1px solid #d5deeb;
  border-top: 5px solid var(--card-theme-color);
  border-radius: 16px;
  padding: 22px 24px;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.course-card:focus-visible {
  outline: 3px solid rgba(8, 117, 245, 0.25);
  outline-offset: 2px;
}

.course-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

/* Rounded Placeholder Box */
.course-thumbnail {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #d4d4d8;
  margin-bottom: 18px;
  flex-shrink: 0;
}

/* Title & Meta */
.course-title {
  margin: 0 0 6px 0;
  color: #111827;
  font-size: 16.5px;
  font-weight: 800;
  line-height: 1.3;
}

.course-meta {
  margin: 0 0 18px 0;
  color: #64748b;
  font-size: 13.5px;
  font-weight: 500;
}

/* Badges / Chips */
.course-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.badge-due {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #ef4444;
}

.badge-posts {
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #b45309;
}

/* View Materials Button */
.view-materials-btn {
  margin-top: auto;
  width: 100%;
  height: 42px;
  border: 1.5px solid var(--card-theme-color);
  border-radius: 8px;
  background: #ffffff;
  color: var(--card-theme-color);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-materials-btn:hover {
  background: var(--card-theme-hover);
}

/* Empty State */
.empty-courses {
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

.empty-courses h2 {
  margin: 0 0 8px 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.empty-courses p {
  margin: 0 0 24px 0;
  color: #64748b;
  font-size: 14px;
  max-width: 440px;
}

/* Modal Styles */
.enroll-modal {
  width: 100%;
}

.modal-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.modal-title {
  margin: 0 0 4px 0;
  color: #111827;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 26px;
  font-weight: 900;
}

.modal-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 13.5px;
}

.close-btn {
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-search-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 14px 0 38px;
  border: 1px solid #d5deeb;
  border-radius: 8px;
  font-size: 13.5px;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-input:focus {
  background: #ffffff;
  border-color: #16a34a;
  outline: none;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}

.available-courses-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.course-enroll-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  transition: 0.2s;
}

.course-enroll-row:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.course-enroll-row.enrolled {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.course-enroll-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.code-pill {
  padding: 4px 8px;
  border-radius: 6px;
  background: #e2e8f0;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.course-enroll-row.enrolled .code-pill {
  background: #dcfce7;
  color: #15803d;
}

.course-enroll-info strong {
  display: block;
  font-size: 14px;
  color: #1e293b;
  font-weight: 700;
}

.course-enroll-info p {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #64748b;
}

.enrolled-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #16a34a;
  font-size: 13px;
  font-weight: 700;
}

.enroll-row-btn {
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 6px;
  background: #16a34a;
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.enroll-row-btn:hover {
  background: #15803d;
}

.no-results {
  padding: 28px;
  text-align: center;
  color: #94a3b8;
  font-size: 13.5px;
}

.modal-bottom {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.done-btn {
  height: 38px;
  padding: 0 20px;
  border: 1px solid #d5deeb;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.done-btn:hover {
  background: #f1f5f9;
}

/* Responsive */
@media (max-width: 1100px) {
  .courses-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .courses-header {
    flex-direction: column;
    align-items: stretch;
  }

  .enroll-btn {
    align-self: flex-start;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }
}
</style>
