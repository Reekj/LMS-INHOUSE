import { defineStore } from "pinia";
import { useAuthStore } from "./auth.store";
import { getCourses, getCourseGrades } from "../api/course.api";
import { getAllUsers } from "../api/user.api";
import { getEvents } from "../api/event.api";
import { getCourseTests } from "../api/test.api";
import { getCourseAssignments, getMyGroup, createGroup, joinGroup, submitAssignment } from "../api/assignment.api";
import { getCourseForumPosts, createForumPost, likeForumPost, addForumComment } from "../api/forum.api";

const STORAGE_KEY = "uniosun_lms_student_v1";
const LECTURER_MATERIALS_KEY = "uniosun_lms_lecturer_materials_v1";
const LECTURER_WORKSPACE_KEY = "uniosun_lms_lecturer_workspace_v1";

const defaultState = {
  currentStudent: {
    id: "stu-001",
    name: "Adebayo Johnson",
    firstName: "Adebayo",
    initials: "AJ",
    matricNo: "NRS/2021/042",
    level: "300L",
    department: "Nursing",
    departmentShort: "Nursing Dept.",
    session: "2025/2026 Session - Semester 2",
  },

  courses: [],

  courseMaterials: [
    {
      id: "mat-1",
      courseId: "csc-112",
      title: "What is Computer Science.pdf",
      category: "Lecture Notes (PDF)",
      type: "pdf",
      week: 7,
      date: "April 4",
      size: "1.2 MB",
      allowDownload: true,
      fileUrl: "",
      fileName: "What is Computer Science.pdf",
    },
    {
      id: "mat-2",
      courseId: "csc-112",
      title: "Number Systems Slide.pptx",
      category: "Slides (PPT)",
      type: "pptx",
      week: 6,
      date: "March 31",
      size: "3.5 MB",
      allowDownload: true,
      fileUrl: "",
      fileName: "Number Systems Slide.pptx",
    },
    {
      id: "mat-3",
      courseId: "csc-112",
      title: "Introduction to Programming.pdf",
      category: "Lecture Notes (PDF)",
      type: "pdf",
      week: 6,
      date: "March 30",
      size: "2.2 MB",
      allowDownload: false,
      fileUrl: "",
      fileName: "Introduction to Programming.pdf",
    },
    {
      id: "mat-4",
      courseId: "csc-112",
      title: "Introduction to Database.docx",
      category: "Past Questions",
      type: "docx",
      week: 6,
      date: "March 30",
      size: "2.2 MB",
      allowDownload: false,
      fileUrl: "",
      fileName: "Introduction to Database.docx",
    },
    {
      id: "mat-5",
      courseId: "csc-112",
      title: "SQL Practice Exercises.zip",
      category: "Past Questions",
      type: "zip",
      week: 2,
      date: "March 3",
      size: "820 KB",
      allowDownload: true,
      fileUrl: "",
      fileName: "SQL Practice Exercises.zip",
    },
  ],

  courseVideos: [
    {
      id: "vid-1",
      courseId: "csc-112",
      title: "Intro to DBMS",
      fullTitle: "Introduction to DBMS - What is a Database?",
      duration: "38:16",
      currentTime: "14:32",
      lecturer: "Dr Folake Adesanya",
      week: 1,
      allowDownload: false,
      fileUrl: "",
      description:
        "This lecture introduces the concept of databases, why they are used over flat file systems, the roles of a DBMS, and overview of major DBMS vendors. By the end you should understand what a database is, what a DBMS does, and name 3 real-world examples.",
    },
    {
      id: "vid-2",
      courseId: "csc-112",
      title: "ER Modelling Deep Dive",
      fullTitle: "ER Modelling Deep Dive",
      duration: "45:10",
      currentTime: "00:00",
      lecturer: "Dr Folake Adesanya",
      week: 3,
      allowDownload: false,
      fileUrl: "",
      description:
        "A deeper look into entities, relationships, cardinality and ER diagram design.",
    },
    {
      id: "vid-3",
      courseId: "csc-112",
      title: "SQL Basics",
      fullTitle: "SQL Basics",
      duration: "52:18",
      currentTime: "00:00",
      lecturer: "Dr Folake Adesanya",
      week: 4,
      allowDownload: false,
      fileUrl: "",
      description:
        "Introduction to SELECT, INSERT, UPDATE, DELETE and simple filtering.",
    },
    {
      id: "vid-4",
      courseId: "csc-112",
      title: "Normalization",
      fullTitle: "Normalization",
      duration: "41:29",
      currentTime: "00:00",
      lecturer: "Dr Folake Adesanya",
      week: 7,
      allowDownload: false,
      fileUrl: "",
      description:
        "Normalization rules from 1NF to 3NF with practical examples.",
    },
    {
      id: "vid-5",
      courseId: "csc-112",
      title: "JOINs and Subqueries",
      fullTitle: "JOINs and Subqueries",
      duration: "15:33",
      currentTime: "00:00",
      lecturer: "Dr Folake Adesanya",
      week: 9,
      allowDownload: false,
      fileUrl: "",
      description:
        "Using joins and subqueries to retrieve related data from multiple tables.",
    },
  ],

  assignments: [],

  groups: [
    {
      id: "grp-8",
      assignmentId: "ass-3",
      name: "Group 8",
      inviteCode: "DBX-892",
      maxMembers: 5,
      members: [
        {
          id: "stu-demo-leader",
          name: "Adebayo Oluwaseun",
          matricNo: "CSC/2021/040",
          initials: "AO",
          leader: true,
        },
        {
          id: "stu-002",
          name: "Bola Mogaji",
          matricNo: "CSC/2021/057",
          initials: "BM",
          leader: false,
        },
        {
          id: "stu-003",
          name: "Emeka Bello",
          matricNo: "CSC/2021/019",
          initials: "EB",
          leader: false,
        },
      ],
    },
  ],

  previousSubmissions: [
    {
      id: "prev-1",
      courseId: "csc-112",
      title: "SQL Queries Practice",
      subtitle: "Assignment #1",
    },
    {
      id: "prev-2",
      courseId: "csc-112",
      title: "Normalization Exercise",
      subtitle: "Assignment #2",
    },
    {
      id: "prev-3",
      courseId: "csc-112",
      title: "ER Diagram",
      subtitle: "Assignment #3",
    },
  ],

  grades: [
    {
      id: "grade-1",
      courseId: "csc-112",
      title: "Number Conversion",
      type: "Assignment",
      date: "Mar 10",
      maxScore: 20,
      score: 18,
      status: "Graded",
      feedback: "Excellent work. Clear steps and correct conversion.",
    },
    {
      id: "grade-2",
      courseId: "csc-112",
      title: "Algorithm Design",
      type: "Assignment",
      date: "Mar 24",
      maxScore: 20,
      score: 17,
      status: "Graded",
      feedback: "Good logic. Improve the pseudocode structure.",
    },
    {
      id: "grade-3",
      courseId: "csc-112",
      title: "Mid-term Test",
      type: "Test",
      date: "Apr 3",
      maxScore: 40,
      score: 36,
      status: "Graded",
      feedback: "Strong performance.",
    },
    {
      id: "grade-4",
      courseId: "csc-112",
      title: "Database Structure",
      type: "Assignment",
      date: "Apr 4",
      maxScore: 20,
      score: "",
      status: "Pending",
      feedback: "",
    },
  ],

  discussions: [
    {
      id: "disc-1",
      courseId: "csc-112",
      authorName: "Emeka B.",
      authorRole: "student",
      initials: "EB",
      type: "Question",
      body:
        "What’s the time complexity of QuickSort in the worst case, and when does it happen?",
      timeLabel: "2d",
      likes: 12,
      liked: false,
      replies: [
        {
          id: "rep-1",
          authorName: "Dr. Folake Adesanya",
          authorRole: "lecturer",
          initials: "FA",
          body:
            "Worst case is O(n²) — happens when the pivot is always the min or max. Use randomized pivot selection to avoid this.",
          timeLabel: "1d",
        },
      ],
    },
    {
      id: "disc-2",
      courseId: "csc-112",
      authorName: "Bola Mogaji",
      authorRole: "student",
      initials: "BM",
      type: "Question",
      body:
        "Is it normal for binary addition to feel confusing at first? I got 3 wrong in the tutorial.",
      timeLabel: "50m",
      likes: 2,
      liked: false,
      replies: [],
    },
    {
      id: "disc-3",
      courseId: "csc-112",
      authorName: "Dr. Folake Adesanya",
      authorRole: "lecturer",
      initials: "FA",
      type: "Announcement",
      body:
        "Please review the new lecture notes before our next class. We will discuss complexity analysis and common mistakes.",
      timeLabel: "18m",
      likes: 4,
      liked: false,
      replies: [],
    },
  ],

  courseBoards: [
    {
      id: "board-1",
      code: "CSC 312",
      newPosts: "4 new",
      color: "purple",
    },
    {
      id: "board-2",
      code: "CSC 321",
      newPosts: "4 new",
      color: "blue",
    },
    {
      id: "board-3",
      code: "CSC 322",
      newPosts: "no new",
      color: "yellow",
    },
  ],

  timetable: [
    {
      id: "tt-1",
      day: "Monday",
      date: "07/04",
      time: "10:00 AM",
      courseCode: "CSC 322",
      title: "Database Management",
      venue: "Lecture · Hall 3 · 300L",
      color: "red",
    },
    {
      id: "tt-2",
      day: "Monday",
      date: "07/04",
      time: "2:00 PM",
      courseCode: "CSC 112",
      title: "Intro to Computer Science",
      venue: "Lecture · Main Auditorium · 300L",
      color: "purple",
    },
    {
      id: "tt-3",
      day: "Tuesday",
      date: "08/04",
      time: "2:00 PM",
      courseCode: "CSC 112",
      title: "Intro to Computer Science",
      venue: "Lecture · Main Auditorium · 300L",
      color: "green",
    },
    {
      id: "tt-4",
      day: "Friday",
      date: "11/04",
      time: "10:00 AM",
      courseCode: "CSC 322",
      title: "Database Management",
      venue: "Lecture · Hall 3 · 300L",
      color: "blue",
    },
  ],

  calendarEvents: [
    {
      id: "cal-1",
      title: "CSC 322",
      fullTitle: "Lecture",
      courseCode: "CSC 322",
      courseTitle: "Database Management Systems",
      lecturer: "Dr. Folake Adesanya",
      date: "2026-05-01",
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      location: "Online",
      note: "Attendance is Compulsory!",
      color: "blue",
      type: "lecture",
    },
    {
      id: "cal-2",
      title: "CSC 312 CA",
      fullTitle: "Mid-Semester CA",
      courseCode: "CSC 312",
      courseTitle: "Software Engineering",
      lecturer: "Dr. Malik Adewale",
      date: "2026-05-01",
      startTime: "11:00 AM",
      endTime: "12:00 PM",
      location: "Online",
      note: "Attempt all questions before submission.",
      color: "purple",
      type: "test",
    },
  ],

  academicBands: [
    {
      id: "band-1",
      title: "May 1 - 5 Mid-Semester Tests (CA)",
      start: "2026-05-01",
      end: "2026-05-05",
      color: "yellow",
    },
    {
      id: "band-2",
      title: "May 14 - 18 SUG Week / Revision",
      start: "2026-05-14",
      end: "2026-05-18",
      color: "purple",
    },
    {
      id: "band-3",
      title: "May 29 Public Holiday",
      start: "2026-05-29",
      end: "2026-05-29",
      color: "green",
    },
  ],

  tests: [
    {
      id: "test-1",
      courseCode: "CSC 322",
      title: "Mid-Semester Test",
      date: "28 MAY",
      time: "10:00 AM",
      mode: "Online (LMS)",
    },
    {
      id: "test-2",
      courseCode: "CSC 112",
      title: "Quiz 2",
      date: "3 JUN",
      time: "12:00 PM",
      mode: "Online (LMS)",
    },
  ],

  deadlines: [
    {
      id: "deadline-1",
      day: "28",
      month: "MAY",
      courseCode: "CSC 322",
      title: "Mid-Semester Test",
      meta: "10:00 AM · Online (LMS)",
      active: true,
    },
    {
      id: "deadline-2",
      day: "2",
      month: "JUN",
      courseCode: "CSC 312",
      title: "Assignment",
      meta: "9:00 AM",
      active: false,
    },
    {
      id: "deadline-3",
      day: "2",
      month: "JUN",
      courseCode: "CSC 324",
      title: "Lecture",
      meta: "2:00 PM · LT 5, CST Block",
      active: false,
    },
  ],

  notifications: [
    {
      id: "not-1",
      type: "assignment",
      category: "Assignments & Tests",
      courseCode: "CSC 322",
      courseTitle: "Database Management Systems",
      title:
        "Dr. Folake Adesanya posted a new assignment: SQL Schema Design — Group Project.",
      shortTitle:
        "Dr. Folake Adesanya posted a new assignment: SQL Schema Design in CSC 322.",
      meta: "2 hours ago · Due: 30 Mar 2026 ago",
      popupMeta: "2 hrs ago · CSC 322",
      actionLabel: "View Assignment",
      unread: true,
      accent: "red",
    },
    {
      id: "not-2",
      type: "grade",
      category: "Grades",
      courseCode: "CSC 322",
      courseTitle: "Database Management Systems",
      title: "Grades for Assignment #4 have been published.",
      shortTitle: "Grades for Lab Report #4 have been published in CSC 312.",
      meta: "5 hours ago · Score: 16/20",
      popupMeta: "5 hrs ago · CSC 322",
      actionLabel: "View Feedback",
      unread: true,
      accent: "red",
    },
    {
      id: "not-3",
      type: "discussion",
      category: "Announcement",
      courseCode: "CSC 322",
      courseTitle: "Database Management Systems",
      title:
        'Dr. Folake Adesanya replied to your post in the discussion board: "Difference between BCNF and 3NF".',
      shortTitle:
        "System Alert: LMS Maintenance scheduled for Saturday at 2:00 AM WAT. Expect 30 mins downtime.",
      meta: "2 days ago",
      popupMeta: "Yesterday",
      actionLabel: "Read Reply",
      unread: false,
      accent: "none",
    },
  ],
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

function makeInviteCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const prefix = Array.from(
    { length: 3 },
    () => letters[Math.floor(Math.random() * letters.length)]
  ).join("");

  const suffix = Math.floor(100 + Math.random() * 900);

  return `${prefix}-${suffix}`;
}

