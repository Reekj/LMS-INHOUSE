<template>
  <section v-if="loading" class="not-found">
    <h1>Loading result...</h1>
  </section>

  <section v-else-if="!result" class="not-found">
    <h1>{{ loadError || "Result not found" }}</h1>
    <RouterLink to="/student/test">Back to Tests</RouterLink>
  </section>

  <section v-else class="test-result-page">
    <button type="button" class="back-btn" @click="goBack">
      ←
    </button>

    <section class="result-banner">
      <div>
        <h2>{{ result.courseCode }} — {{ result.title }}</h2>
        <h1>{{ result.courseTitle }}</h1>
        <p>
          {{ result.missed ? "You did not take this test" : `Submitted: ${result.submittedDate}` }}
          <template v-if="result.duration"> · Duration: {{ result.duration }} mins</template>
        </p>
      </div>

      <div class="score-box">
        <strong>{{ result.score }}</strong>
        <span>/{{ result.totalMarks }}</span>
        <em>{{ result.percentage }}% — {{ result.grade }}</em>
      </div>
    </section>

    <section class="summary-row">
      <div class="summary-item correct">
        <strong>{{ result.correctCount }}</strong>
        <span>Correct</span>
      </div>
      <div class="summary-item wrong">
        <strong>{{ wrongCount }}</strong>
        <span>Wrong</span>
      </div>
      <div class="summary-item skipped">
        <strong>{{ questions.length - result.answeredCount }}</strong>
        <span>Not answered</span>
      </div>
      <div class="summary-item">
        <strong>{{ questions.length }}</strong>
        <span>Questions</span>
      </div>
    </section>

    <div v-if="currentQuestion" class="result-layout">
      <main class="review-card">
        <div class="question-head">
          <p class="question-number">
            Question {{ currentIndex + 1 }} of {{ questions.length }}
          </p>
          <span class="verdict" :class="questionStatus(currentQuestion)">
            {{ verdictLabel(currentQuestion) }}
          </span>
        </div>

        <h2>{{ currentQuestion.question }}</h2>

        <div v-if="currentQuestion.options.length" class="options-list">
          <div
            v-for="option in currentQuestion.options"
            :key="option.id"
            class="option-row"
            :class="resultOptionClass(option.id)"
          >
            <span>{{ option.id }}</span>
            <div class="option-text">
              {{ option.text }}
              <small v-if="option.id === currentQuestion.correctAnswer" class="option-note">Correct answer</small>
              <small
                v-if="option.id === currentQuestion.selectedAnswer"
                class="option-note"
              >
                Your answer
              </small>
            </div>
          </div>
        </div>

        <div v-else class="text-answers">
          <p><strong>Your answer:</strong> {{ currentQuestion.selectedAnswer || "Not answered" }}</p>
          <p><strong>Expected answer:</strong> {{ currentQuestion.correctAnswer }}</p>
        </div>

        <div class="review-actions">
          <button
            type="button"
            class="prev-btn"
            :disabled="currentIndex === 0"
            @click="previousQuestion"
          >
            ← Previous
          </button>

          <button
            type="button"
            class="next-btn"
            :disabled="currentIndex === questions.length - 1"
            @click="nextQuestion"
          >
            Next →
          </button>
        </div>
      </main>

      <aside class="navigator-card">
        <h2>Question Navigator</h2>

        <div class="navigator-grid">
          <button
            v-for="(question, index) in questions"
            :key="question.id"
            type="button"
            :class="[questionStatus(question), { current: index === currentIndex }]"
            @click="currentIndex = index"
          >
            {{ index + 1 }}
          </button>
        </div>

        <div class="legend-row">
          <span><i class="correct"></i> Correct</span>
          <span><i class="wrong"></i> Wrong</span>
          <span><i class="skipped"></i> Not answered</span>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { useStudentTestsStore } from "../../stores/studentTests.store";

const route = useRoute();
const router = useRouter();
const testsStore = useStudentTestsStore();

const testId = computed(() => String(route.params.testId || ""));
const loading = ref(true);
const loadError = ref("");
const currentIndex = ref(0);

onMounted(async () => {
  const { error } = await testsStore.fetchTestResultsAction(testId.value);
  loadError.value = error;
  loading.value = false;
});

const result = computed(() => (loadError.value ? null : testsStore.getResultByTestId(testId.value)));
const questions = computed(() => result.value?.review || []);
const currentQuestion = computed(() => questions.value[currentIndex.value]);
const wrongCount = computed(() => result.value.answeredCount - result.value.correctCount);

function questionStatus(question) {
  if (question.selectedAnswer === null || question.selectedAnswer === "") return "skipped";
  return question.isCorrect ? "correct" : "wrong";
}

function verdictLabel(question) {
  const status = questionStatus(question);
  if (status === "correct") return "Correct";
  if (status === "wrong") return "Wrong";
  return "Not answered";
}

function resultOptionClass(optionId) {
  const { correctAnswer, selectedAnswer } = currentQuestion.value;
  if (optionId === correctAnswer) return "correct";
  if (optionId === selectedAnswer) return "wrong";
  return "";
}

function previousQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value += 1;
  }
}

function goBack() {
  router.push({ path: "/student/test", query: { tab: "past" } });
}
</script>

<style scoped>
.test-result-page {
  color: #0f172a;
}

