import { courses as seedCourses } from "../data/mockData";
import type { CourseSchedule } from "../domain/schedule";

export interface CourseState {
  id: string;
  name: string;
  instructor: string;
  schedule: CourseSchedule;
  seats: number;
  enrolledStudentIds: string[];
  waitlistStudentIds: string[];
  rating: number;
  credits: number;
  cancelled: boolean;
  cancelReason?: string;
}

export type CourseEditableFields = Pick<CourseState, "name" | "instructor" | "schedule" | "seats">;
export type CourseEnrollOutcome = "enrolled" | "waitlisted";

const STORAGE_KEY = "college0.courses.v2";
const CHANGE_EVENT = "college0:courses:changed";

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const seededSchedules: Record<string, CourseSchedule> = {
  CS101:   { days: ["Mon", "Wed"], startMinutes: 9 * 60,      endMinutes: 10 * 60 + 30 },
  CS201:   { days: ["Tue", "Thu"], startMinutes: 10 * 60,     endMinutes: 11 * 60 + 30 },
  CS301:   { days: ["Mon", "Wed"], startMinutes: 14 * 60,     endMinutes: 15 * 60 + 30 },
  CS302:   { days: ["Tue", "Thu"], startMinutes: 13 * 60,     endMinutes: 14 * 60 + 30 },
  CS401:   { days: ["Mon", "Wed"], startMinutes: 10 * 60,     endMinutes: 11 * 60 + 30 },
  CS402:   { days: ["Tue", "Thu"], startMinutes: 14 * 60,     endMinutes: 15 * 60 + 30 },
  MATH201: { days: ["Mon", "Wed"], startMinutes: 11 * 60,     endMinutes: 12 * 60 + 30 },
  MATH301: { days: ["Tue", "Thu"], startMinutes: 9 * 60,      endMinutes: 10 * 60 + 30 },
  ENG101:  { days: ["Mon", "Wed"], startMinutes: 13 * 60,     endMinutes: 14 * 60 + 30 },
  BUS201:  { days: ["Tue", "Thu"], startMinutes: 15 * 60,     endMinutes: 16 * 60 + 30 },
};

const fallbackSchedule: CourseSchedule = { days: ["Mon"], startMinutes: 9 * 60, endMinutes: 10 * 60 };

const seededCourseStates: CourseState[] = seedCourses.map((course) => ({
  id: course.id,
  name: course.name,
  instructor: course.instructor,
  schedule: seededSchedules[course.id] ?? fallbackSchedule,
  seats: course.seats,
  enrolledStudentIds: [],
  waitlistStudentIds: [],
  rating: course.rating,
  credits: course.credits,
  cancelled: false,
}));

function ensureSeeded() {
  if (!hasBrowserStorage()) return;

  const stored = readJson<CourseState[] | null>(STORAGE_KEY, null);
  if (!stored) {
    writeJson(STORAGE_KEY, seededCourseStates);
    return;
  }

  const storedIds = new Set(stored.map((entry) => entry.id));
  const missing = seededCourseStates.filter((entry) => !storedIds.has(entry.id));
  if (missing.length > 0) {
    writeJson(STORAGE_KEY, [...stored, ...missing]);
  }
}

function readAll(): CourseState[] {
  ensureSeeded();
  return readJson<CourseState[]>(STORAGE_KEY, seededCourseStates);
}

