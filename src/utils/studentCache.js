// Per-account student caches in localStorage. Cleared on logout and on an
// expired session so the next person on this browser never sees them.
const STUDENT_CACHE_KEYS = [
  "uniosun_lms_student_v1",
  "uniosun_lms_student_v2",
  "uniosun_lms_student_tests_v1",
  "uniosun_lms_student_tests_v2",
  "uniosun_lms_student_settings_v1",
];

export function clearStudentCaches() {
  STUDENT_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
}
