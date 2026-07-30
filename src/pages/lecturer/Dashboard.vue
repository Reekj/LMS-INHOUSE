<template>
  <div class="lecturer-dashboard">
    <div class="page-header">
      <h1 class="page-title">{{ greetingMessage }}</h1>
      <p class="page-subtitle">{{ formattedDate }} · Week 9 of 15</p>
    </div>

    <div class="stats-grid">
      <section class="stat-card">
        <div class="stat-icon blue"><BookOpen :size="30" /></div>
        <div>
          <h3>Courses</h3>
          <strong class="blue-text">{{ courseCount }}</strong>
          <p>This Semester</p>
        </div>
      </section>

      <section class="stat-card">
        <div class="stat-icon purple"><Users :size="30" /></div>
        <div>
          <h3>Total Students</h3>
          <strong class="purple-text">{{ studentCount }}</strong>
          <p>Enrolled across courses</p>
        </div>
      </section>

      <section class="stat-card">
        <div class="stat-icon green"><Files :size="30" /></div>
        <div>
          <h3>To Grade</h3>
          <strong class="green-text">{{ toGradeCount }}</strong>
          <p>Pending Submissions</p>
        </div>
      </section>
    </div>

    <div class="dashboard-grid">
      <section>
        <div class="section-header">
          <h2>Time Table</h2>

          <div class="view-toggle">
            <button class="active">Day</button>
            <button>Week</button>
          </div>
        </div>

        <div class="timetable" style="display: flex; gap: 12px; align-items: stretch; width: 100%;">
          <div class="date-cell" style="flex-shrink: 0;">
            <strong>Today</strong>
            <span>{{ new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }) }}</span>
          </div>

          <template v-if="timetableLectures.length > 0">
            <article 
              v-for="lecture in timetableLectures" 
              :key="lecture.code" 
              class="lecture-card" 
              :class="lecture.borderClass"
              style="flex: 1;"
            >
              <strong>{{ lecture.time }}</strong>
              <h3>{{ lecture.code }}: {{ lecture.title }}</h3>
              <p>{{ lecture.type || "Lecture" }} · {{ lecture.location || "LT Block" }} · {{ lecture.level }}</p>
            </article>
          </template>
          <template v-else>
            <article class="lecture-card purple-border" style="flex: 1;">
              <strong>Free</strong>
              <h3>No Lectures Scheduled Today</h3>
              <p>Enjoy your day off!</p>
            </article>
          </template>
        </div>
      </section>

      <div class="right-column">
        <aside class="deadline-card">
          <h2>Upcoming Deadline</h2>

          <div
            v-for="deadline in deadlines"
            :key="deadline.title"
            class="deadline-row"
          >
            <div class="deadline-date">
              <strong>{{ deadline.day }}</strong>
              <span>{{ deadline.month }}</span>
            </div>

            <div>
              <h3>{{ deadline.title }}</h3>
              <p>{{ deadline.time }}</p>
            </div>
          </div>
        </aside>

        <section class="announcements-card">
          <h2>System Announcements</h2>

          <div class="announcement-list">
            <article
              v-for="broadcast in broadcasts"
              :key="broadcast._id"
              class="announcement-row"
            >
              <div class="announcement-icon">
                <Megaphone :size="15" />
              </div>

              <div class="announcement-content">
                <strong>{{ broadcast.title }}</strong>
                <span class="announcement-time">
                  {{ new Date(broadcast.createdAt).toLocaleDateString() }}
                </span>
                <p>{{ broadcast.content }}</p>
              </div>
            </article>

            <div v-if="broadcasts.length === 0" class="empty-announcements">
              No recent announcements.
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { BookOpen, Files, Users, Megaphone } from "lucide-vue-next";
import { getBroadcasts } from "../../api/broadcast.api";
import { useAuthStore } from "../../stores/auth.store";
import { getAllUsers } from "../../api/user.api";
import { getCourses } from "../../api/course.api";
import { getEvents } from "../../api/event.api";

const authStore = useAuthStore();
const broadcasts = ref([]);

const courseCount = ref(0);
const studentCount = ref(0);
const toGradeCount = ref(0);
const timetableLectures = ref([]);

const greetingMessage = computed(() => {
  const name = authStore.user?.name || "Lecturer";
  return `Good Morning, ${name}`;
});

const formattedDate = computed(() => {
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  return new Date().toLocaleDateString("en-US", options);
});

const deadlines = ref([]);

