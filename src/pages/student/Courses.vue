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

      <RouterLink to="/student/catalogue" class="enroll-btn">
        <Library :size="17" :stroke-width="2.5" />
        <span>Browse Course Catalogue</span>
      </RouterLink>
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
          <span v-if="course.department" class="badge badge-dept">
            {{ course.department }}
          </span>

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
      <p>
        You have not enrolled in any courses for this semester yet.
        Browse the Course Catalogue to view all available courses and enroll.
      </p>
      <RouterLink to="/student/catalogue" class="enroll-btn">
        <Library :size="17" :stroke-width="2.5" />
        <span>Go to Course Catalogue</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { BookOpen, Library } from "lucide-vue-next";

import { useStudentStore } from "../../stores/student.store";
import { useAuthStore } from "../../stores/auth.store";

const router = useRouter();
const studentStore = useStudentStore();
const authStore = useAuthStore();

// 9 Color Themes matching the exact grid
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

// Enrolled courses computed list (ONLY genuinely enrolled courses)
const displayCourses = computed(() => {
  const storeCourses = studentStore.courses || [];

  return storeCourses.map((c, i) => {
    const theme = CARD_THEMES[i % CARD_THEMES.length];
    return {
      id: c.id || c._id || `course-${i}`,
      code: c.code || c.courseCode || "",
      title: c.title || "",
      units: c.units || 3,
      lecturer: c.lecturer || "Not Assigned",
      department: c.department || "",
      themeColor: theme.borderTop,
      themeHover: theme.hover,
      dueTag: c.dueTag || null,
      postTag: c.postTag || null,
    };
  });
});

function openCourseWorkspace(course) {
  const exists = (studentStore.courses || []).some(
    (c) => c.id === course.id || c._id === course.id || c.code === course.code
  );

  if (!exists) {
    studentStore.courses.push({
      id: course.id,
      _id: course.id,
      code: course.code,
      title: course.title,
      units: course.units,
      lecturer: course.lecturer,
      department: course.department || "General",
      materialsCount: 3,
      videosCount: 2,
      assignmentsCount: 1,
      discussionsCount: 2,
      fromDb: true,
    });
    studentStore.persist();
  }

  router.push(`/student/my-courses/${course.id}/materials`);
}

onMounted(async () => {
  if (authStore.user) {
    await studentStore.fetchStudentDataFromDB(
      authStore.user.id || authStore.user._id,
      authStore.user.enrolledCourses
    );
  }
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

/* Enroll / Catalogue Link Button */
.enroll-btn {
  height: 42px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  background: #16a34a;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;
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

@media (max-width: 1024px) {
  .courses-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .courses-grid {
    grid-template-columns: 1fr;
  }
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

.badge-dept {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 11.5px;
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
</style>