.back-btn {
  width: 42px;
  height: 28px;
  margin-bottom: 22px;
  border: 1px solid #16a34a;
  border-radius: 4px;
  background: white;
  color: #16a34a;
  font-size: 17px;
  font-weight: 900;
}

.result-banner {
  min-height: 128px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  border-radius: 8px;
  background: #0875f5;
  color: white;
  margin-bottom: 24px;
}

.result-banner h2 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 800;
}

.result-banner h1 {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 900;
}

.result-banner p {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.score-box {
  text-align: right;
}

.score-box strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 40px;
  font-weight: 900;
}

.score-box span {
  margin-left: 4px;
  font-size: 14px;
}

.score-box em {
  width: max-content;
  height: 22px;
  display: flex;
  align-items: center;
  margin-top: 8px;
  margin-left: auto;
  padding: 0 10px;
  border-radius: 4px;
  background: #dcfce7;
  color: #16a34a;
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.result-layout {
  display: grid;
  grid-template-columns: minmax(0, 808px) 302px;
  gap: 20px;
}

.review-card,
.navigator-card {
  border: 1px solid #cbd8ea;
  border-radius: 16px;
  background: white;
}

.review-card {
  padding: 24px;
}

.question-number {
  margin: 0 0 14px;
  color: #16a34a;
  font-size: 13px;
  font-weight: 800;
}

.review-card h2 {
  margin: 0 0 24px;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.5;
  font-weight: 700;
}

.options-list {
  display: grid;
  gap: 14px;
}

.option-row {
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: white;
  padding: 0 16px;
  color: #0f172a;
  font-size: 14px;
}

.option-row span {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid #dbe4f0;
  border-radius: 999px;
  color: #16a34a;
  background: white;
  font-size: 13px;
}

.option-row.correct {
  border-color: #22c55e;
  background: #dcfce7;
}

.option-row.correct span {
  border-color: #22c55e;
  background: #dcfce7;
  color: #16a34a;
}

.option-row.wrong {
  border-color: #ef4444;
  background: #fee2e2;
}

.option-row.wrong span {
  border-color: #ef4444;
  background: #fee2e2;
  color: #ef4444;
}

.review-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

.prev-btn,
.next-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 900;
}

.prev-btn {
  border: 1px solid #16a34a;
  background: white;
  color: #16a34a;
}

.next-btn {
  border: 1px solid #16a34a;
  background: #16a34a;
  color: white;
}

.prev-btn:disabled,
.next-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.navigator-card {
  padding: 22px 20px;
}

.navigator-card h2 {
  margin: 0 0 18px;
  color: #334155;
  font-size: 15px;
  font-weight: 900;
}

.navigator-grid {
  display: grid;
  grid-template-columns: repeat(6, 37px);
  gap: 10px;
}

.navigator-grid button {
  width: 37px;
  height: 37px;
  border: 1px solid #22c55e;
  border-radius: 7px;
  background: #dcfce7;
  color: #16a34a;
  font-size: 14px;
  font-weight: 800;
}

.navigator-grid button.current {
  border-color: #0875f5;
  background: #0875f5;
  color: white;
}

.legend-row {
  margin-top: 16px;
}

.legend-row span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #334155;
  font-size: 10px;
}

.legend-row i {
  width: 10px;
  height: 10px;
  display: inline-block;
  background: #0875f5;
}

.not-found {
  min-height: 260px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
}

@media (max-width: 980px) {
  .result-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .score-box {
    text-align: left;
  }

  .score-box em {
    margin-left: 0;
  }

  .result-layout {
    grid-template-columns: 1fr;
  }
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.summary-item {
  padding: 16px 18px;
  border: 1px solid #d5deeb;
  border-radius: 8px;
  background: #ffffff;
}

.summary-item strong {
  display: block;
  font-size: 26px;
  font-weight: 900;
  color: #0f172a;
}

.summary-item span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.summary-item.correct strong {
  color: #16a34a;
}

.summary-item.wrong strong {
  color: #dc2626;
}

.summary-item.skipped strong {
  color: #94a3b8;
}

.question-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.verdict {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 800;
}

.verdict.correct {
  background: #dcfce7;
  color: #15803d;
}

.verdict.wrong {
  background: #fee2e2;
  color: #dc2626;
}

.verdict.skipped {
  background: #f1f5f9;
  color: #64748b;
}

.option-text {
  display: grid;
  gap: 2px;
}

.option-note {
  font-size: 11px;
  font-weight: 800;
  opacity: 0.8;
}

.text-answers p {
  margin: 0 0 10px;
  color: #334155;
}

.navigator-grid button.correct {
  border-color: #86efac;
  background: #dcfce7;
  color: #15803d;
}

.navigator-grid button.wrong {
  border-color: #fca5a5;
  background: #fee2e2;
  color: #dc2626;
}

.navigator-grid button.skipped {
  color: #94a3b8;
}

/* Keep the correct/wrong colour and mark the selected question with an outline. */
.navigator-grid button.current {
  outline: 2px solid #0875f5;
  outline-offset: 2px;
}

.navigator-grid button.current.skipped {
  background: #0875f5;
  border-color: #0875f5;
  color: white;
}

.legend-row i.correct {
  background: #dcfce7;
  border: 1px solid #86efac;
}

.legend-row i.wrong {
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.legend-row i.skipped {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
}

@media (max-width: 700px) {
  .summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>