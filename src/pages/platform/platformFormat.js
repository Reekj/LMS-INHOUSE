export function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const CODE_PATTERN = /^[a-z0-9-]+$/;
export const MIN_PASSWORD_LENGTH = 12;

export function emptyAdmin() {
  return { name: "", email: "", identifier: "", department: "", password: "", confirmPassword: "" };
}

// Validates the admin fields shared by "create institution" and "add admin".
export function validateAdminFields(admin) {
  if (!admin.name.trim()) return "Administrator name is required.";
  if (!EMAIL_PATTERN.test(admin.email.trim())) return "Enter a valid administrator email.";
  if (!admin.identifier.trim()) return "Staff identifier is required.";
  if (admin.password.length < MIN_PASSWORD_LENGTH) {
    return `Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (admin.password !== admin.confirmPassword) return "Passwords do not match.";
  return "";
}