function getFileTypeFromMaterial(item) {
  if (item.type) return item.type;

  const ext = String(item.fileName || item.title || "")
    .split(".")
    .pop()
    ?.toLowerCase();

  if (ext === "pdf") return "pdf";
  if (["ppt", "pptx"].includes(ext)) return "pptx";
  if (["doc", "docx"].includes(ext)) return "docx";
  if (ext === "mp4") return "mp4";
  if (ext === "zip") return "zip";

  return "file";
}

function loadJsonFromLocalStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeLecturerMaterial(item) {
  return {
    id: item.id,
    courseId: item.courseId,
    title: item.title,
    category: item.category,
    type: getFileTypeFromMaterial(item),
    week: Number(item.week) || 1,
    date: item.date || "Today",
    size: item.size || "0 KB",
    allowDownload: Boolean(item.allowDownload),
    fileUrl: item.fileUrl || "",
    fileName: item.fileName || item.title,
    duration: item.duration || "00:00",
    lecturer: "Dr Folake Adesanya",
    fullTitle: item.title,
    description: item.description || "",
  };
}

function mapLecturerAssignmentToStudent(item) {
  return {
    id: item.id,
    courseId: item.courseId,
    courseCode: item.courseCode || item.courseId?.toUpperCase() || "COURSE",
    title: item.title,
    due: item.dueDate || "Not set",
    maxScore: Number(item.totalMarks) || 20,
    score: "",
    status: "Due today",
    type: item.type === "grouped" ? "group" : "individual",
    groupMode: item.groupMethod || "manual",
    studentGroupStatus: "none",
    groupId: "",
    inviteCode: "",
    isLeader: false,
    instructions: item.description || "No assignment instruction provided.",
    fileTypes: "PDF, DOCX",
    maxSize: "10 MB",
    comments: "",
    submittedFileName: "",
    feedback: "",
  };
}

