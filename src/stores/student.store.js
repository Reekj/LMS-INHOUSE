import { defineStore } from "pinia";
import { useAuthStore } from "./auth.store";
import { getMyCourses, getCourseGrades } from "../api/course.api";
import { getEvents } from "../api/event.api";
import { getCourseTests } from "../api/test.api";
import { getCourseAssignments, getMyGroup, createGroup, joinGroup, submitAssignment } from "../api/assignment.api";
import { getCourseForumPosts, createForumPost, likeForumPost, addForumComment } from "../api/forum.api";
import { eventsForDate } from "../utils/calendarEvents";

// v2: v1 caches held demo data and could belong to another account.
export const STUDENT_STORAGE_KEY = "uniosun_lms_student_v2";
const STORAGE_KEY = STUDENT_STORAGE_KEY;

// Everything starts empty: the student sees only what the backend returns for them.
const defaultState = {
  ownerId: "",
  currentStudent: {
    id: "",
    name: "",
    firstName: "",
    initials: "",
    matricNo: "",
    level: "",
    department: "",
    departmentShort: "",
    session: "",
  },
  courses: [],
  courseMaterials: [],
  courseVideos: [],
  assignments: [],
  groups: [],
  previousSubmissions: [],
  grades: [],
  discussions: [],
  courseBoards: [],
  timetable: [],
  calendarEvents: [],
  academicBands: [],
  tests: [],
  deadlines: [],
  notifications: [],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function sanitizeLongText(value) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, 2000);
}

function currentUserId() {
  try {
    const auth = useAuthStore();
    return String(auth.user?.id || auth.user?._id || "");
  } catch {
    return "";
  }
}

// Restore the cached copy only if it belongs to the signed-in student.
function loadState() {
  const fresh = clone(defaultState);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const ownerId = currentUserId();
    if (!saved || !ownerId || saved.ownerId !== ownerId) {
      return { ...fresh, ownerId };
    }
    const restored = { ...fresh };
    Object.keys(fresh).forEach((key) => {
      if (key in saved) restored[key] = saved[key];
    });
    restored.currentStudent = { ...fresh.currentStudent, ...(saved.currentStudent || {}) };
    return restored;
  } catch {
    return fresh;
  }
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const TIMETABLE_COLORS = ["blue", "purple", "green", "red"];

function toDateKey(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

// Minutes since midnight for "9:00 AM" / "14:30", for sorting within a day.
function timeToMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 24 * 60;
  let hours = Number(match[1]);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + Number(match[2]);
}

// Lectures (not tests) from the student's own courses over the next 7 days.
function buildTimetable(calendarEvents, courses) {
  const lectures = calendarEvents.filter((event) => event.type !== "test");
  const colorByCourse = new Map(
    courses.map((course, index) => [course.code, TIMETABLE_COLORS[index % TIMETABLE_COLORS.length]])
  );
  const today = new Date();
  const rows = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const dateKey = toDateKey(day);
    eventsForDate(lectures, dateKey)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
      .forEach((event) => {
        rows.push({
          id: event.id,
          day: WEEKDAYS[day.getDay()],
          date: `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`,
          time: event.startTime,
          courseCode: event.courseCode,
          title: event.courseTitle || event.fullTitle,
          venue: [event.fullTitle, event.location].filter(Boolean).join(" · "),
          color: colorByCourse.get(event.courseCode) || "blue",
        });
      });
  }
  return rows;
}

