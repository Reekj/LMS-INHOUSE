import { defineStore } from "pinia";
import { getCourses } from "../api/course.api";
import { getAllUsers } from "../api/user.api";

const STORAGE_KEY = "uniosun_lms_lecturer_courses_v1";
const CURRENT_LECTURER_ID = "lec-001";

const defaultState = {
  currentLecturerId: CURRENT_LECTURER_ID,

  lecturers: [
    {
      id: "lec-001",
      name: "Dr. Folake Adesanya",
      email: "folake@uniosun.edu.ng",
      department: "Computer Science",
      initials: "AO",
    },
    {
      id: "lec-002",
      name: "Prof. Taiwo Akinwale",
      email: "taiwo@uniosun.edu.ng",
      department: "Computer Science",
      initials: "TA",
    },
  ],

  availableCourses: [],

  assignments: [],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.availableCourses)) {
        parsed.availableCourses = parsed.availableCourses.filter(
          (c) => !["csc-112", "csc-321", "csc-322"].includes(c.id)
        );
      }
      return parsed;
    }
    return clone(defaultState);
  } catch {
    return clone(defaultState);
  }
}

function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

export const useLecturerCoursesStore = defineStore("lecturerCourses", {
  state: () => loadState(),

  getters: {
    currentLecturer(state) {
      return state.lecturers.find(
        (lecturer) => lecturer.id === state.currentLecturerId
      );
    },

    lecturerCourses(state) {
      const assignedIds = state.assignments
        .filter((item) => item.lecturerId === state.currentLecturerId)
        .map((item) => item.courseId);

      return state.availableCourses.filter((course) =>
        assignedIds.includes(course.id) || assignedIds.includes(course._id)
      );
    },
  },

  actions: {
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentLecturerId: this.currentLecturerId,
          lecturers: this.lecturers,
          availableCourses: this.availableCourses,
          assignments: this.assignments,
        })
      );
    },

    getCourseById(courseId) {
      if (!courseId) return null;
      const strId = String(courseId);
      const clean = (s) => String(s || "").toUpperCase().replace(/[\s\-_]+/g, "");
      const norm = clean(strId);
      return this.availableCourses.find(
        (course) =>
          String(course.id) === strId ||
          String(course._id) === strId ||
          (course.code && clean(course.code) === norm) ||
          (course.courseCode && clean(course.courseCode) === norm)
      );
    },

    getUnassignedCourses() {
      const assignedIds = this.lecturerCourses.map((course) => course.id);

      return this.availableCourses.filter(
        (course) => !assignedIds.includes(course.id)
      );
    },

    assignCourse(courseId) {
      const safeCourseId = sanitizeText(courseId);

      if (!safeCourseId) {
        return { success: false, message: "Select a course." };
      }

      const exists = this.availableCourses.some(
        (course) => course.id === safeCourseId
      );

      if (!exists) {
        return { success: false, message: "Invalid course selected." };
      }

      const alreadyAssigned = this.assignments.some(
        (item) =>
          item.lecturerId === this.currentLecturerId &&
          item.courseId === safeCourseId
      );

      if (alreadyAssigned) {
        return { success: false, message: "Course already registered." };
      }

      this.assignments.push({
        lecturerId: this.currentLecturerId,
        courseId: safeCourseId,
      });

      this.persist();

      return { success: true };
    },

    removeCourse(courseId) {
      this.assignments = this.assignments.filter(
        (item) =>
          !(
            item.lecturerId === this.currentLecturerId &&
            item.courseId === courseId
          )
      );

      this.persist();
    },

    async fetchCoursesFromDB(lecturerName) {
      if (!lecturerName) return;
      try {
        const [coursesRes, usersRes] = await Promise.all([
          getCourses(),
          getAllUsers()
        ]);
        const courses = coursesRes.data.courses || [];
        const users = usersRes.data.users || [];

        const myCourses = courses.filter(c => c.lecturer && lecturerName && c.lecturer.toLowerCase().trim() === lecturerName.toLowerCase().trim());

        const mapped = myCourses.map(c => {
          const sCount = users.filter(u => 
            u.role === "student" && 
            Array.isArray(u.enrolledCourses) && 
            u.enrolledCourses.includes(c._id)
          ).length;

          return {
            id: c._id,
            _id: c._id,
            code: c.courseCode,
            courseCode: c.courseCode,
            title: c.title,
            units: c.units || 3,
            students: sCount,
            theme: "purple",
            materials: c.materials || []
          };
        });

        this.availableCourses = mapped;
        this.assignments = mapped.map(m => ({ lecturerId: this.currentLecturerId, courseId: m.id }));
        this.persist();
      } catch (err) {
        console.error("Failed to sync lecturer courses store:", err);
      }
    }
  },
});