function loadState() {
  const saved = loadJsonFromLocalStorage(STORAGE_KEY, null);
  const base = saved ? { ...clone(defaultState), ...saved } : clone(defaultState);

  const lecturerMaterialsState = loadJsonFromLocalStorage(LECTURER_MATERIALS_KEY, {
    materials: [],
  });

  const lecturerWorkspaceState = loadJsonFromLocalStorage(LECTURER_WORKSPACE_KEY, {
    assignments: [],
    discussions: [],
    gradeBook: [],
  });

  const lecturerUploads = Array.isArray(lecturerMaterialsState.materials)
    ? lecturerMaterialsState.materials.map(normalizeLecturerMaterial)
    : [];

  const lecturerMaterials = lecturerUploads.filter(
    (item) => item.category !== "Video Lectures" && item.type !== "mp4"
  );

  const lecturerVideos = lecturerUploads.filter(
    (item) => item.category === "Video Lectures" || item.type === "mp4"
  );

  const lecturerAssignments = Array.isArray(lecturerWorkspaceState.assignments)
    ? lecturerWorkspaceState.assignments.map(mapLecturerAssignmentToStudent)
    : [];

  const lecturerDiscussions = Array.isArray(lecturerWorkspaceState.discussions)
    ? lecturerWorkspaceState.discussions
    : [];

  const savedMaterialIds = new Set((base.courseMaterials || []).map((item) => item.id));
  const savedVideoIds = new Set((base.courseVideos || []).map((item) => item.id));
  const savedAssignmentIds = new Set((base.assignments || []).map((item) => item.id));
  const savedDiscussionIds = new Set((base.discussions || []).map((item) => item.id));

  return {
    ...base,
    currentStudent: {
      ...clone(defaultState.currentStudent),
      ...(base.currentStudent || {}),
    },
    courses: Array.isArray(base.courses)
      ? base.courses.filter((c) => {
          const id = String(c?.id || c?._id || "");
          if (
            !id ||
            id.startsWith("csc-") ||
            id.startsWith("mth-") ||
            id.startsWith("nrs-") ||
            id.startsWith("eee-") ||
            id.startsWith("mee-") ||
            id.startsWith("phy-") ||
            id.startsWith("acc-") ||
            id.startsWith("ecn-") ||
            id.startsWith("bus-") ||
            id.startsWith("pol-") ||
            id.startsWith("pbh-") ||
            id.startsWith("eng-") ||
            id.startsWith("ict-")
          ) {
            return false;
          }
          return true;
        })
      : [],
    courseMaterials: [
      ...(Array.isArray(base.courseMaterials)
        ? base.courseMaterials
        : clone(defaultState.courseMaterials)),
      ...lecturerMaterials.filter((item) => !savedMaterialIds.has(item.id)),
    ],
    courseVideos: [
      ...(Array.isArray(base.courseVideos)
        ? base.courseVideos
        : clone(defaultState.courseVideos)),
      ...lecturerVideos.filter((item) => !savedVideoIds.has(item.id)),
    ],
    assignments: [
      ...(Array.isArray(base.assignments)
        ? base.assignments.filter((item) => item.courseId !== "csc-112")
        : []),
      ...lecturerAssignments.filter(
        (item) => !savedAssignmentIds.has(item.id) && item.courseId !== "csc-112"
      ),
    ],
    groups: Array.isArray(base.groups) ? base.groups : clone(defaultState.groups),
    previousSubmissions: Array.isArray(base.previousSubmissions)
      ? base.previousSubmissions
      : clone(defaultState.previousSubmissions),
    grades: Array.isArray(base.grades) ? base.grades : clone(defaultState.grades),
    discussions: [
      ...(Array.isArray(base.discussions)
        ? base.discussions
        : clone(defaultState.discussions)),
      ...lecturerDiscussions.filter((item) => !savedDiscussionIds.has(item.id)),
    ],
    courseBoards: Array.isArray(base.courseBoards)
      ? base.courseBoards
      : clone(defaultState.courseBoards),
    timetable: Array.isArray(base.timetable)
      ? base.timetable
      : clone(defaultState.timetable),
    calendarEvents: Array.isArray(base.calendarEvents)
      ? base.calendarEvents
      : clone(defaultState.calendarEvents),
    academicBands: Array.isArray(base.academicBands)
      ? base.academicBands
      : clone(defaultState.academicBands),
    tests: Array.isArray(base.tests) ? base.tests : clone(defaultState.tests),
    deadlines: Array.isArray(base.deadlines)
      ? base.deadlines
      : clone(defaultState.deadlines),
    notifications: Array.isArray(base.notifications)
      ? base.notifications
      : clone(defaultState.notifications),
  };
}

