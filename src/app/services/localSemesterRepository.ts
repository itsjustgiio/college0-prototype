export type SemesterPhase = "setup" | "registration" | "running" | "grading";

export const SEMESTER_PHASES: { id: SemesterPhase; label: string; description: string }[] = [
  { id: "setup", label: "Class Setup", description: "Registrars build the schedule, assign instructors, set class sizes." },
  { id: "registration", label: "Registration", description: "Matriculated students register 2-4 courses subject to time and seat rules." },
  { id: "running", label: "Classes Running", description: "Classes are in session. Low-enrollment courses cancelled; students under-loaded warned." },
  { id: "grading", label: "Grading", description: "Instructors post grades. Honor roll, warnings, and terminations resolve at close." },
];

const STORAGE_KEY = "college0.semester.phase";
const CHANGE_EVENT = "college0:semester:phase-changed";
const DEFAULT_PHASE: SemesterPhase = "registration";

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValidPhase(value: string | null): value is SemesterPhase {
  return value === "setup" || value === "registration" || value === "running" || value === "grading";
}

export const localSemesterRepository = {
  getPhase(): SemesterPhase {
    if (!hasBrowserStorage()) return DEFAULT_PHASE;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isValidPhase(stored) ? stored : DEFAULT_PHASE;
  },

  setPhase(next: SemesterPhase) {
    if (!hasBrowserStorage()) return;
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent<SemesterPhase>(CHANGE_EVENT, { detail: next }));
  },

  subscribe(callback: (phase: SemesterPhase) => void) {
    if (!hasBrowserStorage()) return () => {};
    const handler = (event: Event) => callback((event as CustomEvent<SemesterPhase>).detail);
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  },
};
