import type { SemesterPhase } from "./localSemesterRepository";

export interface CancelledCourseSummary {
  id: string;
  name: string;
  instructor: string;
}

export interface TransitionSummary {
  from: SemesterPhase;
  to: SemesterPhase;
  occurredAt: string;
  // Registration-close fields
  cancelledCourses: CancelledCourseSummary[];
  studentsFlaggedForReReg: string[];
  studentsWarnedUnderload: string[];
  instructorsWarned: string[];
  instructorsSuspended: string[];
  // Grading-close fields
  instructorsMissingGrades?: string[];
  instructorsWarnedClassGpa?: string[];
  studentsTerminated?: string[];
  studentsWarnedGpaInterview?: string[];
  studentsHonorRoll?: string[];
  warningsClearedByHonor?: number;
}

interface PhaseState {
  specialReregEligible: string[];
  suspendedInstructors: string[];
  terminatedStudents: string[];
  honorRollStudents: string[];
  graduatedStudents: string[];
  lastTransition: TransitionSummary | null;
}

const STORAGE_KEY = "college0.phaseState";
const CHANGE_EVENT = "college0:phaseState:changed";

const DEFAULT_STATE: PhaseState = {
  specialReregEligible: [],
  suspendedInstructors: [],
  terminatedStudents: [],
  honorRollStudents: [],
  graduatedStudents: [],
  lastTransition: null,
};

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasBrowserStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalize(email: string) {
  return email.trim().toLowerCase();
}

function readState(): PhaseState {
  const stored = readJson<Partial<PhaseState>>(STORAGE_KEY, DEFAULT_STATE);
  return { ...DEFAULT_STATE, ...stored };
}

function writeState(state: PhaseState) {
  writeJson(STORAGE_KEY, state);
  if (hasBrowserStorage()) {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

export const localPhaseStateRepository = {
  getSpecialReregEligible(): string[] {
    return readState().specialReregEligible;
  },

  isSpecialReregEligible(email: string): boolean {
    if (!email) return false;
    return readState().specialReregEligible.includes(normalize(email));
  },

  markSpecialReregEligible(email: string) {
    const target = normalize(email);
    const state = readState();
    if (state.specialReregEligible.includes(target)) return;
    writeState({
      ...state,
      specialReregEligible: [...state.specialReregEligible, target],
    });
  },

  clearSpecialReregEligible(email: string) {
    const target = normalize(email);
    const state = readState();
    if (!state.specialReregEligible.includes(target)) return;
    writeState({
      ...state,
      specialReregEligible: state.specialReregEligible.filter((entry) => entry !== target),
    });
  },

  getSuspendedInstructors(): string[] {
    return readState().suspendedInstructors;
  },

  isInstructorSuspended(email: string): boolean {
    if (!email) return false;
    return readState().suspendedInstructors.includes(normalize(email));
  },

  suspendInstructor(email: string) {
    const target = normalize(email);
    const state = readState();
    if (state.suspendedInstructors.includes(target)) return;
    writeState({
      ...state,
      suspendedInstructors: [...state.suspendedInstructors, target],
    });
  },

  unsuspendInstructor(email: string) {
    const target = normalize(email);
    const state = readState();
    if (!state.suspendedInstructors.includes(target)) return;
    writeState({
      ...state,
      suspendedInstructors: state.suspendedInstructors.filter((entry) => entry !== target),
    });
  },

  getTerminatedStudents(): string[] {
    return readState().terminatedStudents;
  },

  isStudentTerminated(email: string): boolean {
    if (!email) return false;
    return readState().terminatedStudents.includes(normalize(email));
  },

  terminateStudent(email: string) {
    const target = normalize(email);
    const state = readState();
    if (state.terminatedStudents.includes(target)) return;
    writeState({
      ...state,
      terminatedStudents: [...state.terminatedStudents, target],
    });
  },

  getHonorRollStudents(): string[] {
    return readState().honorRollStudents;
  },

  isHonorRoll(email: string): boolean {
    if (!email) return false;
    return readState().honorRollStudents.includes(normalize(email));
  },

  markHonorRoll(email: string) {
    const target = normalize(email);
    const state = readState();
    if (state.honorRollStudents.includes(target)) return;
    writeState({
      ...state,
      honorRollStudents: [...state.honorRollStudents, target],
    });
  },

  clearHonorRoll(email: string) {
    const target = normalize(email);
    const state = readState();
    if (!state.honorRollStudents.includes(target)) return;
    writeState({
      ...state,
      honorRollStudents: state.honorRollStudents.filter((entry) => entry !== target),
    });
  },

  getGraduatedStudents(): string[] {
    return readState().graduatedStudents;
  },

  isStudentGraduated(email: string): boolean {
    if (!email) return false;
    return readState().graduatedStudents.includes(normalize(email));
  },

  markGraduated(email: string) {
    const target = normalize(email);
    const state = readState();
    if (state.graduatedStudents.includes(target)) return;
    writeState({
      ...state,
      graduatedStudents: [...state.graduatedStudents, target],
    });
  },

  getLastTransitionSummary(): TransitionSummary | null {
    return readState().lastTransition;
  },

  recordTransitionSummary(summary: TransitionSummary) {
    const state = readState();
    writeState({ ...state, lastTransition: summary });
  },

  subscribe(callback: () => void) {
    if (!hasBrowserStorage()) return () => {};
    window.addEventListener(CHANGE_EVENT, callback);
    return () => window.removeEventListener(CHANGE_EVENT, callback);
  },

  // Future Supabase handoff:
  // back this with a `phase_state` table (per-semester) and a `transition_log` table for the
  // recorded summaries.
};
