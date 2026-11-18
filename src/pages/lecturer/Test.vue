<template>
  <section class="test-page">
    <div class="page-heading">
      <div>
        <div class="heading-badge-wrap">
          <h1>{{ activeTestId ? 'Manage Online Test' : 'Create Online Test' }}</h1>
          <span v-if="activeTestId" class="badge-status badge-active">
            ● Connected to Database
          </span>
          <span v-else class="badge-status badge-draft">
            📝 Local Draft Mode (Auto-saved)
          </span>
        </div>
        <p>Set timed questions for your class · {{ selectedCourseCode }}</p>
      </div>

      <div class="test-mode-selector" v-if="courseTests.length > 0">
        <label class="form-label select-test-label">
          <span>Active / Scheduled Test</span>
          <select v-model="selectedTestOption" @change="onSelectTestChange" class="form-select select-test-control">
            <option value="new">+ Schedule a New Test (Draft)</option>
            <option v-for="t in courseTests" :key="t._id" :value="t._id">
              {{ t.testTitle }} ({{ t.status }})
            </option>
          </select>
        </label>
      </div>
    </div>

    <div class="test-layout">
      <main>
        <section class="settings-card">
          <h2>Test Settings</h2>

          <div class="form-two">
            <label class="form-label">
              Course
              <select v-model="testForm.courseId" class="form-select" :disabled="isLoadingCourses">
                <option v-for="course in courses" :key="course.id" :value="course.id">
                  {{ course.code }} - {{ course.title }}
                </option>
              </select>
            </label>

            <label class="form-label">
              Test Type
              <select v-model="testForm.testType" class="form-select">
                <option>Multiple Choice questions</option>
                <option>Theory questions</option>
                <option>Mixed questions</option>
              </select>
            </label>
          </div>

          <label class="form-label">
            Test Title
            <input v-model.trim="testForm.title" class="form-input" />
          </label>

          <div class="form-three">
            <label class="form-label">
              Due Date
              <input v-model="testForm.dueDate" class="form-input" type="date" />
            </label>

            <label class="form-label">
              Due Time
              <input v-model="testForm.dueTime" class="form-input" type="time" />
            </label>

            <label class="form-label">
              Duration (mins)
              <input
                v-model.number="testForm.duration"
                class="form-input"
                type="number"
                min="1"
              />
            </label>
          </div>

          <div class="form-two">
            <label class="form-label">
              Total Questions
              <input
                v-model.number="testForm.totalQuestions"
                class="form-input"
                type="number"
                min="1"
              />
            </label>

            <label class="form-label">
              Marks per Question
              <input
                v-model.number="testForm.marksPerQuestion"
                class="form-input"
                type="number"
                min="1"
              />
            </label>
          </div>

          <label class="form-label">
            Instructions
            <textarea
              v-model.trim="testForm.instructions"
              class="form-textarea"
              placeholder="e.g. This is a closed-book test. No collaboration allowed..."
            ></textarea>
          </label>
        </section>

        <section class="questions-card">
          <div class="questions-header">
            <div>
              <h2>Questions ({{ questions.length }} added)</h2>
              <span v-if="!activeTestId && questions.length > 0" class="draft-indicator-text">
                ✓ Auto-saved locally
              </span>
            </div>

            <div class="header-action-buttons">
              <button
                v-if="!activeTestId && questions.length > 0"
                type="button"
                class="discard-btn"
                @click="discardDraft"
                title="Discard unsaved local draft"
              >
                Clear Draft
              </button>
              <button type="button" class="import-btn" @click="openImportModal">
                ⇩ Import Questions
              </button>
              <button type="button" class="add-btn" @click="openAddModal">
                + Add Question
              </button>
            </div>
          </div>

          <article
            v-for="(question, index) in questions"
            :key="question.id"
            class="question-row"
          >
            <span class="question-number">{{ index + 1 }}</span>

            <div class="question-content">
              <strong>{{ question.text }}</strong>
              <small>{{ question.type }} · {{ question.mark }} marks</small>
            </div>

            <button type="button" class="edit-btn" @click="openEditModal(question)">
              Edit
            </button>

            <button type="button" class="delete-btn" @click="deleteQuestion(question.id)">
              ×
            </button>
          </article>

          <div v-if="questions.length === 0" class="empty-questions">
            <h3>No questions added yet</h3>
            <p>Add questions manually or import them from CSV.</p>
          </div>

          <div class="questions-footer">
            <button type="button" class="preview-btn" @click="openPreviewModal">
              Preview Test
            </button>
            <button
              type="button"
              class="schedule-btn"
              :disabled="isScheduling"
              @click="scheduleTest"
            >
              {{ isScheduling ? "Saving..." : (activeTestId ? "Update / Reschedule Test" : "Schedule Test") }}
            </button>
          </div>

          <p v-if="statusMessage" :class="['status-message', { 'status-error': isStatusError }]">
            {{ statusMessage }}
          </p>
        </section>
      </main>

      <aside class="summary-card">
        <h2>Test Summary</h2>

        <div class="summary-row">
          <strong>Questions</strong>
          <span>{{ questions.length }}</span>
        </div>

        <div class="summary-row">
          <strong>Total Marks</strong>
          <span>{{ totalMarks }}</span>
        </div>

        <div class="summary-row">
          <strong>Duration</strong>
          <span>{{ testForm.duration }} mins</span>
        </div>

        <div class="summary-row">
          <strong>Date</strong>
          <span>{{ readableDate }}</span>
        </div>
      </aside>
    </div>

    <div v-if="questionModalOpen" class="modal-backdrop">
      <div class="question-modal">
        <div class="question-modal-header">
          <h2>{{ editingQuestionId ? "Edit Question" : "Add Question" }}</h2>
          <span :class="['modal-badge', activeTestId ? 'badge-active' : 'badge-draft']">
            {{ activeTestId ? '● Database Mode' : '📝 Local Draft Mode' }}
          </span>
        </div>

        <p class="modal-subtext">
          {{
            activeTestId
              ? 'This question will be saved directly to the database test in MongoDB.'
              : 'This question will be saved to your local draft and will be preserved even if you refresh the page. Click Schedule Test when ready to publish to students.'
          }}
        </p>

        <form @submit.prevent="saveQuestion">
          <div class="form-two">
            <label class="form-label">
              Question Type
              <select v-model="questionForm.type" class="form-select">
                <option>Multiple Choice Question</option>
                <option>Theory Question</option>
              </select>
            </label>

            <label class="form-label">
              Mark
              <input
                v-model.number="questionForm.mark"
                class="form-input"
                type="number"
                min="1"
              />
            </label>
          </div>

          <label class="form-label">
            Question Text
            <textarea
              v-model.trim="questionForm.text"
              class="form-textarea question-textarea"
              placeholder="Type your question here..."
            ></textarea>
          </label>

          <section
            v-if="questionForm.type === 'Multiple Choice Question'"
            class="options-card"
          >
            <h3>Answer Options & Correct Key</h3>

            <label
              v-for="option in questionForm.options"
              :key="option.key"
              class="option-row"
            >
              <input
                v-model="questionForm.correctOption"
                type="radio"
                :value="option.key"
              />

              <span>{{ option.key }}</span>

              <input
                v-model.trim="option.text"
                class="option-input"
                :placeholder="`Option ${option.key} text...`"
              />
            </label>
          </section>

          <p v-if="questionError" class="form-error">{{ questionError }}</p>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeQuestionModal">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              {{ activeTestId ? "Save Question to Database" : "Save Question to Draft" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="importModalOpen" class="modal-backdrop">
      <div class="import-modal">
        <div class="import-header">
          <div>
            <h2>Upload Questions</h2>
            <p>Select ingestion method to load target evaluations</p>
          </div>

          <button type="button" class="close-import" @click="closeImportModal">
            × Close
          </button>
        </div>

        <div class="import-tab">
          Upload Data Template Document (CSV / Excel)
        </div>

        <button
          type="button"
          class="drop-area"
          :class="{ active: importFileName }"
          @click="csvInput?.click()"
          @dragover.prevent
          @drop.prevent="handleCsvDrop"
        >
          <span class="folder-icon">▱</span>
          <strong>{{ importFileName || "Drag file here or click to browse" }}</strong>
          <small>Supported Formats: standard formatted spreadsheet template files (.csv)</small>
        </button>

        <input
          ref="csvInput"
          type="file"
          hidden
          accept=".csv,text/csv"
          @change="handleCsvSelect"
        />

        <div class="template-warning">
          <span>
            Need the uniform platform structure mapping columns format index configuration schema grid map layout?
          </span>

          <button type="button" @click="downloadTemplate">
            Download Template Sheet
          </button>
        </div>

        <div v-if="importPreview.length" class="import-preview">
          <h3>{{ importPreview.length }} validated records found</h3>

          <ul>
            <li v-for="item in importPreview.slice(0, 4)" :key="item.id">
              {{ item.text }}
            </li>
          </ul>
        </div>

        <p v-if="importError" class="form-error">{{ importError }}</p>

        <div class="import-actions">
          <button type="button" class="cancel-btn" @click="closeImportModal">
            Cancel
          </button>

          <button
            type="button"
            class="append-btn"
            :disabled="importPreview.length === 0"
            @click="appendImportedQuestions"
          >
            Append Validated Records to Test Deck
          </button>
        </div>
      </div>
    </div>

    <div v-if="previewModalOpen" class="modal-backdrop">
      <div class="preview-modal">
        <div class="preview-header">
          <div>
            <h2>{{ testForm.title }}</h2>
            <p>{{ selectedCourseCode }} · {{ questions.length }} questions · {{ totalMarks }} marks</p>
          </div>

          <button type="button" class="modal-close" @click="previewModalOpen = false">
            ×
          </button>
        </div>

        <article
          v-for="(question, index) in questions"
          :key="question.id"
          class="preview-question"
        >
          <strong>{{ index + 1 }}. {{ question.text }}</strong>

          <ul v-if="question.type === 'Multiple Choice Question'">
            <li v-for="option in question.options" :key="option.key">
              {{ option.key }}. {{ option.text }}
              <span v-if="option.key === question.correctOption">Correct</span>
            </li>
          </ul>

          <p v-else>Theory response question</p>
        </article>

        <div v-if="questions.length === 0" class="empty-questions">
          No questions available to preview.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { getCourses } from "../../api/course.api";
