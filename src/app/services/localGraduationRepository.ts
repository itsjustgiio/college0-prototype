import { localCollegeRepository } from "./localCollegeRepository";
import { localCourseRepository } from "./localCourseRepository";
import { localGradingRepository } from "./localGradingRepository";
import { localAuthRepository } from "./localAuthRepository";
import { localPhaseStateRepository } from "./localPhaseStateRepository";
import { localWarningsRepository } from "./localWarningsRepository";

export type GraduationApplicationStatus = "pending" | "approved" | "rejected";

export interface CompletedCourseSnapshot {
  id: string;
  name: string;
  grade: string;
  semester: string;
  credits: number;
}

export interface GraduationApplication {
  id: string;
  studentEmail: string;
  submittedAt: string;
  status: GraduationApplicationStatus;
  passingCompletionsAtSubmission: number;
  passingCoursesAtSubmission: CompletedCourseSnapshot[];
  reviewedAt?: string;
  reviewedBy?: string;
  registrarNote?: string;
}

export const GRADUATION_THRESHOLD = 8;
export const REQUIRED_GRADUATION_COURSE_IDS = [
  "CS101",
  "CS201",
  "CS301",
  "CS302",
  "CS401",
  "CS402",
  "MATH201",
  "MATH301",
];

const STORAGE_KEY = "college0.graduationApplications";
const CHANGE_EVENT = "college0:graduation:changed";

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

