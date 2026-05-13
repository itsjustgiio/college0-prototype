import { computeGpa, type LetterGrade } from "../domain/grading";
import { localCourseRepository } from "./localCourseRepository";
import { localCollegeRepository } from "./localCollegeRepository";

export const CURRENT_SEMESTER = "Spring 2026";

export interface GradeRecord {
  id: string;
  courseId: string;
  studentEmail: string;
  semester: string;
  grade: LetterGrade;
  enteredAt: string;
  enteredBy: string;
}

const STORAGE_KEY = "college0.grades";
const CHANGE_EVENT = "college0:grades:changed";

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
  return `grade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readAll(): GradeRecord[] {
  return readJson<GradeRecord[]>(STORAGE_KEY, []);
}

function writeAll(records: GradeRecord[]) {
  writeJson(STORAGE_KEY, records);
  if (hasBrowserStorage()) {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

function matches(record: GradeRecord, courseId: string, email: string, semester: string) {
  return (
    record.courseId === courseId &&
    record.studentEmail === normalize(email) &&
    record.semester === semester
  );
}

export const localGradingRepository = {
  setGrade(input: {
    courseId: string;
    studentEmail: string;
    grade: LetterGrade;
    instructorEmail: string;
    semester?: string;
  }) {
    const semester = input.semester ?? CURRENT_SEMESTER;
    const email = normalize(input.studentEmail);
    const all = readAll();
    const existing = all.find((entry) => matches(entry, input.courseId, email, semester));
    const next: GradeRecord = existing
      ? {
          ...existing,
          grade: input.grade,
          enteredAt: new Date().toISOString(),
          enteredBy: normalize(input.instructorEmail),
        }
      : {
          id: createId(),
          courseId: input.courseId,
          studentEmail: email,
          semester,
          grade: input.grade,
          enteredAt: new Date().toISOString(),
          enteredBy: normalize(input.instructorEmail),
        };

    writeAll(existing ? all.map((entry) => (entry.id === existing.id ? next : entry)) : [...all, next]);
    return next;
  },

  clearGrade(input: { courseId: string; studentEmail: string; semester?: string }) {
    const semester = input.semester ?? CURRENT_SEMESTER;
    const email = normalize(input.studentEmail);
    writeAll(readAll().filter((entry) => !matches(entry, input.courseId, email, semester)));
  },

  getGrade(input: { courseId: string; studentEmail: string; semester?: string }): GradeRecord | null {
    const semester = input.semester ?? CURRENT_SEMESTER;
    const email = normalize(input.studentEmail);
    return readAll().find((entry) => matches(entry, input.courseId, email, semester)) ?? null;
  },

  listForCourse(courseId: string, semester: string = CURRENT_SEMESTER): GradeRecord[] {
    return readAll().filter((entry) => entry.courseId === courseId && entry.semester === semester);
  },

  listForStudent(email: string, semester?: string): GradeRecord[] {
    const target = normalize(email);
    return readAll().filter(
      (entry) => entry.studentEmail === target && (!semester || entry.semester === semester),
    );
  },

  getClassGpa(courseId: string, semester: string = CURRENT_SEMESTER): number {
    const course = localCourseRepository.get(courseId);
    if (!course) return 0;
    const records = localGradingRepository.listForCourse(courseId, semester);
    const entries = records.map((record) => ({ grade: record.grade, credits: course.credits }));
    return computeGpa(entries);
  },

  getMissingGradeCount(courseId: string, semester: string = CURRENT_SEMESTER): number {
    const course = localCourseRepository.get(courseId);
    if (!course) return 0;
    const gradedEmails = new Set(
      localGradingRepository.listForCourse(courseId, semester).map((record) => record.studentEmail),
    );
    return course.enrolledStudentIds.filter((email) => !gradedEmails.has(email)).length;
  },

  getStudentSemesterGpa(email: string, semester: string = CURRENT_SEMESTER): number {
    const records = localGradingRepository.listForStudent(email, semester);
    const entries: { grade: string; credits: number }[] = [];
    for (const record of records) {
      const course = localCourseRepository.get(record.courseId);
      if (!course) continue;
      entries.push({ grade: record.grade, credits: course.credits });
    }
    return computeGpa(entries);
  },

  getStudentOverallGpa(email: string): { gpa: number; semestersCount: number } {
    const completed = localCollegeRepository.getStudentCourseSnapshot(email).completedCourses;
    const currentSemesterRecords = localGradingRepository.listForStudent(email, CURRENT_SEMESTER);

    const completedEntries = completed.map((course) => ({ grade: course.grade, credits: course.credits }));
    const currentEntries: { grade: string; credits: number }[] = [];
    for (const record of currentSemesterRecords) {
      const course = localCourseRepository.get(record.courseId);
      if (!course) continue;
      currentEntries.push({ grade: record.grade, credits: course.credits });
    }

    const semesters = new Set<string>();
    completed.forEach((entry) => semesters.add(entry.semester));
    if (currentSemesterRecords.length > 0) semesters.add(CURRENT_SEMESTER);

    return {
      gpa: computeGpa([...completedEntries, ...currentEntries]),
      semestersCount: semesters.size,
    };
  },

  hasFailedSameCourseTwice(email: string): boolean {
    const completed = localCollegeRepository.getStudentCourseSnapshot(email).completedCourses;
    const currentRecords = localGradingRepository.listForStudent(email, CURRENT_SEMESTER);

    const failureCounts = new Map<string, number>();
    for (const entry of completed) {
      if (entry.grade === "F") {
        failureCounts.set(entry.id, (failureCounts.get(entry.id) ?? 0) + 1);
      }
    }
    for (const entry of currentRecords) {
      if (entry.grade === "F") {
        failureCounts.set(entry.courseId, (failureCounts.get(entry.courseId) ?? 0) + 1);
      }
    }

    for (const count of failureCounts.values()) {
      if (count >= 2) return true;
    }
    return false;
  },

  subscribe(callback: () => void) {
    if (!hasBrowserStorage()) return () => {};
    window.addEventListener(CHANGE_EVENT, callback);
    return () => window.removeEventListener(CHANGE_EVENT, callback);
  },

  // Future Supabase handoff:
  // back this with a `grades` table keyed on (course_id, student_email, semester) with audit
  // columns (entered_at, entered_by) and partial indexes for class/student GPA aggregations.
};