import {
  createTest,
  updateTest,
  addQuestion,
  bulkUploadQuestions,
  editQuestion,
  deleteQuestion as deleteQuestionApi,
  getLecturerQuestions,
  getCourseTests
} from "../../api/test.api";
import { useLecturerCoursesStore } from "../../stores/lecturerCourses.store";

const route = useRoute();
const lecturerCoursesStore = useLecturerCoursesStore();

const STORAGE_KEYS = {
  ACTIVE_TEST: "uniosun_lms_lecturer_active_test_id",
  SELECTED_COURSE: "uniosun_lms_lecturer_selected_course_id",
  TEST_DRAFT: "uniosun_lms_lecturer_test_draft",
};

const courses = ref([]);
const courseTests = ref([]);
const activeTestId = ref("");
const selectedTestOption = ref("new");
const isRestoring = ref(false);

const isLoadingCourses = ref(false);
const isLoadingTests = ref(false);
const isLoadingQuestions = ref(false);
const isScheduling = ref(false);
const statusMessage = ref("");
const isStatusError = ref(false);

const csvInput = ref(null);
const questionModalOpen = ref(false);
const importModalOpen = ref(false);
const previewModalOpen = ref(false);
const editingQuestionId = ref("");
const questionError = ref("");
const importError = ref("");
const importFileName = ref("");
const importPreview = ref([]);

