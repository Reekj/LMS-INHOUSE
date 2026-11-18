import { defineStore } from "pinia";
import { getCourseTests, getStudentQuestions, submitTest, getTestResults } from "../api/test.api";
import { getMyCourses } from "../api/course.api";
import { useAuthStore } from "./auth.store";

// v2: v1 held demo tests and results. Only in-progress answers are cached,
// and only for the account that wrote them; everything else comes from the server.
const STORAGE_KEY = "uniosun_lms_student_tests_v2";
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

function currentUserId() {
  try {
    const auth = useAuthStore();
    return String(auth.user?.id || auth.user?._id || "");
  } catch {
    return "";
  }
}

function emptyState() {
  return {
    ownerId: "",
    activeTests: [],
    upcomingTests: [],
    pastResults: [],
    answers: {},
    results: {},
    questions: [],
    currentTest: null,
  };
}

function loadState() {
  const state = { ...emptyState(), ownerId: currentUserId() };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && state.ownerId && saved.ownerId === state.ownerId) {
      state.answers = saved.answers || {};
    }
  } catch {
    // Ignore a corrupt cache.
  }
  return state;
}

// Nigerian university grading scale.
export function gradeFor(percentage) {
  if (percentage >= 70) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 45) return "D";
  if (percentage >= 40) return "E";
  return "F";
}

function percentOf(score, total) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// Options arrive as an array of strings; letter them A, B, C... and drop blanks.
function toOptions(options) {
  const list = Array.isArray(options)
    ? options
    : OPTION_LETTERS.map((letter) => options?.[letter]);
  return list
    .map((text, index) => ({ id: OPTION_LETTERS[index], text: String(text ?? "").trim() }))
    .filter((option) => option.id && option.text);
}

function testTypeLabel(type) {
  if (type === "theory") return "Theory";
  if (type === "mixed") return "Mixed";
  return "Multiple Choice Questions";
}

function toTestCard(test) {
  return {
    id: test._id,
    title: test.testTitle,
    courseCode: test.courseCode,
    courseTitle: test.courseTitle,
    date: `${formatDate(test.date)}, ${test.startTime}`,
    duration: test.duration || 0,
    totalMarks: test.numberOfQuestions * test.marksPerQuestion,
    totalQuestions: test.numberOfQuestions,
    testType: testTypeLabel(test.testType),
  };
}

