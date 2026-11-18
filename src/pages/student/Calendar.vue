<template>
  <section class="calendar-page">
    <div class="page-heading">
      <h1>{{ viewMode === "week" ? "Academic Calendar" : "Calendar" }}</h1>
      <p>{{ formattedToday }} <span>·</span> {{ weekLabel }}</p>
    </div>

    <div class="calendar-top-row">
      <h2>{{ monthLabel }}</h2>

      <div class="calendar-controls">
        <div class="view-toggle">
          <button
            type="button"
            :class="{ active: viewMode === 'week' }"
            @click="viewMode = 'week'"
          >
            Week
          </button>
          <button
            type="button"
            :class="{ active: viewMode === 'month' }"
            @click="viewMode = 'month'"
          >
            Month
          </button>
        </div>

        <div class="month-nav">
          <button type="button" @click="previousPeriod">‹</button>
          <button type="button" @click="nextPeriod">›</button>
        </div>
      </div>
    </div>

    <section v-if="viewMode === 'month'" class="month-calendar">
      <div class="weekday-row">
        <span v-for="day in weekDays" :key="day">{{ day }}</span>
      </div>

      <div class="month-grid">
        <article
          v-for="day in monthCells"
          :key="day.key"
          class="month-cell"
          :class="day.className"
        >
          <span class="cell-date" :class="{ today: day.isoDate === todayDateKey }">
            {{ day.dateNumber }}
          </span>

          <button
            v-for="event in eventsForDate(day.isoDate)"
            :key="event.id"
            type="button"
            class="cell-event"
            :class="event.color"
            @click="openEvent(event)"
          >
            {{ event.title }}
          </button>
        </article>
      </div>
    </section>

    <section v-else class="week-calendar">
      <div class="week-band">
        {{ weekLabel }}
      </div>

      <div class="week-header">
        <span></span>
        <strong v-for="day in weekViewDays" :key="day.key">
          {{ day.label }}
        </strong>
      </div>

      <div class="week-grid">
        <div class="time-column">
          <span v-for="time in weekTimes" :key="time">{{ time }}</span>
        </div>

        <div class="week-columns">
          <div
            v-for="day in weekViewDays"
            :key="day.key"
            class="week-day-column"
          >
            <button
              v-for="event in weekEventsForDay(day.key)"
              :key="event.id"
              type="button"
              class="week-event"
              :class="event.color"
              :style="{ top: event.weekTop }"
              @click="openEvent(event)"
            >
              {{ event.title }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="selectedEvent" class="modal-backdrop">
      <section class="event-modal">
        <button type="button" class="modal-close" @click="selectedEvent = null">
          ×
        </button>

        <h2>{{ selectedEvent.fullTitle }}</h2>

        <p class="event-course">
          {{ selectedEvent.lecturer }} <span>·</span> {{ selectedEvent.courseCode }}
        </p>

        <div class="event-details">
          <article>
            <CalendarDays :size="18" />
            <span>{{ readableEventDate }}</span>
          </article>

          <article>
            <Clock3 :size="18" />
            <span>{{ selectedEvent.startTime }} - {{ selectedEvent.endTime }}</span>
          </article>

          <article>
            <MapPin :size="18" />
            <span>{{ selectedEvent.location }}</span>
          </article>
        </div>

        <p class="event-note">{{ selectedEvent.note }}</p>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { CalendarDays, Clock3, MapPin } from "lucide-vue-next";

import { useStudentStore } from "../../stores/student.store";
import { useAuthStore } from "../../stores/auth.store";
import { eventsForDate as occurrencesForDate } from "../../utils/calendarEvents";

const studentStore = useStudentStore();
const authStore = useAuthStore();

const viewMode = ref("month");
const selectedEvent = ref(null);
const currentDate = ref(new Date());

onMounted(async () => {
  if (import.meta.env.VITE_API_URL && authStore.user) {
    await studentStore.fetchStudentDataFromDB(authStore.user.id, authStore.user.enrolledCourses);
  }
});

const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const weekTimes = ["9AM", "10AM", "11AM", "NOON", "1PM", "2PM", "3PM", "4PM", "5PM"];

const todayDateKey = toDateKey(new Date());
const formattedToday = computed(() =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
);
const monthLabel = computed(() =>
  currentDate.value.toLocaleDateString("en-US", { month: "long", year: "numeric" })
);
const weekViewDays = computed(() => {
  const start = startOfWeek(currentDate.value);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: toDateKey(date),
      label: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
    };
  });
});
const weekLabel = computed(() => {
  const start = startOfWeek(currentDate.value);
  const end = addDays(start, 6);
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} - ${endLabel}`;
});

const monthCells = computed(() => {
  const firstDay = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    1
  );
  const gridStart = startOfWeek(firstDay);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const isoDate = toDateKey(date);
    return {
      isoDate,
      dateNumber: String(date.getDate()).padStart(2, "0"),
      className: date.getMonth() === currentDate.value.getMonth() ? "" : "muted",
      key: isoDate,
    };
  });
});

const readableEventDate = computed(() => {
  if (!selectedEvent.value) return "";

  const date = new Date(`${selectedEvent.value.date}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

function eventsForDate(date) {
  return occurrencesForDate(studentStore.calendarEvents, date);
}

function weekEventsForDay(date) {
  return occurrencesForDate(studentStore.calendarEvents, date)
    .map((event) => ({
      ...event,
      weekTop: weekTopFromTime(event.startTime),
    }));
}

function weekTopFromTime(time) {
  const hour = Number(String(time).split(":")[0]);
  const normalizedHour = time.includes("PM") && hour !== 12 ? hour + 12 : hour;
  const top = (normalizedHour - 9) * 81 + 24;

  return `${Math.max(16, top)}px`;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function openEvent(event) {
  selectedEvent.value = event;
}

function previousPeriod() {
  if (viewMode.value === "month") {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
  } else {
    currentDate.value = addDays(currentDate.value, -7);
  }
}

function nextPeriod() {
  if (viewMode.value === "month") {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
  } else {
    currentDate.value = addDays(currentDate.value, 7);
  }
}
</script>

<style scoped>
.calendar-page {
  color: #0f172a;
}

.page-heading {
  margin-bottom: 34px;
}

.page-heading h1 {
  margin: 0 0 8px;
  color: #111827;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 27px;
  font-weight: 900;
}

.page-heading p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.page-heading p span {
  margin: 0 9px;
}

.calendar-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.calendar-top-row h2 {
  margin: 0;
  color: #334155;
  font-size: 20px;
  font-weight: 900;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 250px;
}

.view-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.view-toggle button {
  min-width: 64px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.view-toggle button.active {
  border-color: #0875f5;
  background: #eff6ff;
  color: #0875f5;
}

.month-nav {
  display: flex;
  gap: 10px;
}

.month-nav button {
  border: 0;
  background: transparent;
  color: #334155;
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

.academic-band-row {
  display: grid;
  grid-template-columns: 2fr 2fr 2fr;
  gap: 10px;
  margin-bottom: 16px;
}

.academic-band {
  height: 34px;
  display: grid;
  place-items: center;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
}

.academic-band.yellow {
  background: #fef3c7;
}

.academic-band.purple {
  background: #ede9fe;
}

.academic-band.green {
  background: #dcfce7;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  height: 32px;
  align-items: center;
}

.weekday-row span {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-align: center;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-top: 1px solid #cbd8ea;
  border-left: 1px solid #cbd8ea;
}

.month-cell {
  position: relative;
  min-height: 138px;
  padding: 62px 14px 10px;
  border-right: 1px solid #cbd8ea;
  border-bottom: 1px solid #cbd8ea;
  background: white;
}

.month-cell.test-week {
  border-top: 2px solid #f59e0b;
  border-bottom: 2px solid #f59e0b;
}

.month-cell.revision-week {
  border-top: 2px solid #8b5cf6;
  border-bottom: 2px solid #8b5cf6;
}

.month-cell.holiday {
  border: 2px solid #16a34a;
}

.cell-date {
  position: absolute;
  top: 34px;
  right: 8px;
  min-width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  color: #111827;
  font-size: 13px;
}

.cell-date.today {
  border-radius: 999px;
  background: #0875f5;
  color: white;
  font-weight: 900;
}

.month-cell.muted .cell-date {
  color: #111827;
}

.cell-event {
  width: 100%;
  height: 27px;
  border: 0;
  border-radius: 4px;
  margin-bottom: 8px;
  padding: 0 10px;
  text-align: left;
  font-size: 12px;
  font-weight: 900;
}

.cell-event.blue {
  background: #f8fafc;
  color: #0875f5;
}

.cell-event.purple {
  background: #ede9fe;
  color: #8b5cf6;
}

.cell-event.green {
  background: #dcfce7;
  color: #16a34a;
}

.cell-event.red {
  background: #fee2e2;
  color: #ef4444;
}

.week-band {
  width: 70%;
  height: 34px;
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
  background: #fef3c7;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
}

.week-header {
  display: grid;
  grid-template-columns: 43px repeat(7, 1fr);
  align-items: center;
  height: 30px;
}

.week-header strong {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-align: left;
}

.week-grid {
  display: grid;
  grid-template-columns: 43px 1fr;
}

.time-column {
  display: grid;
  grid-template-rows: repeat(9, 81px);
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.week-columns {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  min-height: 729px;
  border-left: 1px solid #cbd8ea;
  border-top: 1px solid #cbd8ea;
  background:
    linear-gradient(to bottom, transparent 80px, #cbd8ea 81px) 0 0 / 100% 81px;
}

.week-day-column {
  position: relative;
  border-right: 1px solid #cbd8ea;
}

.week-event {
  position: absolute;
  left: 10px;
  right: 10px;
  height: 38px;
  border: 0;
  border-radius: 4px;
  text-align: left;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 900;
}

.week-event.blue {
  background: #f8fafc;
  color: #0875f5;
}

.week-event.green {
  background: #dcfce7;
  color: #16a34a;
}

.week-event.red {
  background: #fee2e2;
  color: #ef4444;
}

.week-event.purple {
  background: #ede9fe;
  color: #8b5cf6;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: start center;
  padding-top: 104px;
  background: rgba(15, 23, 42, 0.35);
}

.event-modal {
  position: relative;
  width: min(558px, calc(100vw - 40px));
  min-height: 335px;
  padding: 48px 32px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.2);
}

.modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 24px;
}

.event-modal h2 {
  margin: 0 0 8px;
  color: #0875f5;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 25px;
  font-weight: 900;
}

.event-course {
  margin: 0 0 28px;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

.event-course span {
  margin: 0 8px;
}

.event-details {
  display: grid;
  gap: 22px;
  margin-bottom: 28px;
}

.event-details article {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #334155;
  font-size: 13px;
}

.event-note {
  margin: 0;
  color: #334155;
  font-size: 13px;
}

@media (max-width: 1050px) {
  .calendar-controls {
    gap: 40px;
  }

  .month-cell {
    min-height: 110px;
    padding: 52px 8px 8px;
  }
}

@media (max-width: 800px) {
  .calendar-top-row,
  .calendar-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .academic-band-row,
  .weekday-row,
  .month-grid,
  .week-header,
  .week-grid {
    min-width: 860px;
  }

  .month-calendar,
  .week-calendar {
    overflow-x: auto;
  }
}
</style>