const testForm = reactive({
  courseId: "",
  testType: "Multiple Choice questions",
  title: "",
  dueDate: localDateKey(new Date()),
  dueTime: "10:00",
  duration: 60,
  totalQuestions: 20,
  marksPerQuestion: 2,
  instructions: "",
});

const questionForm = reactive({
  type: "Multiple Choice Question",
  mark: 1,
  text: "",
  options: [
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ],
  correctOption: "A",
});

const questions = ref([]);

const selectedCourse = computed(() =>
  courses.value.find((course) => course.id === testForm.courseId)
);

const selectedCourseCode = computed(() => selectedCourse.value?.code || "Course");

const totalMarks = computed(() =>
  questions.value.reduce((total, question) => total + Number(question.mark || 0), 0)
);

const readableDate = computed(() => {
  if (!testForm.dueDate) return "Not set";

  const date = new Date(`${testForm.dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return testForm.dueDate;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
});

function saveDraftToStorage() {
  if (activeTestId.value || isRestoring.value) return;
  try {
    const draft = {
      courseId: testForm.courseId,
      testType: testForm.testType,
      title: testForm.title,
      dueDate: testForm.dueDate,
      dueTime: testForm.dueTime,
      duration: testForm.duration,
      totalQuestions: testForm.totalQuestions,
      marksPerQuestion: testForm.marksPerQuestion,
      instructions: testForm.instructions,
      questions: questions.value,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.TEST_DRAFT, JSON.stringify(draft));
  } catch (err) {
    console.warn("Failed to save test draft to localStorage:", err);
  }
}

function restoreDraftFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TEST_DRAFT);
    if (!saved) return false;
    const draft = JSON.parse(saved);
    if (!draft) return false;

    if (draft.title) testForm.title = draft.title;
    if (draft.testType) testForm.testType = draft.testType;
    if (draft.dueDate) testForm.dueDate = draft.dueDate;
    if (draft.dueTime) testForm.dueTime = draft.dueTime;
    if (draft.duration) testForm.duration = draft.duration;
    if (draft.totalQuestions) testForm.totalQuestions = draft.totalQuestions;
    if (draft.marksPerQuestion) testForm.marksPerQuestion = draft.marksPerQuestion;
    if (draft.instructions !== undefined) testForm.instructions = draft.instructions;

    if (Array.isArray(draft.questions) && draft.questions.length > 0) {
      questions.value = draft.questions;
      return true;
    }
  } catch (err) {
    console.warn("Failed to restore test draft from localStorage:", err);
  }
  return false;
}

function discardDraft() {
  if (confirm("Are you sure you want to discard your unsaved draft questions and form data?")) {
    switchToNewTest(true);
    statusMessage.value = "Draft cleared.";
    isStatusError.value = false;
  }
}

onMounted(async () => {
  await loadCourses();
});

async function loadCourses() {
  isRestoring.value = true;
  isLoadingCourses.value = true;
  try {
    const res = await getCourses();
    const fetchedCourses = res.data.courses || [];
    courses.value = fetchedCourses.map((c) => ({
      id: c._id,
      code: c.courseCode,
      title: c.title,
    }));
  } catch (err) {
    console.warn("Could not fetch courses from backend API, checking store:", err);
    if (lecturerCoursesStore.availableCourses && lecturerCoursesStore.availableCourses.length > 0) {
      courses.value = lecturerCoursesStore.availableCourses.map((c) => ({
        id: c._id || c.id,
        code: c.code || c.courseCode,
        title: c.title,
      }));
    }
  } finally {
    isLoadingCourses.value = false;
  }

  if (courses.value.length === 0) {
    isRestoring.value = false;
    return;
  }

  // Restore saved course selection if available, else first course
  const savedCourseId = route.query?.courseId || localStorage.getItem(STORAGE_KEYS.SELECTED_COURSE);
  const matchedCourse = courses.value.find((c) => c.id === savedCourseId);
  testForm.courseId = matchedCourse ? matchedCourse.id : courses.value[0].id;

  // Fetch tests for this course
  await fetchTestsForCourse(testForm.courseId);

  // Restore active test if saved, otherwise check for staged draft
  const savedTestId = route.query?.testId || localStorage.getItem(STORAGE_KEYS.ACTIVE_TEST);
  let activeTestFound = null;

  if (savedTestId) {
    activeTestFound = courseTests.value.find((t) => t._id === savedTestId);
  }

  if (activeTestFound) {
    await loadExistingTest(activeTestFound);
  } else {
    // In draft mode: restore staged draft questions and settings if available
    switchToNewTest();
  }

  isRestoring.value = false;
}

async function fetchTestsForCourse(courseId) {
  if (!courseId) return;
  isLoadingTests.value = true;
  try {
    const res = await getCourseTests(courseId);
    if (res.data && res.data.success) {
      courseTests.value = res.data.tests || [];
    } else {
      courseTests.value = [];
    }
  } catch (err) {
    console.warn("Failed to fetch course tests:", err);
    courseTests.value = [];
  } finally {
    isLoadingTests.value = false;
  }
}

watch(
  () => testForm.courseId,
  async (newCourseId, oldCourseId) => {
    if (isRestoring.value) return;
    if (newCourseId && newCourseId !== oldCourseId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_COURSE, newCourseId);
      await fetchTestsForCourse(newCourseId);
      if (activeTestId.value) {
        const testInCourse = courseTests.value.find((t) => t._id === activeTestId.value);
        if (!testInCourse) {
          switchToNewTest();
        }
      } else {
        const course = courses.value.find((c) => c.id === newCourseId);
        if (course) {
          testForm.title = `${course.code} Online Test`;
        }
      }
    }
  }
);

watch(
  [questions, () => ({ ...testForm })],
  () => {
    if (!isRestoring.value && !activeTestId.value) {
      saveDraftToStorage();
    }
  },
  { deep: true }
);

function formatTimeAMPM(time24) {
  if (!time24) return "10:00 AM";
  const [hStr, mStr] = time24.split(":");
  let hours = parseInt(hStr, 10);
  const minutes = mStr || "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateEndTime(time24, durationMinutes = 60) {
  if (!time24) return "11:00 AM";
  const [hStr, mStr] = time24.split(":");
  let totalMinutes =
    parseInt(hStr, 10) * 60 +
    parseInt(mStr || 0, 10) +
    Number(durationMinutes || 60);
  let hours = Math.floor(totalMinutes / 60) % 24;
  let minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function convertAmPmTo24(timeStr) {
  if (!timeStr) return "10:00";
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "10:00";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function durationFromTimes(startTime, endTime) {
  const toMinutes = (time) => {
    const converted = convertAmPmTo24(time);
    const [hours, minutes] = converted.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const difference = toMinutes(endTime) - toMinutes(startTime);
  return difference > 0 ? difference : 60;
}

async function onSelectTestChange() {
  if (selectedTestOption.value === "new") {
    switchToNewTest();
  } else {
    const found = courseTests.value.find((t) => t._id === selectedTestOption.value);
    if (found) {
      await loadExistingTest(found);
    }
  }
}

function switchToNewTest(forceClean = false) {
  selectedTestOption.value = "new";
  activeTestId.value = "";
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_TEST);

  if (forceClean) {
    localStorage.removeItem(STORAGE_KEYS.TEST_DRAFT);
  }

  const restored = !forceClean && restoreDraftFromStorage();

  if (restored) {
    statusMessage.value = `Restored draft test with ${questions.value.length} question(s) saved in this browser.`;
    isStatusError.value = false;
  } else {
    const code = selectedCourseCode.value || "Course";
    testForm.title = `${code} Online Test`;
    testForm.testType = "Multiple Choice questions";
    testForm.dueDate = localDateKey(new Date());
    testForm.dueTime = "10:00";
    testForm.duration = 60;
    testForm.totalQuestions = 20;
    testForm.marksPerQuestion = 2;
    testForm.instructions = "";
    questions.value = [];
    statusMessage.value = "";
    isStatusError.value = false;
  }
}

async function loadExistingTest(test) {
  selectedTestOption.value = test._id;
  activeTestId.value = test._id;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_TEST, test._id);
  localStorage.setItem(STORAGE_KEYS.SELECTED_COURSE, testForm.courseId);

  testForm.title = test.testTitle;
  testForm.testType = test.testType === "theory"
    ? "Theory questions"
    : test.testType === "mixed"
      ? "Mixed questions"
      : "Multiple Choice questions";
  testForm.dueDate = test.date ? test.date.split("T")[0] : "";
  testForm.dueTime = convertAmPmTo24(test.startTime);
  testForm.duration = test.duration || durationFromTimes(test.startTime, test.endTime);
  testForm.totalQuestions = test.numberOfQuestions || 20;
  testForm.marksPerQuestion = test.marksPerQuestion || 2;
  testForm.instructions = test.instructions || "";

  await fetchTestQuestions(test._id);
}

async function fetchTestQuestions(testId) {
  isLoadingQuestions.value = true;
  try {
    const res = await getLecturerQuestions(testId);
    if (res.data && res.data.success) {
      questions.value = (res.data.questions || []).map((q) => {
        const opts = Array.isArray(q.options) ? q.options : [];
        return {
          id: q._id,
          _id: q._id,
          type:
            opts.length > 0 ? "Multiple Choice Question" : "Theory Question",
          mark: Number(testForm.marksPerQuestion) || 1,
          text: q.questionText,
          options: [
            { key: "A", text: opts[0] || "" },
            { key: "B", text: opts[1] || "" },
            { key: "C", text: opts[2] || "" },
            { key: "D", text: opts[3] || "" },
          ],
          correctOption: q.correctAnswer || "A",
        };
      });
      statusMessage.value = `Loaded ${questions.value.length} questions from test database.`;
      isStatusError.value = false;
    }
  } catch (err) {
    statusMessage.value =
      err.response?.data?.error || "Failed to load test questions.";
    isStatusError.value = true;
  } finally {
    isLoadingQuestions.value = false;
  }
}

async function scheduleTest() {
  if (!testForm.title) {
    statusMessage.value = "Add a test title before scheduling.";
    isStatusError.value = true;
    return;
  }

  if (!testForm.courseId) {
    statusMessage.value = "Select a course before scheduling.";
    isStatusError.value = true;
    return;
  }

  if (!testForm.dueDate || !testForm.dueTime) {
    statusMessage.value = "Set a due date and start time.";
    isStatusError.value = true;
    return;
  }

  if (!Number.isFinite(Number(testForm.duration)) || Number(testForm.duration) < 1) {
    statusMessage.value = "Set a positive test duration.";
    isStatusError.value = true;
    return;
  }

  isScheduling.value = true;
  statusMessage.value = "";
  isStatusError.value = false;

  try {
    const payload = {
      course: testForm.courseId,
      testTitle: testForm.title,
      testType: testForm.testType.toLowerCase().includes("mixed")
        ? "mixed"
        : testForm.testType.toLowerCase().includes("theory")
          ? "theory"
          : "multiple-choice",
      date: testForm.dueDate,
      startTime: formatTimeAMPM(testForm.dueTime),
      endTime: calculateEndTime(testForm.dueTime, testForm.duration),
      duration: Number(testForm.duration),
      numberOfQuestions:
        Number(testForm.totalQuestions) || questions.value.length || 1,
      marksPerQuestion: Number(testForm.marksPerQuestion) || 1,
      instructions: testForm.instructions || "",
    };

    if (activeTestId.value) {
      // Update existing test
      try {
        await updateTest(activeTestId.value, payload);
        await fetchTestsForCourse(testForm.courseId);
        statusMessage.value = "Test updated successfully in database!";
        isStatusError.value = false;
      } catch (updateErr) {
        statusMessage.value =
          updateErr.response?.data?.error || updateErr.message || "Failed to update test.";
        isStatusError.value = true;
      }
      return;
    }

    const res = await createTest(payload);
    if (res.data && res.data.success) {
      const createdTest = res.data.test;
      activeTestId.value = createdTest._id;
      selectedTestOption.value = createdTest._id;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEST, createdTest._id);
      localStorage.setItem(STORAGE_KEYS.SELECTED_COURSE, testForm.courseId);

      // If questions were staged in the builder, bulk upload them to the created test
      if (questions.value.length > 0) {
        const formattedQuestions = questions.value.map((q) => ({
          questionText: q.text,
          options: q.options.map((o) => o.text).filter(Boolean),
          correctAnswer:
            q.type === "Multiple Choice Question"
              ? q.correctOption || "A"
              : "Theory Question",
        }));

        await bulkUploadQuestions(createdTest._id, {
          questions: formattedQuestions,
        });
        await fetchTestQuestions(createdTest._id);
      }

      // Remove the local draft since it is now published to database
      localStorage.removeItem(STORAGE_KEYS.TEST_DRAFT);

      await fetchTestsForCourse(testForm.courseId);
      statusMessage.value = "Test scheduled and saved to database successfully!";
      isStatusError.value = false;
    }
  } catch (err) {
    statusMessage.value =
      err.response?.data?.error || err.message || "Failed to schedule test.";
    isStatusError.value = true;
  } finally {
    isScheduling.value = false;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function openAddModal() {
  editingQuestionId.value = "";
  resetQuestionForm();
  questionModalOpen.value = true;
}

function openEditModal(question) {
  editingQuestionId.value = question.id;

  Object.assign(questionForm, {
    type: question.type,
    mark: Number(question.mark) || 1,
    text: question.text,
    options: clone(question.options),
    correctOption: question.correctOption || "A",
  });

  questionError.value = "";
  questionModalOpen.value = true;
}

function closeQuestionModal() {
  questionModalOpen.value = false;
  editingQuestionId.value = "";
  resetQuestionForm();
}

function resetQuestionForm() {
  Object.assign(questionForm, {
    type: "Multiple Choice Question",
    mark: Number(testForm.marksPerQuestion) || 1,
    text: "",
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" },
    ],
    correctOption: "A",
  });

  questionError.value = "";
}

function validateQuestion() {
  if (!sanitizeText(questionForm.text)) return "Question text is required.";
  if (!Number(questionForm.mark)) return "Question mark is required.";

  if (questionForm.type === "Multiple Choice Question") {
    const filledOptions = questionForm.options.filter((option) =>
      sanitizeText(option.text)
    );

    if (filledOptions.length < 2) {
      return "At least two answer options are required.";
    }

    const correctOption = questionForm.options.find(
      (option) => option.key === questionForm.correctOption
    );

    if (!correctOption || !sanitizeText(correctOption.text)) {
      return "Select a valid correct answer option.";
    }
  }

  return "";
}

async function saveQuestion() {
  const error = validateQuestion();

  if (error) {
    questionError.value = error;
    return;
  }

  const payloadOptions =
    questionForm.type === "Multiple Choice Question"
      ? questionForm.options.map((o) => sanitizeText(o.text)).filter(Boolean)
      : [];

  const payloadCorrectAnswer =
    questionForm.type === "Multiple Choice Question"
      ? questionForm.correctOption
      : "Theory Question";

  // If connected to an existing test on the backend:
  if (activeTestId.value) {
    try {
      if (
        editingQuestionId.value &&
        !String(editingQuestionId.value).startsWith("temp-") &&
        !String(editingQuestionId.value).startsWith("import-")
      ) {
        const res = await editQuestion(editingQuestionId.value, {
          questionText: sanitizeText(questionForm.text),
          options: payloadOptions,
          correctAnswer: payloadCorrectAnswer,
        });

        const updated = res.data.question;
        const index = questions.value.findIndex(
          (q) => q.id === editingQuestionId.value
        );
        if (index !== -1) {
          questions.value[index] = {
            id: updated._id,
            _id: updated._id,
            type: questionForm.type,
            mark: Number(questionForm.mark),
            text: updated.questionText,
            options: clone(questionForm.options),
            correctOption: updated.correctAnswer,
          };
        }
        statusMessage.value = "Question updated in database.";
        isStatusError.value = false;
      } else {
        const res = await addQuestion(activeTestId.value, {
          questionText: sanitizeText(questionForm.text),
          options: payloadOptions,
          correctAnswer: payloadCorrectAnswer,
        });

        const created = res.data.question;
        questions.value.push({
          id: created._id,
          _id: created._id,
          type: questionForm.type,
          mark: Number(questionForm.mark),
          text: created.questionText,
          options: clone(questionForm.options),
          correctOption: created.correctAnswer,
        });
        statusMessage.value = "Question added to test database.";
        isStatusError.value = false;
      }

      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEST, activeTestId.value);
      localStorage.setItem(STORAGE_KEYS.SELECTED_COURSE, testForm.courseId);

      closeQuestionModal();
      return;
    } catch (err) {
      questionError.value =
        err.response?.data?.error ||
        err.message ||
        "Failed to save question to server.";
      return;
    }
  }

  // Local staging for test not yet scheduled (Draft mode):
  const localItem = {
    id: editingQuestionId.value || `temp-${Date.now()}`,
    type: questionForm.type,
    mark: Number(questionForm.mark),
    text: sanitizeText(questionForm.text),
    options: clone(questionForm.options),
    correctOption: questionForm.correctOption,
  };

  if (editingQuestionId.value) {
    const index = questions.value.findIndex(
      (question) => question.id === editingQuestionId.value
    );

    if (index !== -1) {
      questions.value.splice(index, 1, localItem);
    }
  } else {
    questions.value.push(localItem);
  }

  saveDraftToStorage();

  statusMessage.value = editingQuestionId.value
    ? "Question updated in draft (saved locally)."
    : "Question added to draft (saved locally). Click 'Schedule Test' to publish to database.";
  isStatusError.value = false;

  closeQuestionModal();
}

async function deleteQuestion(questionId) {
  if (
    activeTestId.value &&
    !String(questionId).startsWith("temp-") &&
    !String(questionId).startsWith("import-")
  ) {
    try {
      await deleteQuestionApi(questionId);
      questions.value = questions.value.filter(
        (question) => question.id !== questionId
      );
      statusMessage.value = "Question deleted from database.";
      isStatusError.value = false;
      return;
    } catch (err) {
      statusMessage.value =
        err.response?.data?.error || "Failed to delete question from database.";
      isStatusError.value = true;
      return;
    }
  }

  questions.value = questions.value.filter(
    (question) => question.id !== questionId
  );
  if (!activeTestId.value) {
    saveDraftToStorage();
  }
  statusMessage.value = "Question removed.";
  isStatusError.value = false;
}

function openImportModal() {
  importModalOpen.value = true;
  importFileName.value = "";
  importPreview.value = [];
  importError.value = "";
}

function closeImportModal() {
  importModalOpen.value = false;
  importFileName.value = "";
  importPreview.value = [];
  importError.value = "";
}

function handleCsvSelect(event) {
  const file = event.target.files?.[0];
  parseCsvFile(file);
  event.target.value = "";
}

function handleCsvDrop(event) {
  const file = event.dataTransfer.files?.[0];
  parseCsvFile(file);
}

function parseCsvFile(file) {
  if (!file) return;

  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".csv")) {
    importError.value = "Only CSV files are supported for now.";
    return;
  }

  importFileName.value = file.name;
  importError.value = "";

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const csvText = String(reader.result || "");
      const parsed = parseCsv(csvText);
      const mapped = mapCsvRowsToQuestions(parsed);

      if (mapped.length === 0) {
        importError.value =
          "No valid questions found. Required columns: question, answer. Optional: option_a, option_b, option_c, option_d, mark, type.";
        importPreview.value = [];
        return;
      }

      importPreview.value = mapped;
      importError.value = "";
    } catch {
      importError.value = "Could not parse this CSV file.";
      importPreview.value = [];
    }
  };

  reader.onerror = () => {
    importError.value = "Could not read this CSV file.";
    importPreview.value = [];
  };

  reader.readAsText(file);
}

function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;

      currentRow.push(currentCell);

      if (currentRow.some((cell) => sanitizeText(cell))) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);

  if (currentRow.some((cell) => sanitizeText(cell))) {
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((header) =>
    sanitizeText(header).toLowerCase().replace(/\s+/g, "_")
  );

  return rows.slice(1).map((row) => {
    const record = {};

    headers.forEach((header, index) => {
      record[header] = sanitizeText(row[index]);
    });

    return record;
  });
}

function mapCsvRowsToQuestions(rows) {
  return rows
    .map((row) => {
      const questionText =
        row.question ||
        row.question_text ||
        row.text ||
        row.questiontext ||
        "";

      const answer =
        row.answer ||
        row.correct_answer ||
        row.correct ||
        row.correct_option ||
        "";

      if (!questionText || !answer) return null;

      const optionA = row.option_a || row.a || "";
      const optionB = row.option_b || row.b || "";
      const optionC = row.option_c || row.c || "";
      const optionD = row.option_d || row.d || "";

      const hasOptions = optionA || optionB || optionC || optionD;

      const type =
        row.type?.toLowerCase().includes("theory") || !hasOptions
          ? "Theory Question"
          : "Multiple Choice Question";

      const options = [
        { key: "A", text: optionA },
        { key: "B", text: optionB },
        { key: "C", text: optionC },
        { key: "D", text: optionD },
      ];

      let correctOption = "";

      if (type === "Multiple Choice Question") {
        const normalizedAnswer = answer.toUpperCase();

        if (["A", "B", "C", "D"].includes(normalizedAnswer)) {
          correctOption = normalizedAnswer;
        } else {
          const matched = options.find(
            (option) =>
              option.text.toLowerCase() === answer.toLowerCase()
          );

          correctOption = matched?.key || "A";
        }
      }

      return {
        id: `import-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        mark: Number(row.mark || row.marks || testForm.marksPerQuestion || 1),
        text: questionText,
        options,
        correctOption,
      };
    })
    .filter(Boolean);
}