export const useStudentStore = defineStore("student", {
  state: () => loadState(),

  getters: {
    enrolledCoursesCount(state) {
      return state.courses.length;
    },

    pendingAssignmentsCount(state) {
      return state.assignments.filter((item) => item.status !== "Graded").length;
    },

    upcomingTestsCount(state) {
      return state.tests.length;
    },

    unreadNotificationsCount(state) {
      return state.notifications.filter((item) => item.unread).length;
    },

    popupNotifications(state) {
      return state.notifications.slice(0, 4);
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
        id: user.id || user._id || this.currentStudent?.id || "stu-001",
        name: fullName || this.currentStudent?.name || "Student",
        firstName: firstName || this.currentStudent?.firstName || "Student",
        initials: initials || this.currentStudent?.initials || "ST",
        matricNo: user.identifier || user.matricNo || this.currentStudent?.matricNo || "",
        department: user.department || "Nursing",
        email: user.email || this.currentStudent?.email || "",
        phone: user.phone || this.currentStudent?.phone || "",
      };
      this.persist();
    },

    async fetchStudentDataFromDB(studentId, enrolledCourseIds = []) {
      try {
        const [coursesRes, eventsRes] = await Promise.all([
          getCourses(),
          getEvents()
        ]);
        const allCourses = coursesRes.data?.courses || [];

        // Effective enrolled course IDs: combine parameter and authStore user enrolled courses
        const authStore = useAuthStore();
        if (authStore.user) {
          this.syncCurrentStudent(authStore.user);
        }
        const authEnrolled = authStore.user?.enrolledCourses || [];
        const effectiveEnrolledIds = new Set([
          ...(Array.isArray(enrolledCourseIds) ? enrolledCourseIds.map(String) : []),
          ...(Array.isArray(authEnrolled) ? authEnrolled.map(String) : [])
        ]);

        // Filter courses that are enrolled by this student from the backend database
        const myDbCourses = allCourses.filter(c => effectiveEnrolledIds.has(String(c._id)));

        // Map backend courses
        const mappedDbCourses = myDbCourses.map(c => {
          return {
            id: c._id,
            _id: c._id,
            code: c.courseCode,
            title: c.title,
            units: c.units || 3,
            lecturer: c.lecturer || "Not Assigned",
            department: c.department || "General",
            theme: "purple",
            materialsCount: (c.materials || []).length || 3,
            videosCount: 2,
            assignmentsCount: 1,
            discussionsCount: 2,
          };
        });

        // Only keep real courses: courses from DB that the student is enrolled in, plus any real newly enrolled courses from allCourses
        const allDbCourseIds = new Set(allCourses.map(c => String(c._id)));
        const preservedLocalCourses = (this.courses || []).filter(c => {
          const id = String(c.id || c._id || "");
          const isRealCreatedCourse = allDbCourseIds.has(id);
          const alreadyInMapped = mappedDbCourses.some(m => String(m.id || m._id) === id);
          return isRealCreatedCourse && !alreadyInMapped;
        });

        this.courses = [...mappedDbCourses, ...preservedLocalCourses];
        this.persist();

        // Fetch assignments for all enrolled courses so student has them on initial load
        try {
          await Promise.all(
            this.courses.map((c) => this.fetchAssignments(c.id || c._id))
          );
        } catch (e) {
          console.warn("Error pre-fetching assignments for enrolled courses:", e);
        }

        // Gather all materials and videos from enrolled courses
        const materialsList = [];
        const videosList = [];

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

        myDbCourses.forEach(c => {
          const rawMaterials = c.materials || [];
          rawMaterials.forEach(m => {
            const mapped = {
              id: m._id || m.s3Key,
              courseId: c._id,
              title: m.title,
              description: m.description || "",
              category: m.category || "Lecture Notes (PDF)",
              type: getFileTypeFromName(m.fileName || m.title, m.category),
              week: m.week || 10,
              date: m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString() : "Today",
              size: m.size || "1.2 MB",
              allowDownload: m.allowDownload !== false,
              fileName: m.fileName || "document.pdf",
              mimeType: m.mimeType || "",
              duration: m.duration || "00:00",
              s3Key: m.s3Key
            };

            if (mapped.category === "Video Lectures" || mapped.type === "mp4") {
              videosList.push(mapped);
            } else {
              materialsList.push(mapped);
            }
          });
        });

        if (materialsList.length > 0) {
          const matIds = new Set(materialsList.map(m => m.id));
          const existingMaterials = (this.courseMaterials || []).filter(m => !matIds.has(m.id));
          this.courseMaterials = [...materialsList, ...existingMaterials];
        }
        if (videosList.length > 0) {
          const vidIds = new Set(videosList.map(v => v.id));
          const existingVideos = (this.courseVideos || []).filter(v => !vidIds.has(v.id));
          this.courseVideos = [...videosList, ...existingVideos];
        }

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

        const getColorFromType = (type) => {
          if (type === "test") return "green";
          if (type === "assignment") return "purple";
          return "blue";
        };

        const getTypeFromTitle = (title) => {
          const lowered = String(title || "").toLowerCase();
          if (lowered.includes("test")) return "test";
          if (lowered.includes("assignment") || lowered.includes("due")) return "assignment";
          return "lecture";
        };

        // Fetch and map calendar events
        const rawEvents = eventsRes.data.events || [];
        const courseTestResponses = await Promise.all(
          myDbCourses.map((course) =>
            getCourseTests(course._id).catch((err) => {
              console.warn(`Failed to fetch tests for course ${course._id}:`, err);
              return { data: { tests: [] } };
            })
          )
        );
        const scheduledTests = courseTestResponses.flatMap((response, index) =>
          (response.data?.tests || []).map((test) => ({
            ...test,
            course: myDbCourses[index]._id,
          }))
        );
        const calendarEvents = rawEvents.map(e => {
          const courseCode = e.course?.courseCode || "";
          const courseTitle = e.course?.title || "";
          const lecturerName = e.lecturer?.name || "Lecturer";
          const type = getTypeFromTitle(e.title);
          
          return {
            id: e._id,
            title: courseCode,
            fullTitle: e.title,
            courseCode,
            courseTitle,
            lecturer: lecturerName,
            date: String(e.date || "").split("T")[0],
            startTime: formatTime12h(e.startTime),
            endTime: formatTime12h(e.endTime),
            frequency: e.frequency || "once",
            recurrenceEndDate: String(e.recurrenceEndDate || "").split("T")[0],
            location: e.locationDetails || "Online",
            note: e.instruction || "Attendance is compulsory.",
            color: getColorFromType(type),
            type
          };
        });

        this.calendarEvents = [
          ...calendarEvents,
          ...scheduledTests.map((test) => {
            const course = myDbCourses.find(
              (item) => String(item._id) === String(test.course)
            );
            return {
              id: `test-${test._id}`,
              title: course?.courseCode || "",
              fullTitle: test.testTitle,
              courseCode: course?.courseCode || "",
              courseTitle: course?.title || "",
              lecturer: "Lecturer",
              date: String(test.date || "").split("T")[0],
              startTime: formatTime12h(test.startTime),
              endTime: formatTime12h(test.endTime),
              location: "Online (LMS)",
              note: test.instructions || "Scheduled online test.",
              color: "green",
              type: "test",
              frequency: "once",
            };
          }),
        ];

        this.persist();
      } catch (err) {
        console.error("Failed to fetch student data from DB:", err);
      }
    },

    refreshFromLecturerStores() {
      const fresh = loadState();

      this.courseMaterials = fresh.courseMaterials;
      this.courseVideos = fresh.courseVideos;
      this.assignments = fresh.assignments;
      this.discussions = fresh.discussions;
      this.persist();
    },

    markNotificationRead(notificationId) {
      const notification = this.notifications.find((item) => item.id === notificationId);

      if (notification) {
        notification.unread = false;
        this.persist();
      }
    },

    markAllNotificationsRead() {
      this.notifications = this.notifications.map((item) => ({
        ...item,
        unread: false,
      }));

      this.persist();
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
        console.warn("createDiscussionPost API failed, falling back to local fallback:", err);
        const authStore = useAuthStore();
        const initials = authStore.userInitials || this.currentStudent.initials;
        const localPost = {
          id: `disc-local-${Date.now()}`,
          courseId: payload.courseId,
          type: payload.type || "General",
          body,
          title,
          authorName: authStore.userName || this.currentStudent.name,
          authorRole: authStore.userRole || "student",
          initials,
          timeLabel: "Now",
          likes: 0,
          liked: false,
          replies: []
        };
        this.discussions.unshift(localPost);
        this.persist();
        return { success: true, post: localPost };
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
        console.warn("addDiscussionReply API failed, falling back to local fallback:", err);
        const post = this.discussions.find(item => item.id === postId);
        if (post) {
          const authStore = useAuthStore();
          const initials = authStore.userInitials || this.currentStudent.initials;
          if (!post.replies) post.replies = [];
          post.replies.push({
            id: `reply-local-${Date.now()}`,
            authorName: authStore.userName || this.currentStudent.name,
            authorRole: authStore.userRole || "student",
            initials,
            body: cleaned,
            timeLabel: "Now"
          });
          this.persist();
          return { success: true };
        }
        return { success: false, message: "Failed to add local reply." };
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

      // Sync from lecturerWorkspace in localStorage if available
      try {
        const lecturerWs = loadJsonFromLocalStorage(LECTURER_WORKSPACE_KEY, { assignments: [] });
        if (Array.isArray(lecturerWs.assignments) && lecturerWs.assignments.length > 0) {
          const clean = (s) => String(s || "").toUpperCase().replace(/[\s\-_]+/g, "");
          const matchingLecturerAssignments = lecturerWs.assignments.filter((item) => {
            const itemCId = String(item.courseId || "");
            const itemCCode = item.courseCode || "";
            return (
              itemCId === String(courseId) ||
              clean(itemCId) === clean(courseId) ||
              (itemCCode && clean(itemCCode) === clean(courseId)) ||
              (courseObj &&
                (itemCId === String(courseObj.id) ||
                  itemCId === String(courseObj._id) ||
                  clean(itemCId) === clean(courseObj.code) ||
                  clean(itemCCode) === clean(courseObj.code)))
            );
          });

          const currentIds = new Set((this.assignments || []).map((a) => String(a.id)));
          const toAdd = matchingLecturerAssignments
            .filter((item) => !currentIds.has(String(item.id)))
            .map((item) => ({
              ...mapLecturerAssignmentToStudent(item),
              courseId: courseId,
              courseCode: courseObj?.code || item.courseCode || "",
            }));

          if (toAdd.length > 0) {
            this.assignments.unshift(...toAdd);
            this.persist();
          }
        }
      } catch (e) {
        console.warn("Error syncing local lecturer assignments:", e);
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
      } catch (err) {
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