// Upcoming tests and assignments, soonest first.
function buildDeadlines(tests, assignments) {
  const todayKey = toDateKey(new Date());
  const items = [
    ...tests.map((test) => ({
      id: `deadline-test-${test.id}`,
      dateKey: test.date,
      time: test.time,
      courseCode: test.courseCode,
      title: test.title,
      meta: [test.time, test.mode].filter(Boolean).join(" · "),
    })),
    ...assignments
      .filter((assignment) => assignment.dueDate)
      .map((assignment) => {
        const due = new Date(assignment.dueDate);
        return {
          id: `deadline-assignment-${assignment.id}`,
          dateKey: toDateKey(due),
          time: due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          courseCode: assignment.courseCode,
          title: `${assignment.title} (Assignment)`,
          meta: `Due ${due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
        };
      }),
  ]
    .filter((item) => item.dateKey && item.dateKey >= todayKey)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || timeToMinutes(a.time) - timeToMinutes(b.time))
    .slice(0, 6);

  return items.map((item, index) => {
    const date = parseDateKey(item.dateKey);
    return {
      id: item.id,
      day: String(date.getDate()),
      month: MONTHS[date.getMonth()],
      courseCode: item.courseCode,
      title: item.title,
      meta: item.meta,
      active: index === 0,
    };
  });
}

export const useStudentStore = defineStore("student", {
  state: () => loadState(),

  getters: {
    enrolledCoursesCount(state) {
      return state.courses.length;
    },

    // Assignments whose due date has not passed yet.
    pendingAssignmentsCount(state) {
      const now = Date.now();
      return state.assignments.filter(
        (item) => item.dueDate && new Date(item.dueDate).getTime() >= now
      ).length;
    },

    upcomingTestsCount(state) {
      return state.tests.length;
    },

    groupedTimetable(state) {
      return state.timetable.reduce((groups, item) => {
        const key = `${item.day}-${item.date}`;

        if (!groups[key]) {
          groups[key] = {
            day: item.day,
            date: item.date,
            classes: [],
          };
        }

        groups[key].classes.push(item);
        return groups;
      }, {});
    },

    getCourseById: (state) => (courseId) => {
      const idStr = String(courseId || "");
      const clean = (s) => String(s || "").toUpperCase().replace(/[\s\-_]+/g, "");
      const norm = clean(idStr);
      return state.courses.find(
        (course) =>
          String(course.id) === idStr ||
          String(course._id) === idStr ||
          (clean(course.code || course.courseCode) === norm && norm)
      );
    },

    getMaterialsByCourse: (state) => (courseId) => {
      const idStr = String(courseId || "");
      const courseObj = state.courses.find(
        (c) => String(c.id) === idStr || String(c._id) === idStr
      );
      const validIds = new Set([idStr, ...(courseObj ? [String(courseObj.id), String(courseObj._id)] : [])]);
      return state.courseMaterials.filter((item) => validIds.has(String(item.courseId)));
    },

    getVideosByCourse: (state) => (courseId) => {
      const idStr = String(courseId || "");
      const courseObj = state.courses.find(
        (c) => String(c.id) === idStr || String(c._id) === idStr
      );
      const validIds = new Set([idStr, ...(courseObj ? [String(courseObj.id), String(courseObj._id)] : [])]);
      return state.courseVideos.filter((item) => validIds.has(String(item.courseId)));
    },

    getAssignmentsByCourse: (state) => (courseId) => {
      const idStr = String(courseId || "");
      const clean = (s) => String(s || "").toUpperCase().replace(/[\s\-_]+/g, "");
      const norm = clean(idStr);
      const courseObj = state.courses.find(
        (course) =>
          String(course.id) === idStr ||
          String(course._id) === idStr ||
          (clean(course.code || course.courseCode) === norm && norm)
      );
      const validIds = new Set([
        idStr,
        norm,
        ...(courseObj
          ? [
              String(courseObj.id),
              String(courseObj._id),
              clean(courseObj.code || courseObj.courseCode),
            ]
          : []),
      ]);

      return (state.assignments || []).filter((item) => {
        const itemCId = String(item.courseId || "");
        const itemCCode = item.courseCode || "";
        const itemBackendId = String(item.backendCourseId || "");
        return (
          validIds.has(itemCId) ||
          validIds.has(clean(itemCId)) ||
          validIds.has(clean(itemCCode)) ||
          validIds.has(itemBackendId)
        );
      });
    },

    getAssignmentById: (state) => (assignmentId) => {
      const idStr = String(assignmentId || "");
      return state.assignments.find((item) => String(item.id) === idStr || String(item._id) === idStr);
    },

    getDiscussionsByCourse: (state) => (courseId) => {
      const idStr = String(courseId || "");
      const courseObj = state.courses.find(
        (c) => String(c.id) === idStr || String(c._id) === idStr
      );
      const validIds = new Set([idStr, ...(courseObj ? [String(courseObj.id), String(courseObj._id)] : [])]);
      return state.discussions.filter((item) => validIds.has(String(item.courseId)));
    },

    getGradesByCourse: (state) => (courseId) => {
      const idStr = String(courseId || "");
      const courseObj = state.courses.find(
        (c) => String(c.id) === idStr || String(c._id) === idStr
      );
      const validIds = new Set([idStr, ...(courseObj ? [String(courseObj.id), String(courseObj._id)] : [])]);
      return state.grades.filter((item) => validIds.has(String(item.courseId)));
    },

    getGroupForAssignment: (state) => (assignmentId) => {
      const idStr = String(assignmentId || "");
      const assignment = state.assignments.find((item) => String(item.id) === idStr || String(item._id) === idStr);

      if (!assignment?.groupId) return null;

      return (
        state.groups.find(
          (group) =>
            String(group.id) === String(assignment.groupId) ||
            String(group._id) === String(assignment.groupId)
        ) || null
      );
    },
  },

  actions: {
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ownerId: this.ownerId,
          currentStudent: this.currentStudent,
          courses: this.courses,
          courseMaterials: this.courseMaterials,
          courseVideos: this.courseVideos,
          assignments: this.assignments,
          groups: this.groups,
          previousSubmissions: this.previousSubmissions,
          grades: this.grades,
          discussions: this.discussions,
          courseBoards: this.courseBoards,
          timetable: this.timetable,
          calendarEvents: this.calendarEvents,
          academicBands: this.academicBands,
          tests: this.tests,
          deadlines: this.deadlines,
          notifications: this.notifications,
        })
      );
    },

    syncCurrentStudent(user) {
      if (!user) return;
      const fullName = user.name || "";
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = user.firstName || nameParts[0] || "";
      const initials = nameParts.map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "ST";

      this.currentStudent = {
        ...this.currentStudent,
        id: user.id || user._id || this.currentStudent?.id || "",
        name: fullName || this.currentStudent?.name || "Student",
        firstName: firstName || this.currentStudent?.firstName || "Student",
        initials: initials || this.currentStudent?.initials || "ST",
        matricNo: user.identifier || user.matricNo || this.currentStudent?.matricNo || "",
        department: user.department || "",
        email: user.email || this.currentStudent?.email || "",
        phone: user.phone || this.currentStudent?.phone || "",
      };
      this.persist();
    },

    async fetchStudentDataFromDB() {
      const authStore = useAuthStore();
      if (!authStore.user) return;

      // Drop anything cached for a different account before loading.
      const ownerId = String(authStore.user.id || authStore.user._id || "");
      if (this.ownerId !== ownerId) {
        Object.assign(this, clone(defaultState), { ownerId });
      }
      this.syncCurrentStudent(authStore.user);

      try {
        const [coursesRes, eventsRes] = await Promise.all([getMyCourses(), getEvents()]);
        const myDbCourses = coursesRes.data?.courses || [];

        // Keep the signed-in user's enrollment list current for other pages.
        const enrolledIds = (coursesRes.data?.enrolledCourses || myDbCourses.map((c) => c._id)).map(String);
        authStore.user.enrolledCourses = enrolledIds;
        try {
          const storedAuth = JSON.parse(localStorage.getItem("uniosun_lms_auth") || "{}");
          if (storedAuth.user) {
            storedAuth.user.enrolledCourses = enrolledIds;
            localStorage.setItem("uniosun_lms_auth", JSON.stringify(storedAuth));
          }
        } catch {
          // Stored auth is a convenience copy; ignore failures.
        }

        const getFileTypeFromName = (name, category = "") => {
          const ext = String(name || "").split(".").pop()?.toLowerCase();
          if (category === "Video Lectures") return "mp4";
          if (ext === "pdf") return "pdf";
          if (["ppt", "pptx"].includes(ext)) return "pptx";
          if (["doc", "docx"].includes(ext)) return "docx";
          if (ext === "mp4") return "mp4";
          if (ext === "zip") return "zip";
          return "file";
        };

        const materialsList = [];
        const videosList = [];
        myDbCourses.forEach((c) => {
          (c.materials || []).forEach((m) => {
            const mapped = {
              id: m._id || m.s3Key,
              courseId: c._id,
              title: m.title,
              description: m.description || "",
              category: m.category || "Lecture Notes (PDF)",
              type: getFileTypeFromName(m.fileName || m.title, m.category),
              week: m.week || "",
              date: m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString() : "",
              size: m.size || "",
              allowDownload: m.allowDownload !== false,
              fileName: m.fileName || m.title,
              mimeType: m.mimeType || "",
              duration: m.duration || "",
              s3Key: m.s3Key,
            };
            if (mapped.category === "Video Lectures" || mapped.type === "mp4") {
              videosList.push(mapped);
            } else {
              materialsList.push(mapped);
            }
          });
        });

        this.courses = myDbCourses.map((c) => ({
          id: c._id,
          _id: c._id,
          code: c.courseCode,
          title: c.title,
          units: c.units || "",
          lecturer: c.lecturer || "Not Assigned",
          department: c.department || "",
          theme: "purple",
          materialsCount: materialsList.filter((m) => String(m.courseId) === String(c._id)).length,
          videosCount: videosList.filter((v) => String(v.courseId) === String(c._id)).length,
        }));
        this.courseMaterials = materialsList;
        this.courseVideos = videosList;

        // Assignments only for the courses the student takes.
        this.assignments = this.assignments.filter((a) =>
          enrolledIds.includes(String(a.backendCourseId || a.courseId))
        );
        await Promise.all(this.courses.map((c) => this.fetchAssignments(c.id)));

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
          if (lowered.includes("test")) return "test";
          if (lowered.includes("assignment") || lowered.includes("due")) return "assignment";
          return "lecture";
        };
        const getColorFromType = (type) => {
          if (type === "test") return "green";
          if (type === "assignment") return "purple";
          return "blue";
        };

        // The backend already limits a student's events to their courses.
        const calendarEvents = (eventsRes.data?.events || []).map((e) => {
          const type = getTypeFromTitle(e.title);
          return {
            id: e._id,
            title: e.course?.courseCode || "",
            fullTitle: e.title,
            courseCode: e.course?.courseCode || "",
            courseTitle: e.course?.title || "",
            lecturer: e.lecturer?.name || "Lecturer",
            date: String(e.date || "").split("T")[0],
            startTime: formatTime12h(e.startTime),
            endTime: formatTime12h(e.endTime),
            frequency: e.frequency || "once",
            recurrenceEndDate: String(e.recurrenceEndDate || "").split("T")[0],
            location: e.locationDetails || "Online",
            note: e.instruction || "Attendance is compulsory.",
            color: getColorFromType(type),
            type,
          };
        });

        const testResponses = await Promise.all(
          myDbCourses.map((course) =>
            getCourseTests(course._id).catch(() => ({ data: { tests: [] } }))
          )
        );
        const scheduledTests = testResponses.flatMap((response, index) =>
          (response.data?.tests || []).map((test) => ({ ...test, courseDoc: myDbCourses[index] }))
        );

        this.calendarEvents = [
          ...calendarEvents,
          ...scheduledTests.map((test) => ({
            id: `test-${test._id}`,
            title: test.courseDoc.courseCode,
            fullTitle: test.testTitle,
            courseCode: test.courseDoc.courseCode,
            courseTitle: test.courseDoc.title,
            lecturer: "Lecturer",
            date: String(test.date || "").split("T")[0],
            startTime: formatTime12h(test.startTime),
            endTime: formatTime12h(test.endTime),
            location: "Online (LMS)",
            note: test.instructions || "Scheduled online test.",
            color: "green",
            type: "test",
            frequency: "once",
          })),
        ];

        // Tests the student still has to take (not yet submitted, not closed).
        this.tests = scheduledTests
          .filter((test) => test.status !== "closed" && !test.submission)
          .map((test) => ({
            id: test._id,
            courseCode: test.courseDoc.courseCode,
            title: test.testTitle,
            date: String(test.date || "").split("T")[0],
            time: formatTime12h(test.startTime),
            mode: "Online (LMS)",
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        this.timetable = buildTimetable(calendarEvents, this.courses);
        this.deadlines = buildDeadlines(this.tests, this.assignments);
        this.persist();
      } catch (err) {
        console.error("Failed to fetch student data from DB:", err);
      }
    },

    async fetchCourseGrades(courseId) {
      try {
        const res = await getCourseGrades(courseId);
        if (res.data && res.data.success) {
          this.grades = res.data.grades.map(g => ({
            id: g.name + g.date,
            courseId,
            title: g.name,
            type: g.type === 'test' ? 'Test' : 'Assignment',
            date: new Date(g.date).toLocaleDateString(),
            maxScore: g.maxScore,
            score: g.score,
            status: g.score !== null ? 'Graded' : 'Pending',
            feedback: g.feedback || ""
          }));
          this.persist();
        }
      } catch (err) {
        console.error("Failed to fetch course grades:", err);
      }
    },

    async fetchCourseForum(courseId) {
      try {
        const res = await getCourseForumPosts(courseId);
        if (res.data && res.data.success) {
          // Clear existing discussions for this course first to avoid duplicates
          this.discussions = this.discussions.filter(d => d.courseId !== courseId);
          
          const authStore = useAuthStore();
          const currentUserId = authStore.user?.id || this.currentStudent.id;

          const newDiscussions = res.data.posts.map(p => {
            const initials = p.author?.name ? p.author.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "AN";
            return {
              id: p._id,
              courseId: p.course,
              type: p.postType ? (p.postType.charAt(0).toUpperCase() + p.postType.slice(1)) : "General",
              body: p.content,
              title: p.title,
              authorName: p.author?.name || "Anonymous",
              authorRole: p.author?.role || "student",
              initials,
              timeLabel: new Date(p.createdAt).toLocaleDateString(),
              likes: p.likes?.length || 0,
              liked: p.likes?.includes(currentUserId) || false,
              officialAnswer: p.officialAnswer,
              replies: p.comments ? p.comments.map(c => {
                const commentInitials = c.author?.name ? c.author.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "AN";
                return {
                  id: c._id,
                  authorName: c.author?.name || "Anonymous",
                  authorRole: c.author?.role || "student",
                  initials: commentInitials,
                  body: c.content,
                  timeLabel: new Date(c.createdAt).toLocaleDateString()
                };
              }) : []
            };
          });

          this.discussions.unshift(...newDiscussions);
          this.persist();
        }
      } catch (err) {
        console.error("Failed to fetch course forum from DB:", err);
      }
    },

    async toggleDiscussionLike(postId) {
      try {
        const res = await likeForumPost(postId);
        if (res.data && res.data.success) {
          const post = this.discussions.find(item => item.id === postId);
          if (post) {
            post.liked = res.data.liked;
            post.likes = res.data.likesCount;
            this.persist();
          }
        }
      } catch (err) {
        console.error("Failed to toggle discussion like on DB, falling back to local toggle:", err);
        const post = this.discussions.find(item => item.id === postId);
        if (post) {
          post.liked = !post.liked;
          post.likes = post.liked ? post.likes + 1 : Math.max(0, post.likes - 1);
          this.persist();
        }
      }
    },

    async createDiscussionPost(payload) {
      const body = sanitizeLongText(payload.body);
      if (!body) return { success: false, message: "Post content is required." };
      const title = payload.title || sanitizeText(payload.body).slice(0, 50);

      try {
        const res = await createForumPost({
          courseId: payload.courseId,
          title,
          content: body,
          postType: (payload.type || "general").toLowerCase()
        });

        if (res.data && res.data.success) {
          const p = res.data.post;
          const authStore = useAuthStore();
          const initials = authStore.userInitials || this.currentStudent.initials;
          const post = {
            id: p._id,
            courseId: p.course,
            type: p.postType ? (p.postType.charAt(0).toUpperCase() + p.postType.slice(1)) : "General",
            body: p.content,
            title: p.title,
            authorName: authStore.userName || this.currentStudent.name,
            authorRole: authStore.userRole || "student",
            initials,
            timeLabel: "Now",
            likes: 0,
            liked: false,
            replies: []
          };
          this.discussions.unshift(post);
          this.persist();
          return { success: true, post };
        }
        throw new Error("Failed to save post to backend.");
      } catch (err) {
        // Report the failure: a post kept only in this browser reaches nobody.
        return {
          success: false,
          message: err.response?.data?.error || "Your post could not be sent. Please try again.",
        };
      }
    },

    async addDiscussionReply(postId, content) {
      if (!content) return { success: false, message: "Reply content is required." };
      const cleaned = sanitizeLongText(content);

      try {
        const res = await addForumComment(postId, { content: cleaned });
        if (res.data && res.data.success) {
          const comment = res.data.comment;
          const post = this.discussions.find(item => item.id === postId);
          if (post) {
            const authStore = useAuthStore();
            const initials = authStore.userInitials || this.currentStudent.initials;
            if (!post.replies) post.replies = [];
            post.replies.push({
              id: comment._id,
              authorName: authStore.userName || this.currentStudent.name,
              authorRole: authStore.userRole || "student",
              initials,
              body: comment.content,
              timeLabel: "Now"
            });
            this.persist();
          }
          return { success: true };
        }
        throw new Error("Failed to save reply comment to backend.");
      } catch (err) {
        return {
          success: false,
          message: err.response?.data?.error || "Your reply could not be sent. Please try again.",
        };
      }
    },

    async fetchAssignments(courseId) {
      if (!courseId) return;

      const courseObj = this.getCourseById(courseId);
      const effectiveCourseId = courseObj?._id || courseObj?.id || courseId;

      try {
        const res = await getCourseAssignments(effectiveCourseId);
        if (res.data && res.data.success && Array.isArray(res.data.assignments)) {
          const fetched = res.data.assignments.map((a) => {
            return {
              id: a._id,
              _id: a._id,
              courseId: courseId,
              backendCourseId: a.course,
              courseCode: a.courseCode || courseObj?.code || "",
              title: a.title,
              due: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "Not set",
              dueDate: a.dueDate || null,
              maxScore: Number(a.totalMarks) || (a.groupSize ? 100 : 20),
              score: "",
              status: "Due today",
              type: a.isGroupAssignment || a.type === "grouped" ? "group" : "individual",
              groupMode: a.groupMethod || "student_choose",
              instructions: a.description || "No assignment instruction provided.",
              fileTypes: "PDF, DOCX",
              maxSize: "10 MB",
              comments: "",
              submittedFileName: "",
              feedback: "",
              studentGroupStatus: a.isGroupAssignment ? "none" : null,
              groupId: null,
              inviteCode: "",
              isLeader: false,
            };
          });

          // Merge without losing assignments from other courses
          const otherCoursesAssignments = (this.assignments || []).filter(
            (item) => String(item.courseId) !== String(courseId)
          );
          // Also keep any local submissions/states for assignments that already exist
          const mergedThisCourse = fetched.map((newItem) => {
            const existing = (this.assignments || []).find((e) => String(e.id) === String(newItem.id));
            if (existing) {
              return {
                ...newItem,
                ...existing,
                title: newItem.title,
                instructions: newItem.instructions,
                due: newItem.due,
                dueDate: newItem.dueDate,
              };
            }
            return newItem;
          });

          this.assignments = [...mergedThisCourse, ...otherCoursesAssignments];
          this.persist();
        }
      } catch (err) {
        console.warn("Failed to fetch assignments from API:", err);
      }
    },

    async fetchMyGroup(assignmentId) {
      try {
        const res = await getMyGroup(assignmentId);
        if (res.data && res.data.success) {
          const g = res.data.group;
          const assignment = this.assignments.find(a => a.id === assignmentId);
          if (assignment) {
            assignment.groupId = g._id;
            assignment.inviteCode = g.code;
            assignment.isLeader = g.leader?._id === this.currentStudent.id || g.leader === this.currentStudent.id;
            assignment.studentGroupStatus = assignment.isLeader ? "leader" : "member";
          }
          const existingGrpIdx = this.groups.findIndex(item => item.id === g._id);
          const mappedGroup = {
            id: g._id,
            assignmentId,
            name: `Group - ${g.code}`,
            inviteCode: g.code,
            maxMembers: 5,
            members: g.members.map(m => ({
              id: m._id || m,
              name: m.name || "Student",
              matricNo: m.identifier || "",
              initials: m.name ? m.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ST",
              leader: (g.leader?._id || g.leader) === (m._id || m)
            }))
          };
          if (existingGrpIdx !== -1) {
            this.groups[existingGrpIdx] = mappedGroup;
          } else {
            this.groups.push(mappedGroup);
          }
          this.persist();
          return g;
        }
      } catch {
        // Silent fail
      }
      return null;
    },

    async createGroup(assignmentId) {
      try {
        const res = await createGroup(assignmentId);
        if (res.data && res.data.success) {
          const g = res.data.group;
          const assignment = this.assignments.find(a => a.id === assignmentId);
          if (assignment) {
            assignment.groupId = g._id;
            assignment.inviteCode = g.code;
            assignment.isLeader = true;
            assignment.studentGroupStatus = "leader";
          }
          const group = {
            id: g._id,
            assignmentId,
            name: `Group - ${g.code}`,
            inviteCode: g.code,
            maxMembers: 5,
            members: [
              {
                id: this.currentStudent.id,
                name: this.currentStudent.name,
                matricNo: this.currentStudent.matricNo,
                initials: this.currentStudent.initials,
                leader: true
              }
            ]
          };
          this.groups.push(group);
          this.persist();
          return { success: true, group };
        }
        return { success: false, message: "Failed to create group." };
      } catch (err) {
        return { success: false, message: err.response?.data?.error || err.message };
      }
    },

    async joinGroup(assignmentId, code) {
      try {
        const res = await joinGroup(assignmentId, code);
        if (res.data && res.data.success) {
          const assignment = this.assignments.find(a => a.id === assignmentId);
          if (assignment) {
            assignment.groupId = res.data.group._id;
            assignment.inviteCode = res.data.group.code;
            assignment.isLeader = false;
            assignment.studentGroupStatus = "member";
          }
          await this.fetchMyGroup(assignmentId);
          return { success: true };
        }
        return { success: false, message: "Failed to join group." };
      } catch (err) {
        return { success: false, message: err.response?.data?.error || err.message };
      }
    },

    saveSubmissionDraft(assignmentId, payload) {
      const assignment = this.assignments.find((item) => item.id === assignmentId);
      if (!assignment) return { success: false, message: "Assignment not found." };
      assignment.comments = sanitizeLongText(payload.comments);
      assignment.submittedFileName = sanitizeText(payload.fileName);
      assignment.draftSaved = true;
      this.persist();
      return { success: true };
    },

    async submitAssignment(assignmentId, payload) {
      try {
        const assignment = this.assignments.find(item => item.id === assignmentId);
        if (!assignment) return { success: false, message: "Assignment not found." };

        const formData = new FormData();
        formData.append("file", payload.file);

        const res = await submitAssignment(assignmentId, formData);
        if (res.data && res.data.success) {
          assignment.comments = sanitizeLongText(payload.comments);
          assignment.submittedFileName = sanitizeText(payload.fileName);
          assignment.status = "Submitted";
          assignment.submittedAt = new Date().toISOString();
          this.persist();
          return { success: true };
        }
        return { success: false, message: "Failed to submit assignment." };
      } catch (err) {
        return { success: false, message: err.response?.data?.error || err.message };
      }
    },
  },
});