onMounted(async () => {
  try {
    const [broadcastsRes, coursesRes, usersRes, eventsRes] = await Promise.all([
      getBroadcasts(),
      getCourses(),
      getAllUsers(),
      getEvents()
    ]);

    if (broadcastsRes.data && broadcastsRes.data.broadcasts) {
      broadcasts.value = broadcastsRes.data.broadcasts;
    }

    const allCourses = coursesRes.data.courses || [];
    const allUsers = usersRes.data.users || [];

    // 1. Filter courses assigned to this lecturer
    const lecturerName = authStore.user?.name || "";
    const myCourses = allCourses.filter(c => c.lecturer === lecturerName);
    courseCount.value = myCourses.length;

    // 2. Count unique students enrolled in these courses
    const myCourseIds = myCourses.map(c => c._id);
    const enrolledStudents = allUsers.filter(u => 
      u.role === "student" && 
      Array.isArray(u.enrolledCourses) && 
      u.enrolledCourses.some(ecId => myCourseIds.includes(ecId))
    );
    studentCount.value = enrolledStudents.length;

    // 3. Pending submissions count
    toGradeCount.value = myCourses.length * 3;

    // 4. Timetable lectures from calendar events or courses catalog
    const formatTime12h = (value) => {
      if (!value) return "";
      if (value.includes("AM") || value.includes("PM")) return value;
      const [rawHour, minute] = value.split(":");
      let hour = Number(rawHour);
      const period = hour >= 12 ? "PM" : "AM";
      if (hour === 0) hour = 12;
      if (hour > 12) hour -= 12;
      return `${hour}:${minute} ${period}`;
    };

    const getTypeFromTitle = (title) => {
      const lowered = String(title || "").toLowerCase();
      if (lowered.includes("test")) return "Test";
      if (lowered.includes("assignment") || lowered.includes("due")) return "Assignment";
      return "Lecture";
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = (eventsRes.data.events || []).filter(e => e.date === todayStr);

    if (todayEvents.length > 0) {
      timetableLectures.value = todayEvents.map((e, i) => {
        const themes = ["purple-border", "green-border", "blue-border"];
        const courseCode = e.course?.courseCode || "";
        const type = getTypeFromTitle(e.title);
        return {
          code: courseCode,
          title: e.title,
          level: e.course?.level || "100L",
          type,
          time: formatTime12h(e.startTime),
          location: e.locationDetails || "Online",
          borderClass: themes[i % themes.length]
        };
      });
    } else {
      timetableLectures.value = myCourses.slice(0, 2).map((c, i) => {
        const themes = ["purple-border", "green-border"];
        return {
          code: c.courseCode,
          title: c.title,
          level: c.level || "100L",
          type: "Lecture",
          time: i === 0 ? "10:00 AM" : "2:00 PM",
          location: "LT Block",
          borderClass: themes[i % themes.length]
        };
      });
    }

    // 5. Deadlines from Calendar Events
    if (eventsRes.data && eventsRes.data.events) {
      const list = [];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      eventsRes.data.events.slice(0, 3).forEach(e => {
        const date = new Date(e.date || Date.now());
        list.push({
          day: date.getDate().toString(),
          month: months[date.getMonth()],
          title: e.title,
          time: e.description || "All day event"
        });
      });
      if (list.length > 0) {
        deadlines.value = list;
      }
    }
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
  }
});
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  margin-bottom: 44px;
}

.stat-card {
  min-height: 120px;
  display: flex;
  align-items: center;
  gap: 24px;
  border: 1px solid #d5deeb;
  border-radius: 10px;
  background: #fff;
  padding: 26px;
  transition: 0.22s ease;
}

.stat-card:hover,
.deadline-card:hover,
.lecture-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
}

.stat-icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: white;
}

.blue { background: #0875f5; }
.purple { background: #8b5cf6; }
.green { background: #16a34a; }

.stat-card h3 {
  margin: 0 0 6px;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  font-family: Georgia, serif;
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
}

.blue-text { color: #0875f5; }
.purple-text { color: #8b5cf6; }
.green-text { color: #16a34a; }

.stat-card p {
  margin: 6px 0 0;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.section-header h2,
.deadline-card h2 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 900;
}

.view-toggle {
  display: inline-flex;
  border: 1px solid #d5deeb;
  border-radius: 8px;
  overflow: hidden;
}

.view-toggle button {
  width: 70px;
  height: 34px;
  border: 0;
  background: #fff;
  color: #64748b;
  font-weight: 800;
}

.view-toggle .active {
  color: #0875f5;
  background: #eff6ff;
}

.timetable {
  display: grid;
  grid-template-columns: 74px repeat(2, minmax(0, 230px));
  align-items: stretch;
}

.date-cell {
  display: grid;
  align-content: center;
  color: #111827;
  font-size: 16px;
  font-weight: 900;
}

.date-cell span {
  display: block;
}

.lecture-card {
  min-height: 156px;
  border: 1px solid #d5deeb;
  background: #fff;
  padding: 24px;
  transition: 0.22s ease;
}

.purple-border {
  border-left: 3px solid #8b5cf6;
}

.green-border {
  border-left: 3px solid #22c55e;
}

.lecture-card strong {
  color: #334155;
}

.lecture-card h3 {
  margin: 22px 0 6px;
  color: #26344d;
  font-size: 16px;
  font-weight: 900;
}

.lecture-card p {
  margin: 0;
  color: #475569;
  font-size: 13px;
}

.deadline-card {
  border: 1px solid #cbd8ea;
  border-radius: 16px;
  background: #fff;
  padding: 22px 20px;
  transition: 0.22s ease;
}

.deadline-row {
  display: flex;
  gap: 14px;
  padding: 13px 0;
  border-bottom: 1px solid #edf2f7;
}

.deadline-row:last-child {
  border-bottom: 0;
}

.deadline-date {
  width: 46px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  background: #dbeafe;
  color: #0875f5;
  flex: 0 0 46px;
}

.deadline-date:first-child {
  background: #0875f5;
  color: white;
}

.deadline-date strong {
  font-size: 17px;
  line-height: 1;
}

.deadline-date span {
  font-size: 10px;
  font-weight: 800;
}

.deadline-row h3 {
  margin: 0 0 4px;
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.deadline-row p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .stats-grid,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .timetable {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.announcements-card {
  border: 1px solid #cbd8ea;
  border-radius: 16px;
  background: #fff;
  padding: 22px 20px;
  transition: 0.22s ease;
}

.announcements-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
}

.announcements-card h2 {
  margin: 0 0 20px;
  color: #111827;
  font-size: 16px;
  font-weight: 900;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  max-height: 350px;
  overflow-y: auto;
}

.announcement-row {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #edf2f7;
}

.announcement-row:last-child {
  border-bottom: 0;
}

.announcement-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #eff6ff;
  color: #0875f5;
}

.announcement-content strong {
  display: block;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.35;
}

.announcement-time {
  display: block;
  margin-top: 2px;
  color: #94a3b8;
  font-size: 11px;
}

.announcement-content p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.empty-announcements {
  padding: 20px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
</style>