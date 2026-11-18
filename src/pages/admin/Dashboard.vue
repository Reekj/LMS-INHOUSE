<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1>Admin Dashboard</h1>

      <p>
        Institution-wide overview
        <span class="dot"></span>
        Osun State University
      </p>
    </div>

    <div class="stats-grid">
      <StatCard
        title="Total Students"
        :value="studentCount.toString()"
        subtitle="Enrolled student profiles"
        :icon="Users"
        color="blue"
      />

      <StatCard
        title="Active Lecturers"
        :value="lecturerCount.toString()"
        subtitle="Registered teaching staff"
        :icon="GraduationCap"
        color="purple"
      />

      <StatCard
        title="Total Courses"
        :value="courseCount.toString()"
        subtitle="Academic course catalog"
        :icon="BookOpen"
        color="green"
      />
    </div>

    <div class="dashboard-grid">
      <div class="left-column">
        <section class="card">
          <div class="section-header">
            <h2>Faculty Activity</h2>

            <button class="link-btn">
              Full report →
            </button>
          </div>

          <AppTable>
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Students</th>
                <th>Courses</th>
                <th>LMS Adoption</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="faculty in faculties"
                :key="faculty.name"
              >
                <td>{{ faculty.name }}</td>
                <td>{{ faculty.students }}</td>
                <td>{{ faculty.courses }}</td>

                <td>
                  <div class="adoption">
                    <div class="track">
                      <div
                        class="fill"
                        :class="faculty.color"
                        :style="{
                          width: faculty.adoption + '%'
                        }"
                      />
                    </div>

                    <span>
                      {{ faculty.adoption }}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </AppTable>
        </section>

        <section class="card">
          <div class="section-header">
            <h2>Recent Activity</h2>

            <button class="link-btn">
              View All →
            </button>
          </div>

          <div class="activity-list">
            <div
              v-for="item in activities"
              :key="item.title"
              class="activity-item"
            >
              <div
                class="activity-dot"
                :class="item.color"
              />

              <div>
                <h4>
                  {{ item.title }}
                </h4>

                <span>
                  {{ item.time }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="right-column">
        <section class="card actions-card">
          <h2>Admin Actions</h2>

          <button
            class="action-btn"
            @click="showBroadcast = true"
          >
            Broadcast Announcement
          </button>

          <button class="action-btn">
            Manage Accounts
          </button>

          <button class="action-btn">
            Download Report
          </button>
        </section>

        <section class="card">
          <h2>System Health</h2>

          <div class="health-list">
            <div class="health-item">
              <span>Portal SSO</span>
              <AppBadge type="success">
                Online
              </AppBadge>
            </div>

            <div class="health-item">
              <span>Video Server</span>
              <AppBadge type="success">
                Online
              </AppBadge>
            </div>

            <div class="health-item">
              <span>File Storage</span>
              <AppBadge type="warning">
                78% full
              </AppBadge>
            </div>

            <div class="health-item">
              <span>Notifications</span>
              <AppBadge type="success">
                Online
              </AppBadge>
            </div>
          </div>
        </section>
      </div>
    </div>

    <AppModal v-model="showBroadcast">
      <div class="broadcast-modal">
        <h2>Broadcast Message</h2>

        <p>
          Send a message to the users
        </p>

        <div class="form-group">
          <label>
            Target Audience
          </label>

          <select v-model="broadcastForm.targetAudience">
            <option value="all">
              All Users
            </option>

            <option value="student">
              Students
            </option>

            <option value="lecturer">
              Lecturers
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>
            Title
          </label>

          <input
            v-model.trim="broadcastForm.title"
            placeholder="e.g Important maintenance notice"
          />
        </div>

        <div class="form-group">
          <label>
            Instructions
          </label>

          <textarea
            v-model.trim="broadcastForm.content"
            rows="5"
            placeholder="Write your announcement here..."
          />
        </div>

        <p v-if="broadcastError" style="color: #ef4444; font-size: 13px; margin: 10px 0 10px; font-weight: 700;">
          {{ broadcastError }}
        </p>

        <div class="modal-actions">
          <AppButton
            variant="secondary"
            :disabled="isSubmitting"
            @click="showBroadcast = false"
          >
            Cancel
          </AppButton>

          <AppButton
            :disabled="isSubmitting"
            @click="submitBroadcast"
          >
            Send
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";

import {
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-vue-next";

import StatCard from "../../components/cards/StatCard.vue";

import AppTable from "../../components/tables/AppTable.vue";
import AppModal from "../../components/common/AppModal.vue";
import AppButton from "../../components/common/AppButton.vue";
import AppBadge from "../../components/common/AppBadge.vue";
import { createBroadcast, getBroadcasts } from "../../api/broadcast.api";
import { getDashboardStats } from "../../api/stats.api";
import { getAllUsers } from "../../api/user.api";
import { getCourses } from "../../api/course.api";

const studentCount = ref(0);
const lecturerCount = ref(0);
const courseCount = ref(0);

const faculties = ref([
  {
    name: "Science, Eng & Technology",
    students: "0",
    courses: 0,
    adoption: 100,
    color: "green",
  },
  {
    name: "Management & Social Sci.",
    students: "0",
    courses: 0,
    adoption: 100,
    color: "orange",
  },
  {
    name: "Health Sciences",
    students: "0",
    courses: 0,
    adoption: 100,
    color: "green",
  },
  {
    name: "Humanities & Culture",
    students: "0",
    courses: 0,
    adoption: 100,
    color: "orange",
  },
]);

const activities = ref([]);

onMounted(async () => {
  if (import.meta.env.VITE_API_URL) {
    try {
      const [statsRes, usersRes, coursesRes, broadcastsRes] = await Promise.all([
        getDashboardStats(),
        getAllUsers(),
        getCourses(),
        getBroadcasts()
      ]);

      if (statsRes.data && statsRes.data.success) {
        studentCount.value = statsRes.data.data.students || 0;
        lecturerCount.value = statsRes.data.data.lecturers || 0;
        courseCount.value = statsRes.data.data.courses || 0;
      }

      // Calculate real Faculty stats based on user list and course list
      const users = usersRes.data.users || [];
      const courses = coursesRes.data.courses || [];

      const facultyDepartments = {
        "Science, Eng & Technology": [
          "Computer Science",
          "Electrical Engineering",
          "Mechanical Engineering",
          "Mathematics",
          "Physics",
        ],
        "Management & Social Sci.": [
          "Accounting",
          "Business Administration",
          "Economics",
          "Political Science",
        ],
        "Health Sciences": [
          "Nursing",
          "Medicine",
          "Public Health",
          "Anatomy",
        ],
        "Humanities & Culture": [
          "History",
          "English",
          "Linguistics",
          "French",
        ],
        "ICT": [
          "ICT"
        ]
      };

      const getFacultyFromDept = (dept) => {
        for (const [fac, depts] of Object.entries(facultyDepartments)) {
          if (depts.includes(dept)) return fac;
        }
        return "Science, Eng & Technology";
      };

      const facCounts = {
        "Science, Eng & Technology": { students: 0, courses: 0 },
        "Management & Social Sci.": { students: 0, courses: 0 },
        "Health Sciences": { students: 0, courses: 0 },
        "Humanities & Culture": { students: 0, courses: 0 },
        "ICT": { students: 0, courses: 0 }
      };

      users.forEach(u => {
        if (u.role === "student" && u.department) {
          const fac = getFacultyFromDept(u.department);
          if (facCounts[fac]) facCounts[fac].students++;
        }
      });

      courses.forEach(c => {
        if (c.department) {
          const fac = getFacultyFromDept(c.department);
          if (facCounts[fac]) facCounts[fac].courses++;
        }
      });

      faculties.value = Object.keys(facCounts).map(facName => {
        const sCount = facCounts[facName].students;
        const cCount = facCounts[facName].courses;
        const adopt = sCount > 0 ? Math.min(100, Math.round((cCount / sCount) * 100)) : (cCount > 0 ? 100 : 0);
        return {
          name: facName,
          students: sCount.toString(),
          courses: cCount,
          adoption: adopt || 100,
          color: adopt > 75 ? "green" : "orange"
        };
      });

      // Populate real activities from Broadcasts
      const list = [];
      const broadcasts = broadcastsRes.data.broadcasts || [];
      broadcasts.slice(0, 4).forEach(b => {
        list.push({
          title: `Broadcast dispatched: "${b.title}"`,
          time: new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          color: b.targetAudience === "all" ? "green" : "purple"
        });
      });

      if (list.length === 0) {
        list.push({
          title: "System initialized. No recent activities recorded.",
          time: "Just now",
          color: "blue"
        });
      }
      activities.value = list;

    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    }
  } else {
    // Offline local fallback defaults
    activities.value = [
      { title: "SSO server health check passed", time: "1h ago", color: "green" },
      { title: "Database backup completed successfully", time: "6h ago", color: "blue" }
    ];
  }
});

const showBroadcast = ref(false);
const isSubmitting = ref(false);
const broadcastError = ref("");

const broadcastForm = reactive({
  targetAudience: "all",
  title: "",
  content: "",
});

async function submitBroadcast() {
  if (!broadcastForm.title || !broadcastForm.content) {
    broadcastError.value = "Title and content are required.";
    return;
  }

  broadcastError.value = "";
  isSubmitting.value = true;

  try {
    await createBroadcast({
      title: broadcastForm.title,
      content: broadcastForm.content,
      targetAudience: broadcastForm.targetAudience,
    });

    // Reset and close
    broadcastForm.title = "";
    broadcastForm.content = "";
    broadcastForm.targetAudience = "all";
    showBroadcast.value = false;

    // Refresh dashboard activities list to show new broadcast
    if (import.meta.env.VITE_API_URL) {
      const broadcastsRes = await getBroadcasts();
      const list = [];
      const broadcasts = broadcastsRes.data.broadcasts || [];
      broadcasts.slice(0, 4).forEach(b => {
        list.push({
          title: `Broadcast dispatched: "${b.title}"`,
          time: new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          color: b.targetAudience === "all" ? "green" : "purple"
        });
      });
      activities.value = list;
    }
  } catch (err) {
    console.error("Failed to send broadcast:", err);
    broadcastError.value = err.response?.data?.error || err.message || "Failed to send broadcast message.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.dashboard-page {
  width: 100%;
}

.page-header {
  margin-bottom: 28px;
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 48px;
  font-family: Georgia, serif;
  color: #0f172a;
}

.page-header p {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #94a3b8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.card {
  background: white;
  border: 1px solid #d9e2ef;
  border-radius: 10px;
  padding: 24px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-header h2,
.card h2 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}

.link-btn {
  background: none;
  border: none;
  color: #1677ff;
  cursor: pointer;
}

.adoption {
  display: flex;
  align-items: center;
  gap: 12px;
}

.track {
  width: 90px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 999px;
}

.fill {
  height: 100%;
  border-radius: 999px;
}

.fill.green {
  background: #2f6b1f;
}

.fill.orange {
  background: #f59e0b;
}

.activity-item {
  display: flex;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid #e2e8f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 8px;
  height: 8px;
  margin-top: 8px;
  border-radius: 50%;
}

.activity-dot.orange { background:#f59e0b; }
.activity-dot.green { background:#16a34a; }
.activity-dot.purple { background:#8b5cf6; }
.activity-dot.red { background:#ef4444; }

.activity-item h4 {
  margin: 0 0 4px;
  font-weight: 500;
}

.activity-item span {
  font-size: 12px;
  color: #94a3b8;
}

.actions-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  height: 42px;
  border: none;
  border-radius: 4px;
  background: #1677ff;
  color: white;
  cursor: pointer;
}

.health-list {
  display: flex;
  flex-direction: column;
}

.health-item {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #e2e8f0;
}

.health-item:last-child {
  border-bottom: none;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border: 1px solid #d9e2ef;
  border-radius: 4px;
  padding: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.broadcast-modal h2 {
  font-family: Georgia, serif;
  font-size: 40px;
  margin-bottom: 8px;
}

.broadcast-modal p {
  margin-bottom: 24px;
  color: #64748b;
}
</style>