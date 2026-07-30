import { defineStore } from "pinia";
import { loginUser, logoutUser } from "../api/auth.api";
import { setToken, clearToken } from "../utils/token";

const STORAGE_KEY = "uniosun_lms_auth";

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function getStoredAuth() {
  const stored = safeParse(localStorage.getItem(STORAGE_KEY));

  if (!stored || !stored.user || !stored.token) {
    return {
      user: null,
      token: "",
      isAuthenticated: false,
    };
  }

  return {
    user: stored.user,
    token: stored.token,
    isAuthenticated: true,
  };
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    ...getStoredAuth(),
  }),

  getters: {
    userRole: (state) => state.user?.role || "",
    userName: (state) => state.user?.name || "Guest User",
    userInitials: (state) => {
      const name = state.user?.name || "Guest User";

      return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    },
  },

  actions: {
    async login(payload) {
      const email = sanitizeText(payload.email).toLowerCase();
      const password = sanitizeText(payload.password);

      // If VITE_API_URL is configured, try calling the real backend API first
      if (import.meta.env.VITE_API_URL) {
        try {
          const res = await loginUser({
            loginKey: email,
            password: password
          });

          const { token, user } = res.data;

          this.user = user;
          this.token = token;
          this.isAuthenticated = true;

          // Save token to token utility and state
          setToken(token);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
          return user.role; // Return the role so the component can redirect
        } catch (err) {
          // If it's a validation error or unauthorized role, throw it to the user
          if (err.response && (err.response.status === 400 || err.response.status === 403 || err.response.status === 404)) {
            throw new Error(err.response.data.error || "Invalid credentials.");
          }
          console.warn("Backend API login failed. Falling back to offline mock mode.", err);
        }
      }

      // Offline Fallback / Mock Login Mode
      let role = "student";
      if (email.includes("admin") || email.includes("sola")) {
        role = "admin";
      } else if (email.includes("lecturer") || email.includes("folake")) {
        role = "lecturer";
      }

      const roleProfiles = {
        admin: {
          id: "adm-001",
          name: "Sola Adeyemi",
          email: "sola@uniosun.edu.ng",
          role: "admin",
          label: "Admin",
        },
        lecturer: {
          id: "lec-001",
          name: "Dr. Folake Adesanya",
          email: "folake@uniosun.edu.ng",
          role: "lecturer",
          label: "Lecturer",
        },
        student: {
          id: "stu-001",
          name: "Adebayo Johnson",
          email: "adebayo@student.uniosun.edu.ng",
          role: "student",
          label: "Student",
        },
      };

      const selectedUser = roleProfiles[role];

      if (!selectedUser) {
        throw new Error("Invalid login role selected.");
      }

      const dummyToken = `dummy_${role}_token_${Date.now()}`;
      const authPayload = {
        user: selectedUser,
        token: dummyToken,
      };

      this.user = authPayload.user;
      this.token = authPayload.token;
      this.isAuthenticated = true;

      setToken(dummyToken);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authPayload));
      return role;
    },

    async logout() {
      const token = this.token;

      // Clear state immediately to avoid routing guard race conditions
      this.user = null;
      this.token = "";
      this.isAuthenticated = false;
      clearToken();
      localStorage.removeItem(STORAGE_KEY);

      if (import.meta.env.VITE_API_URL && token && !token.startsWith("dummy_")) {
        try {
          await logoutUser();
        } catch (err) {
          console.warn("Server logout request failed:", err);
        }
      }
    },
  },
});