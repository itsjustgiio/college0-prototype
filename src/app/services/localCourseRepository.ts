import { courses as seedCourses, students as seedStudents } from "../data/mockData";
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
const DEMO_ENROLLMENT_KEY = "college0.courses.demoEnrollment.v2";
const demoEnrollmentEmails = [
  ...seedStudents.map((student) => student.email.toLowerCase()).filter((email) => email !== "john.doe@college0.edu"),
  "demo.full.01@college0.edu",
  "demo.full.02@college0.edu",
  "demo.full.03@college0.edu",
  "demo.full.04@college0.edu",
  "demo.full.05@college0.edu",
  "demo.full.06@college0.edu",
  "demo.full.07@college0.edu",
  "demo.full.08@college0.edu",
  "demo.full.09@college0.edu",
  "demo.full.10@college0.edu",
];

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
  seats: course.id === "CS201" ? 2 : course.seats,
  enrolledStudentIds:
    course.id === "BUS201"
      ? ["mike.j@college0.edu", "lisa.a@college0.edu"]
      : course.id === "CS201"
        ? ["mike.j@college0.edu", "lisa.a@college0.edu"]
        : [],
  waitlistStudentIds: [],
  rating: course.rating,
  credits: course.credits,
  cancelled: false,
}));

const waitlistExamCourse: CourseState = {
  id: "WLE101",
  name: "Waitlist Exam Class",
  instructor: "Dr. Sarah Johnson",
  schedule: { days: ["Tue", "Fri"], startMinutes: 11 * 60, endMinutes: 12 * 60 + 30 },
  seats: 3,
  enrolledStudentIds: [
    "mike.j@college0.edu",
    "lisa.a@college0.edu",
    "tom.m@college0.edu",
  ],
  waitlistStudentIds: [
    "jane.smith@college0.edu",
    "emily.d@college0.edu",
  ],
  rating: 0,
  credits: 3,
  cancelled: false,
};

const demoSeedCourseStates = [...seededCourseStates, waitlistExamCourse];

function applyDemoEnrollmentDefaults(courses: CourseState[]) {
  return courses.map((course) => {
    if (course.id === "BUS201") {
      return {
        ...course,
        enrolledStudentIds: ["mike.j@college0.edu", "lisa.a@college0.edu"],
        waitlistStudentIds: [],
        cancelled: false,
        cancelReason: undefined,
      };
    }

    if (course.id === "CS201") {
      return {
        ...course,
        seats: 2,
        enrolledStudentIds: ["mike.j@college0.edu", "lisa.a@college0.edu"],
        waitlistStudentIds: [],
        cancelled: false,
        cancelReason: undefined,
      };
    }

    return course;
  });
}

function ensureSeeded() {
  if (!hasBrowserStorage()) return;

  const stored = readJson<CourseState[] | null>(STORAGE_KEY, null);
  if (!stored) {
    writeJson(STORAGE_KEY, demoSeedCourseStates);
    window.localStorage.setItem(DEMO_ENROLLMENT_KEY, "true");
    return;
  }

  const storedIds = new Set(stored.map((entry) => entry.id));
  const missing = demoSeedCourseStates.filter((entry) => !storedIds.has(entry.id));
  let nextCourses = missing.length > 0 ? [...stored, ...missing] : stored;

  if (!window.localStorage.getItem(DEMO_ENROLLMENT_KEY)) {
    nextCourses = applyDemoEnrollmentDefaults(nextCourses);
    window.localStorage.setItem(DEMO_ENROLLMENT_KEY, "true");
  }

  if (missing.length > 0 || nextCourses !== stored) {
    writeJson(STORAGE_KEY, nextCourses);
  }
}

function readAll(): CourseState[] {
  ensureSeeded();
  return readJson<CourseState[]>(STORAGE_KEY, demoSeedCourseStates);
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

  fillToCapacityForDemo(courseId: string) {
    return mutate(courseId, (course) => {
      const existing = new Set(course.enrolledStudentIds.map(normalizeEmail));
      const needed = Math.max(0, course.seats - existing.size);
      const fillers = demoEnrollmentEmails
        .filter((email) => !existing.has(email))
        .slice(0, needed);

      return {
        ...course,
        enrolledStudentIds: [...course.enrolledStudentIds, ...fillers],
        waitlistStudentIds: [],
      };
    });
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

  removeFromWaitlist(courseId: string, studentEmail: string) {
    const email = normalizeEmail(studentEmail);
    return mutate(courseId, (course) => {
      if (!course.waitlistStudentIds.includes(email)) {
        throw new Error(`Student is not on the waitlist for ${courseId}.`);
      }
      return {
        ...course,
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