async function appendImportedQuestions() {
  if (importPreview.value.length === 0) return;

  if (activeTestId.value) {
    try {
      const formatted = importPreview.value.map((q) => ({
        questionText: q.text,
        options: q.options.map((o) => o.text).filter(Boolean),
        correctAnswer:
          q.type === "Multiple Choice Question"
            ? q.correctOption || "A"
            : "Theory Question",
      }));

      await bulkUploadQuestions(activeTestId.value, { questions: formatted });
      await fetchTestQuestions(activeTestId.value);
      statusMessage.value = `${formatted.length} questions imported and saved to database!`;
      isStatusError.value = false;
      closeImportModal();
      return;
    } catch (err) {
      importError.value =
        err.response?.data?.error || "Failed to bulk upload questions.";
      return;
    }
  }

  questions.value.push(...clone(importPreview.value));
  saveDraftToStorage();
  statusMessage.value = `${importPreview.value.length} questions added to draft (saved locally).`;
  isStatusError.value = false;
  closeImportModal();
}

function downloadTemplate() {
  const csv = [
    "question,type,mark,option_a,option_b,option_c,option_d,answer",
    '"What does DBMS stand for?","Multiple Choice Question",2,"Database Management System","Data Backup Machine Service","Digital Base Mapping System","Database Manual Setup","A"',
    '"Explain the difference between primary key and foreign key.","Theory Question",5,"","","","","Expected explanation"',
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "uniosun-test-question-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function openPreviewModal() {
  previewModalOpen.value = true;
}
</script>

<style scoped>
.test-page {
  color: #0f172a;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.test-mode-selector {
  display: flex;
  align-items: center;
}

.select-test-label span {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}

.select-test-control {
  min-width: 250px;
  font-weight: 700;
  border-color: #0875f5;
  background-color: #f8fafc;
}

.heading-badge-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.badge-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.badge-active {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.badge-draft {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.draft-indicator-text {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.header-action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.discard-btn {
  height: 30px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid #fecdd3;
  background: #fff1f2;
  color: #e11d48;
  cursor: pointer;
  transition: all 0.2s ease;
}

.discard-btn:hover {
  background: #ffe4e6;
  border-color: #fda4af;
}

.question-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 6px;
}

.question-modal-header h2 {
  margin: 0;
}

.modal-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.modal-subtext {
  margin: 0 0 16px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}

.page-heading h1 {
  margin: 0;
  color: #111827;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 27px;
  font-weight: 900;
}

.page-heading p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.test-layout {
  display: grid;
  grid-template-columns: minmax(0, 760px) 330px;
  gap: 20px;
  align-items: start;
}

.settings-card,
.questions-card,
.summary-card {
  border: 1px solid #cbd8ea;
  border-radius: 16px;
  background: white;
}

.settings-card,
.questions-card {
  padding: 24px;
}

.settings-card {
  margin-bottom: 20px;
}

.settings-card h2,
.questions-header h2,
.summary-card h2 {
  margin: 0 0 18px;
  color: #111827;
  font-size: 15px;
  font-weight: 900;
}

.form-two,
.form-three {
  display: grid;
  gap: 16px;
}

.form-two {
  grid-template-columns: repeat(2, 1fr);
}

.form-three {
  grid-template-columns: repeat(3, 1fr);
}

.form-label {
  display: block;
  margin-bottom: 18px;
  color: #334155;
  font-size: 12px;
  font-weight: 900;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  margin-top: 8px;
  border: 1px solid #cbd8ea;
  border-radius: 5px;
  background: white;
  color: #334155;
  outline: 0;
  font-size: 13px;
}

.form-input,
.form-select {
  height: 34px;
  padding: 0 12px;
}

.form-textarea {
  min-height: 78px;
  padding: 12px;
  resize: vertical;
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.questions-header div {
  display: flex;
  gap: 10px;
}

.import-btn,
.add-btn,
.preview-btn,
.schedule-btn {
  height: 30px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 900;
}

.import-btn,
.preview-btn {
  border: 1px solid #16a34a;
  background: white;
  color: #16a34a;
}

.add-btn,
.schedule-btn {
  border: 1px solid #16a34a;
  background: #16a34a;
  color: white;
}

.question-row {
  display: grid;
  grid-template-columns: 36px 1fr 54px 34px;
  gap: 16px;
  align-items: center;
  min-height: 72px;
  border-bottom: 1px solid #edf2f7;
}

.question-row:last-of-type {
  border-bottom: 0;
}

.question-number {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  font-weight: 900;
}

.question-content strong {
  display: block;
  margin-bottom: 5px;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
}

.question-content small {
  color: #64748b;
  font-size: 11px;
}

.edit-btn {
  height: 28px;
  border: 1px solid #0875f5;
  border-radius: 4px;
  background: white;
  color: #0875f5;
  font-weight: 900;
}

.delete-btn {
  width: 30px;
  height: 28px;
  border: 1px solid #ef4444;
  border-radius: 4px;
  background: white;
  color: #ef4444;
  font-size: 18px;
}

.questions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.summary-card {
  padding: 24px 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 22px;
  color: #64748b;
  font-size: 13px;
}

.summary-row strong {
  color: #1e3a8a;
}

.empty-questions {
  min-height: 110px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  color: #64748b;
  text-align: center;
}

.empty-questions h3,
.empty-questions p {
  margin: 0;
}

.status-message {
  margin: 14px 0 0;
  color: #16a34a;
  font-size: 13px;
  font-weight: 900;
}

.status-message.status-error {
  color: #ef4444;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.42);
}

.question-modal,
.import-modal,
.preview-modal {
  max-height: 92vh;
  overflow: auto;
  background: white;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
}

.question-modal {
  width: min(630px, 100%);
  padding: 32px;
  border-radius: 8px;
}

.question-modal h2,
.import-modal h2,
.preview-modal h2 {
  margin: 0 0 22px;
  color: #111827;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 25px;
  font-weight: 900;
}

.question-textarea {
  min-height: 86px;
}

.options-card {
  margin-top: 18px;
  padding: 18px;
  border-radius: 8px;
  background: #f8fafc;
}

.options-card h3 {
  margin: 0 0 16px;
  color: #111827;
  font-size: 13px;
  font-weight: 900;
}

.option-row {
  display: grid;
  grid-template-columns: 18px 26px 1fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.option-row input[type="radio"] {
  accent-color: #111827;
}

.option-row span {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: white;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.option-row:has(input[type="radio"]:checked) span {
  background: #16a34a;
  color: white;
}

.option-input {
  height: 34px;
  border: 1px solid #cbd8ea;
  border-radius: 4px;
  padding: 0 10px;
  outline: 0;
}

.modal-actions,
.import-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.cancel-btn,
.save-btn,
.append-btn {
  height: 32px;
  padding: 0 18px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 900;
}

.cancel-btn {
  border: 1px solid #16a34a;
  background: white;
  color: #16a34a;
}

.save-btn {
  border: 1px solid #16a34a;
  background: #16a34a;
  color: white;
}

.form-error {
  margin: 12px 0 0;
  color: #dc2626;
  font-size: 12px;
  font-weight: 900;
}

.import-modal {
  width: min(860px, 100%);
  border-radius: 8px;
}

.import-header {
  display: flex;
  justify-content: space-between;
  padding: 32px 32px 20px;
}

.import-header h2 {
  margin-bottom: 8px;
}

.import-header p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.close-import {
  border: 0;
  background: transparent;
  color: #ef4444;
  font-size: 13px;
  font-weight: 900;
}

.import-tab {
  padding: 0 32px 16px;
  border-bottom: 2px solid #16a34a;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
}

.drop-area {
  width: calc(100% - 64px);
  min-height: 150px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  margin: 32px;
  border: 1px dashed #cbd8ea;
  border-radius: 4px;
  background: white;
  color: #334155;
  text-align: center;
}

.drop-area.active {
  border-color: #16a34a;
  background: #f0fdf4;
}

.folder-icon {
  color: #64748b;
  font-size: 34px;
}

.drop-area strong {
  font-size: 13px;
  font-weight: 900;
}

.drop-area small {
  color: #64748b;
  font-size: 12px;
}

.template-warning {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: 0 32px 32px;
  padding: 16px;
  border: 1px solid #f59e0b;
  border-radius: 3px;
  background: #fef3c7;
  color: #c47d18;
  font-size: 12px;
}

.template-warning button {
  height: 32px;
  padding: 0 16px;
  border: 1px solid #16a34a;
  border-radius: 3px;
  background: white;
  color: #16a34a;
  font-weight: 900;
  white-space: nowrap;
}

.import-preview {
  margin: 0 32px 24px;
  padding: 14px 16px;
  border: 1px solid #cbd8ea;
  border-radius: 6px;
  background: #f8fafc;
}

.import-preview h3 {
  margin: 0 0 10px;
  color: #334155;
  font-size: 13px;
}

.import-preview ul {
  margin: 0;
  padding-left: 18px;
  color: #64748b;
  font-size: 12px;
}

.import-actions {
  padding: 24px 32px 32px;
  background: #f8fafc;
}

.append-btn {
  border: 1px solid #16a34a;
  background: #16a34a;
  color: white;
}

.append-btn:disabled {
  border-color: #e5f3dc;
  background: #e5f3dc;
  cursor: not-allowed;
}

.preview-modal {
  width: min(760px, 100%);
  padding: 28px;
  border-radius: 8px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.preview-header h2 {
  margin: 0 0 8px;
}

.preview-header p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.modal-close {
  width: 34px;
  height: 34px;
  border: 1px solid #cbd8ea;
  border-radius: 999px;
  background: white;
  color: #334155;
  font-size: 22px;
}

.preview-question {
  padding: 16px 0;
  border-bottom: 1px solid #edf2f7;
}

.preview-question strong {
  color: #334155;
}

.preview-question ul {
  margin: 12px 0 0;
  padding-left: 22px;
  color: #64748b;
}

.preview-question li {
  margin-bottom: 6px;
}

.preview-question span {
  margin-left: 8px;
  color: #16a34a;
  font-size: 11px;
  font-weight: 900;
}

@media (max-width: 1050px) {
  .test-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .form-two,
  .form-three {
    grid-template-columns: 1fr;
  }

  .questions-header,
  .template-warning,
  .import-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .question-row {
    grid-template-columns: 34px 1fr;
  }

  .edit-btn,
  .delete-btn {
    grid-column: 2;
    width: max-content;
  }
}
</style>
