import { defineStore } from "pinia";
import { getFaculties } from "../api/faculty.api";

// The signed-in user's institution's faculties and departments, as set up by
// its administrators on the Faculties & Departments page.
export const useFacultiesStore = defineStore("faculties", {
  state: () => ({
    faculties: [],
    unassigned: [],
    loaded: false,
    error: "",
  }),

  getters: {
    // { "Faculty name": ["Department", ...] }, the shape the forms use.
    facultyDepartments: (state) =>
      Object.fromEntries(
        state.faculties.map((faculty) => [faculty.name, faculty.departments.map((d) => d.name)])
      ),

    // Faculty of a department name, or "" if it is not set up.
    facultyOf: (state) => (department) => {
      const key = String(department || "").trim().toLowerCase();
      const faculty = state.faculties.find((f) =>
        f.departments.some((d) => d.name.toLowerCase() === key)
      );
      return faculty?.name || "";
    },
  },

  actions: {
    async fetch() {
      if (!import.meta.env.VITE_API_URL) return;
      this.error = "";
      try {
        const res = await getFaculties();
        this.faculties = res.data.faculties || [];
        this.unassigned = res.data.unassigned || [];
        this.loaded = true;
      } catch (err) {
        this.error = err.response?.data?.error || "Could not load faculties and departments.";
      }
    },
  },
});