export const useStudentTestsStore = defineStore("studentTests", {
  state: () => loadState(),

  getters: {
    getActiveTestById: (state) => (testId) => {
      if (state.currentTest?.id === testId) return state.currentTest;
      return state.activeTests.find((test) => test.id === testId) || null;
    },

    getResultByTestId: (state) => (testId) => state.results[testId] || null,

    getAnswersByTest: (state) => (testId) => state.answers[testId] || {},

    answeredCount: (state) => (testId) => Object.keys(state.answers[testId] || {}).length,
  },

  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ownerId: this.ownerId, answers: this.answers }));
    },

    // Start clean if a different account is now signed in.
    ensureOwner() {
      const ownerId = currentUserId();
      if (this.ownerId !== ownerId) {
        Object.assign(this, emptyState(), { ownerId });
      }
    },

    answerQuestion(testId, questionId, optionId) {
      if (!this.answers[testId]) {
        this.answers[testId] = {};
      }
      this.answers[testId][questionId] = optionId;
      this.persist();
    },

    // Loads the tests of the student's enrolled courses, sorted into
    // active (open now, not yet taken), upcoming, and past (taken or missed).
    async fetchCourseTestsAction() {
      this.ensureOwner();
      const coursesRes = await getMyCourses();
      const courses = coursesRes.data?.courses || [];

      const responses = await Promise.all(
        courses.map((course) =>
          getCourseTests(course._id).catch((err) => {
            console.warn(`Failed to fetch tests for ${course.courseCode}:`, err);
            return { data: { tests: [] } };
          })
        )
      );
      const allTests = responses.flatMap((res) => res.data?.tests || []);

      this.activeTests = allTests
        .filter((test) => test.status === "active" && !test.submission)
        .map((test) => ({ ...toTestCard(test), status: "Available Now" }));

      this.upcomingTests = allTests
        .filter((test) => test.status === "upcoming")
        .map((test) => ({ ...toTestCard(test), status: "Scheduled" }));

      this.pastResults = allTests
        .filter((test) => test.submission || test.status === "closed")
        .map((test) => {
          const card = toTestCard(test);
          const submission = test.submission;
          const total = submission?.totalPossibleScore ?? card.totalMarks;
          const score = submission ? submission.score : 0;
          const percentage = percentOf(score, total);
          return {
            ...card,
            testId: test._id,
            submitted: Boolean(submission),
            submittedDate: submission ? formatDate(submission.submittedAt) : `Closed ${formatDate(test.date)}`,
            score,
            totalMarks: total,
            percentage,
            grade: gradeFor(percentage),
            status: submission ? "Auto Graded" : "Missed",
            sortKey: submission?.submittedAt || test.scheduledEnd || test.date,
          };
        })
        .sort((a, b) => new Date(b.sortKey) - new Date(a.sortKey));
    },

    // Loads a test's questions for taking it. Returns an error message on failure.
    async fetchTestQuestionsAction(testId) {
      this.ensureOwner();
      this.questions = [];
      this.currentTest = null;
      try {
        const res = await getStudentQuestions(testId);
        const test = res.data.test;
        this.currentTest = {
          id: test._id,
          title: test.testTitle,
          courseCode: test.courseCode,
          courseTitle: test.courseTitle,
          duration: test.duration || 0,
          totalQuestions: test.numberOfQuestions,
          scheduledEnd: test.scheduledEnd,
          testType: testTypeLabel(test.testType),
        };
        this.questions = res.data.questions.map((q, idx) => ({
          id: q._id,
          number: idx + 1,
          question: q.questionText,
          options: toOptions(q.options),
        }));
        return { error: "" };
      } catch (err) {
        return { error: err.response?.data?.error || "Could not load this test. Please try again." };
      }
    },

    async submitTestAnswersAction(testId) {
      try {
        const answersObj = this.answers[testId] || {};
        const answersArray = Object.keys(answersObj).map((questionId) => ({
          questionId,
          selectedAnswer: answersObj[questionId],
        }));

        await submitTest(testId, { answers: answersArray });

        delete this.answers[testId];
        this.activeTests = this.activeTests.filter((item) => item.id !== testId);
        this.persist();
        return { success: true };
      } catch (err) {
        return { success: false, message: err.response?.data?.error || "Submission failed. Please try again." };
      }
    },

    // Loads the graded script: score plus every question with the student's
    // answer and the correct one. Returns an error message on failure.
    async fetchTestResultsAction(testId) {
      this.ensureOwner();
      try {
        const res = await getTestResults(testId);
        const d = res.data;
        const percentage = percentOf(d.score, d.totalPossibleScore);
        this.results[testId] = {
          testId,
          title: d.testTitle,
          courseCode: d.courseCode,
          courseTitle: d.courseTitle,
          submittedDate: d.submittedAt ? formatDate(d.submittedAt) : "Not submitted",
          duration: d.duration || 0,
          score: d.score,
          totalMarks: d.totalPossibleScore,
          percentage,
          grade: gradeFor(percentage),
          missed: d.missed,
          correctCount: d.correctCount ?? d.review.filter((r) => r.isCorrect).length,
          answeredCount: d.answeredCount ?? d.review.filter((r) => r.selectedAnswer !== null).length,
          testType: testTypeLabel(d.testType),
          review: d.review.map((r) => ({
            id: r.questionId,
            question: r.questionText,
            options: toOptions(r.options),
            correctAnswer: r.correctAnswer,
            selectedAnswer: r.selectedAnswer,
            isCorrect: r.isCorrect,
          })),
        };
        return { error: "" };
      } catch (err) {
        return { error: err.response?.data?.error || "Could not load this result. Please try again." };
      }
    },
  },
});