function writeAll(courses: CourseState[]) {
  writeJson(STORAGE_KEY, courses);
  if (hasBrowserStorage()) {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

function mutate(courseId: string, mutator: (course: CourseState) => CourseState) {
  const all = readAll();
  const target = all.find((entry) => entry.id === courseId);
  if (!target) throw new Error(`Course ${courseId} not found.`);
  const next = mutator(target);
  writeAll(all.map((entry) => (entry.id === courseId ? next : entry)));
  return next;
}

export const localCourseRepository = {
  list(): CourseState[] {
    return readAll();
  },

  get(courseId: string): CourseState | undefined {
    return readAll().find((entry) => entry.id === courseId);
  },

  update(courseId: string, partial: Partial<CourseEditableFields>) {
    return mutate(courseId, (course) => ({ ...course, ...partial }));
  },

  setRating(courseId: string, rating: number) {
    return mutate(courseId, (course) => ({ ...course, rating }));
  },

  add(course: Omit<CourseState, "enrolledStudentIds" | "waitlistStudentIds" | "cancelled" | "cancelReason">) {
    const all = readAll();
    if (all.some((entry) => entry.id === course.id)) {
      throw new Error(`Course ${course.id} already exists.`);
    }
    const nextCourse: CourseState = {
      ...course,
      enrolledStudentIds: [],
      waitlistStudentIds: [],
      cancelled: false,
    };
    writeAll([...all, nextCourse]);

    // Future Supabase handoff:
    // insert into a `courses` table; class setup edits flow to the same row.
    return nextCourse;
  },

  enroll(courseId: string, studentEmail: string): { status: CourseEnrollOutcome; course: CourseState } {
    const email = normalizeEmail(studentEmail);
    let outcome: CourseEnrollOutcome = "enrolled";
    const next = mutate(courseId, (course) => {
      if (course.cancelled) {
        throw new Error(`Course ${courseId} is cancelled.`);
      }
      if (course.enrolledStudentIds.includes(email) || course.waitlistStudentIds.includes(email)) {
        throw new Error(`Student is already on the roster for ${courseId}.`);
      }
      if (course.enrolledStudentIds.length < course.seats) {
        return { ...course, enrolledStudentIds: [...course.enrolledStudentIds, email] };
      }
      outcome = "waitlisted";
      return { ...course, waitlistStudentIds: [...course.waitlistStudentIds, email] };
    });
    return { status: outcome, course: next };
  },

  drop(courseId: string, studentEmail: string) {
    const email = normalizeEmail(studentEmail);
    return mutate(courseId, (course) => ({
      ...course,
      enrolledStudentIds: course.enrolledStudentIds.filter((id) => id !== email),
      waitlistStudentIds: course.waitlistStudentIds.filter((id) => id !== email),
    }));
  },

  admitFromWaitlist(courseId: string, studentEmail: string) {
    const email = normalizeEmail(studentEmail);
    return mutate(courseId, (course) => {
      if (!course.waitlistStudentIds.includes(email)) {
        throw new Error(`Student is not on the waitlist for ${courseId}.`);
      }
      if (course.enrolledStudentIds.length >= course.seats) {
        throw new Error(`No seats available in ${courseId}.`);
      }
      return {
        ...course,
        enrolledStudentIds: [...course.enrolledStudentIds, email],
        waitlistStudentIds: course.waitlistStudentIds.filter((id) => id !== email),
      };
    });
  },

  markCancelled(courseId: string, reason: string) {
    return mutate(courseId, (course) => ({
      ...course,
      cancelled: true,
      cancelReason: reason,
    }));
  },

  uncancel(courseId: string) {
    return mutate(courseId, (course) => ({
      ...course,
      cancelled: false,
      cancelReason: undefined,
    }));
  },

  subscribe(callback: () => void) {
    if (!hasBrowserStorage()) return () => {};
    window.addEventListener(CHANGE_EVENT, callback);
    return () => window.removeEventListener(CHANGE_EVENT, callback);
  },

  listEnrollmentsForStudent(studentEmail: string): CourseState[] {
    const email = normalizeEmail(studentEmail);
    return readAll().filter((course) => course.enrolledStudentIds.includes(email));
  },

  listWaitlistedForStudent(studentEmail: string): CourseState[] {
    const email = normalizeEmail(studentEmail);
    return readAll().filter((course) => course.waitlistStudentIds.includes(email));
  },

  listCoursesForInstructor(instructorName: string): CourseState[] {
    return readAll().filter((course) => course.instructor === instructorName);
  },

  // Future Supabase handoff:
  // back this with a `courses` table and a `course_enrollments` join table; cancellation,
  // waitlist promotion, and class-setup edits all flow through the same persistence layer.
};