function createId() {
  return `grad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readAll(): GraduationApplication[] {
  return readJson<GraduationApplication[]>(STORAGE_KEY, []);
}

function writeAll(records: GraduationApplication[]) {
  writeJson(STORAGE_KEY, records);
  if (hasBrowserStorage()) {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

function collectPassingCompletions(email: string): CompletedCourseSnapshot[] {
  const normalized = normalize(email);
  const legacy = localCollegeRepository.getStudentCourseSnapshot(normalized).completedCourses;
  const passingLegacy = legacy.filter((entry) => entry.grade !== "F");

  const currentRecords = localGradingRepository.listForStudent(normalized);
  const passingCurrent: CompletedCourseSnapshot[] = [];
  for (const record of currentRecords) {
    if (record.grade === "F") continue;
    const course = localCourseRepository.get(record.courseId);
    passingCurrent.push({
      id: record.courseId,
      name: course?.name ?? record.courseId,
      grade: record.grade,
      semester: record.semester,
      credits: course?.credits ?? 3,
    });
  }

  // De-duplicate by courseId (favour the most recent semester entry).
  const seen = new Set<string>();
  const combined: CompletedCourseSnapshot[] = [];
  for (const entry of [...passingCurrent, ...passingLegacy]) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    combined.push(entry);
  }

  return combined;
}

function getMissingRequiredCourses(passingCourses: CompletedCourseSnapshot[]): string[] {
  const passedIds = new Set(passingCourses.map((course) => course.id));
  return REQUIRED_GRADUATION_COURSE_IDS.filter((courseId) => !passedIds.has(courseId));
}

export const localGraduationRepository = {
  countPassingCompletions(email: string): number {
    return collectPassingCompletions(email).length;
  },

  listPassingCompletions(email: string): CompletedCourseSnapshot[] {
    return collectPassingCompletions(email);
  },

  getMissingRequiredCourses(email: string): string[] {
    return getMissingRequiredCourses(collectPassingCompletions(email));
  },

  listApplications(): GraduationApplication[] {
    return readAll();
  },

  listForStudent(email: string): GraduationApplication[] {
    const target = normalize(email);
    return readAll().filter((entry) => entry.studentEmail === target);
  },

  findActivePendingForStudent(email: string): GraduationApplication | null {
    const target = normalize(email);
    return readAll().find((entry) => entry.studentEmail === target && entry.status === "pending") ?? null;
  },

  submitApplication(email: string): GraduationApplication {
    const target = normalize(email);
    const existing = localGraduationRepository.findActivePendingForStudent(target);
    if (existing) return existing;

    const passingCourses = collectPassingCompletions(target);
    const missingRequired = getMissingRequiredCourses(passingCourses);
    if (passingCourses.length !== GRADUATION_THRESHOLD || missingRequired.length > 0) {
      throw new Error(
        `Graduation applications require exactly 8 passing courses covering all required courses. Missing: ${missingRequired.join(", ") || "none"}.`,
      );
    }
    const application: GraduationApplication = {
      id: createId(),
      studentEmail: target,
      submittedAt: new Date().toISOString(),
      status: "pending",
      passingCompletionsAtSubmission: passingCourses.length,
      passingCoursesAtSubmission: passingCourses,
    };
    writeAll([application, ...readAll()]);

    // Future Supabase handoff:
    // insert into a `graduation_applications` table with the snapshot embedded.
    return application;
  },

  submitDemoQualifiedApplication(email: string): GraduationApplication {
    const target = normalize(email);
    const existing = localGraduationRepository.findActivePendingForStudent(target);
    if (existing) return existing;

    const passingCourses = REQUIRED_GRADUATION_COURSE_IDS.map((courseId) => {
      const course = localCourseRepository.get(courseId);
      return {
        id: courseId,
        name: course?.name ?? courseId,
        grade: "A",
        semester: "Demo Qualification",
        credits: course?.credits ?? 3,
      };
    });

    const application: GraduationApplication = {
      id: createId(),
      studentEmail: target,
      submittedAt: new Date().toISOString(),
      status: "pending",
      passingCompletionsAtSubmission: GRADUATION_THRESHOLD,
      passingCoursesAtSubmission: passingCourses,
      registrarNote: "DEMO PURPOSES ONLY: graduation qualification was auto-filled for presentation.",
    };
    writeAll([application, ...readAll()]);
    return application;
  },

  approveApplication(input: { applicationId: string; reviewerEmail: string; registrarNote?: string }): GraduationApplication {
    const all = readAll();
    const target = all.find((entry) => entry.id === input.applicationId);
    if (!target) throw new Error("Graduation application not found.");
    if (target.status !== "pending") throw new Error("Application has already been decided.");
    const note = input.registrarNote?.trim();
    const missingRequired = getMissingRequiredCourses(target.passingCoursesAtSubmission);
    if (target.passingCompletionsAtSubmission !== GRADUATION_THRESHOLD || missingRequired.length > 0) {
      throw new Error(
        `Graduation requires exactly ${GRADUATION_THRESHOLD} passing required courses. Missing: ${missingRequired.join(", ") || "none"}.`,
      );
    }

    const reviewed: GraduationApplication = {
      ...target,
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewedBy: normalize(input.reviewerEmail),
      registrarNote: note || target.registrarNote,
    };
    writeAll(all.map((entry) => (entry.id === target.id ? reviewed : entry)));
    localPhaseStateRepository.markGraduated(target.studentEmail);
    localCollegeRepository.archiveGraduatedStudent(target.studentEmail);
    localAuthRepository.removeStudentCredential(target.studentEmail);
    return reviewed;
  },

  rejectApplication(input: { applicationId: string; reviewerEmail: string; registrarNote: string }): GraduationApplication {
    const note = input.registrarNote.trim();
    if (!note) throw new Error("A rejection reason is required.");

    const all = readAll();
    const target = all.find((entry) => entry.id === input.applicationId);
    if (!target) throw new Error("Graduation application not found.");
    if (target.status !== "pending") throw new Error("Application has already been decided.");

    const reviewed: GraduationApplication = {
      ...target,
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedBy: normalize(input.reviewerEmail),
      registrarNote: note,
    };
    writeAll(all.map((entry) => (entry.id === target.id ? reviewed : entry)));
    localWarningsRepository.issue({
      subjectId: target.studentEmail,
      subjectRole: "student",
      severity: 1,
      reason: note,
      source: "manual:graduation-reckless",
    });
    return reviewed;
  },

  subscribe(callback: () => void) {
    if (!hasBrowserStorage()) return () => {};
    window.addEventListener(CHANGE_EVENT, callback);
    return () => window.removeEventListener(CHANGE_EVENT, callback);
  },
};
