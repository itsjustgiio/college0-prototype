import { completedCourses, courses, enrolledCourses, students } from "../data/mockData";
import { localCourseRepository } from "./localCourseRepository";

export interface StudentAcademicProfile {
  id: number | string;
  name: string;
  email: string;
  gpa: number;
  status: string;
  coursesCompleted: number;
  warnings: number;
}

export interface StudentCourseSnapshot {
  enrolledCourses: typeof enrolledCourses;
  completedCourses: typeof completedCourses;
  waitlistedCourses?: typeof enrolledCourses;
}

export interface InstructorRosterEntry {
  id: number;
  name: string;
  course: string;
  grade: string;
  attendance: number;
  status: string;
}

export interface InstructorWaitlistEntry {
  id: number;
  name: string;
  course: string;
  position: number;
  appliedDate: string;
}

const STORAGE_KEYS = {
  studentProfiles: "college0.academics.studentProfiles",
  studentCourseSnapshots: "college0.academics.studentCourseSnapshots",
  instructorRosters: "college0.academics.instructorRosters",
  instructorWaitlists: "college0.academics.instructorWaitlists",
  instructorAssignments: "college0.academics.instructorAssignments",
} as const;

const seededStudentProfiles: StudentAcademicProfile[] = students;

const seededStudentCourseSnapshots: Record<string, StudentCourseSnapshot> = {
  "john.doe@college0.edu": {
    enrolledCourses,
    completedCourses,
  },
  "jane.smith@college0.edu": {
    enrolledCourses: [
      { ...courses[4], grade: "A", semester: "Spring 2026" },
      { ...courses[5], grade: "A-", semester: "Spring 2026" },
    ],
    completedCourses: [
      { id: "CS201", name: "Data Structures", grade: "A", semester: "Fall 2025", credits: 3 },
      { id: "MATH201", name: "Discrete Mathematics", grade: "A-", semester: "Fall 2025", credits: 3 },
    ],
  },
  "tom.m@college0.edu": {
    enrolledCourses: [
      { ...courses[1], grade: "A-", semester: "Spring 2026" },
      { ...courses[7], grade: "B+", semester: "Spring 2026" },
    ],
    completedCourses: [
      { id: "CS101", name: "Introduction to Programming", grade: "A", semester: "Fall 2025", credits: 3 },
      { id: "ENG101", name: "Technical Writing", grade: "A", semester: "Fall 2025", credits: 3 },
    ],
  },
};

const seededInstructorRosters: Record<string, InstructorRosterEntry[]> = {
  "sarah.johnson@college0.edu": [
    { id: 1, name: "John Doe", course: "CS101", grade: "A", attendance: 95, status: "Good Standing" },
    { id: 2, name: "Jane Smith", course: "CS101", grade: "A-", attendance: 100, status: "Good Standing" },
    { id: 3, name: "Mike Johnson", course: "CS301", grade: "B+", attendance: 85, status: "Warning" },
    { id: 4, name: "Emily Davis", course: "CS101", grade: "A", attendance: 90, status: "Good Standing" },
    { id: 5, name: "Sarah Lee", course: "CS301", grade: "B", attendance: 92, status: "Good Standing" },
  ],
  "michael.chen@college0.edu": [
    { id: 6, name: "Jane Smith", course: "CS201", grade: "A", attendance: 98, status: "Good Standing" },
    { id: 7, name: "Tom Martinez", course: "CS201", grade: "A-", attendance: 94, status: "Good Standing" },
    { id: 8, name: "Anna Taylor", course: "CS402", grade: "B+", attendance: 91, status: "Good Standing" },
  ],
};

const seededInstructorWaitlists: Record<string, InstructorWaitlistEntry[]> = {
  "sarah.johnson@college0.edu": [
    { id: 1, name: "Chris Wilson", course: "CS301", position: 1, appliedDate: "2026-04-20" },
    { id: 2, name: "Lisa Anderson", course: "CS301", position: 2, appliedDate: "2026-04-21" },
    { id: 3, name: "Tom Martinez", course: "CS301", position: 3, appliedDate: "2026-04-22" },
  ],
  "michael.chen@college0.edu": [
    { id: 4, name: "Emily Davis", course: "CS201", position: 1, appliedDate: "2026-04-23" },
  ],
};

const seededInstructorAssignments: Record<string, string[]> = {
  "sarah.johnson@college0.edu": ["CS101", "CS301"],
  "michael.chen@college0.edu": ["CS201", "CS402"],
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

function ensureSeededAcademicData() {
  if (!hasBrowserStorage()) return;

  if (!window.localStorage.getItem(STORAGE_KEYS.studentProfiles)) {
    writeJson(STORAGE_KEYS.studentProfiles, seededStudentProfiles);
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.studentCourseSnapshots)) {
    writeJson(STORAGE_KEYS.studentCourseSnapshots, seededStudentCourseSnapshots);
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.instructorRosters)) {
    writeJson(STORAGE_KEYS.instructorRosters, seededInstructorRosters);
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.instructorWaitlists)) {
    writeJson(STORAGE_KEYS.instructorWaitlists, seededInstructorWaitlists);
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.instructorAssignments)) {
    writeJson(STORAGE_KEYS.instructorAssignments, seededInstructorAssignments);
  }
}

function fallbackStudentProfile(input: { name: string; email: string }): StudentAcademicProfile {
  return {
    id: input.email,
    name: input.name,
    email: input.email,
    gpa: 0,
    status: "New Student",
    coursesCompleted: 0,
    warnings: 0,
  };
}

function gradeToPoints(grade: string) {
  const points: Record<string, number> = {
    A: 4,
    "A-": 3.7,
    "B+": 3.3,
    B: 3,
    "B-": 2.7,
    "C+": 2.3,
    C: 2,
    "C-": 1.7,
    D: 1,
    F: 0,
  };

  return points[grade] ?? 0;
}

export const localCollegeRepository = {
  getStudentProfile(input: { name: string; email: string }) {
    ensureSeededAcademicData();
    const profiles = readJson<StudentAcademicProfile[]>(STORAGE_KEYS.studentProfiles, seededStudentProfiles);
    return profiles.find((student) => student.email === input.email) ?? fallbackStudentProfile(input);
  },

  getStudentCourseSnapshot(email: string): StudentCourseSnapshot {
    ensureSeededAcademicData();
    const snapshots = readJson<Record<string, StudentCourseSnapshot>>(
      STORAGE_KEYS.studentCourseSnapshots,
      seededStudentCourseSnapshots,
    );

    return snapshots[email] ?? {
      enrolledCourses: [],
      completedCourses: [],
      waitlistedCourses: [],
    };
  },

  saveStudentRegistration(input: {
    email: string;
    selectedCourses: Array<{
      id: string;
      name: string;
      instructor: string;
      time: string;
      credits: number;
      status: "enrolled" | "waitlist";
    }>;
  }) {
    ensureSeededAcademicData();
    const snapshots = readJson<Record<string, StudentCourseSnapshot>>(
      STORAGE_KEYS.studentCourseSnapshots,
      seededStudentCourseSnapshots,
    );
    const existingSnapshot = snapshots[input.email] ?? {
      enrolledCourses: [],
      completedCourses: [],
      waitlistedCourses: [],
    };

    const nextSnapshot: StudentCourseSnapshot = {
      ...existingSnapshot,
      enrolledCourses: input.selectedCourses
        .filter((course) => course.status === "enrolled")
        .map((course) => ({
          ...course,
          grade: "In Progress",
          semester: "Spring 2026",
        })),
      waitlistedCourses: input.selectedCourses
        .filter((course) => course.status === "waitlist")
        .map((course) => ({
          ...course,
          grade: "Waitlist",
          semester: "Spring 2026",
        })),
    };

    writeJson(STORAGE_KEYS.studentCourseSnapshots, {
      ...snapshots,
      [input.email]: nextSnapshot,
    });

    return nextSnapshot;
  },

  getStudentGpaBreakdown(email: string) {
    const snapshot = this.getStudentCourseSnapshot(email);
    const completed = snapshot.completedCourses.map((course) => ({
      ...course,
      gradePoints: gradeToPoints(course.grade),
      weightedPoints: gradeToPoints(course.grade) * course.credits,
    }));
    const totalCredits = completed.reduce((sum, course) => sum + course.credits, 0);
    const totalWeightedPoints = completed.reduce((sum, course) => sum + course.weightedPoints, 0);
    const computedGpa = totalCredits ? totalWeightedPoints / totalCredits : 0;
    const biggestGpaDrags = [...completed].sort((a, b) => a.gradePoints - b.gradePoints).slice(0, 3);

    return { completed, computedGpa, biggestGpaDrags };
  },

  getInstructorCourses(input: { email: string; name: string }) {
    ensureSeededAcademicData();
    const assignments = readJson<Record<string, string[]>>(
      STORAGE_KEYS.instructorAssignments,
      seededInstructorAssignments,
    );
    const assignedCourseIds = assignments[input.email];
    const catalog = localCourseRepository.list();

    if (assignedCourseIds !== undefined) {
      return catalog.filter((course) => assignedCourseIds.includes(course.id));
    }

    return catalog.filter((course) => course.instructor === input.name);
  },

  getInstructorRoster(email: string) {
    ensureSeededAcademicData();
    const rosters = readJson<Record<string, InstructorRosterEntry[]>>(
      STORAGE_KEYS.instructorRosters,
      seededInstructorRosters,
    );
    return rosters[email] ?? [];
  },

  getInstructorWaitlist(email: string) {
    ensureSeededAcademicData();
    const waitlists = readJson<Record<string, InstructorWaitlistEntry[]>>(
      STORAGE_KEYS.instructorWaitlists,
      seededInstructorWaitlists,
    );
    return waitlists[email] ?? [];
  },

  upsertAcceptedStudentProfile(input: {
    id: string;
    name: string;
    email: string;
    gpa: number;
  }) {
    ensureSeededAcademicData();
    const profiles = readJson<StudentAcademicProfile[]>(STORAGE_KEYS.studentProfiles, seededStudentProfiles);
    const nextProfile: StudentAcademicProfile = {
      id: input.id,
      name: input.name,
      email: input.email,
      gpa: input.gpa,
      status: "New Student",
      coursesCompleted: 0,
      warnings: 0,
    };

    const nextProfiles = [nextProfile, ...profiles.filter((profile) => profile.email !== input.email)];
    writeJson(STORAGE_KEYS.studentProfiles, nextProfiles);

    const snapshots = readJson<Record<string, StudentCourseSnapshot>>(
      STORAGE_KEYS.studentCourseSnapshots,
      seededStudentCourseSnapshots,
    );
    writeJson(STORAGE_KEYS.studentCourseSnapshots, {
      ...snapshots,
      [input.email]: snapshots[input.email] ?? {
        enrolledCourses: [],
        completedCourses: [],
      },
    });

    // Future Supabase handoff:
    // replace this with creation of a student profile row and initial academic snapshot records.
    return nextProfile;
  },

  removeAcceptedStudentProfile(email: string) {
    ensureSeededAcademicData();
    const normalizedEmail = email.trim().toLowerCase();
    const profiles = readJson<StudentAcademicProfile[]>(STORAGE_KEYS.studentProfiles, seededStudentProfiles);
    const nextProfiles = profiles.filter((profile) => profile.email.toLowerCase() !== normalizedEmail);
    writeJson(STORAGE_KEYS.studentProfiles, nextProfiles);

    const snapshots = readJson<Record<string, StudentCourseSnapshot>>(
      STORAGE_KEYS.studentCourseSnapshots,
      seededStudentCourseSnapshots,
    );
    const nextSnapshots = { ...snapshots };
    delete nextSnapshots[normalizedEmail];
    writeJson(STORAGE_KEYS.studentCourseSnapshots, nextSnapshots);

    // Future Supabase handoff:
    // delete the student profile and any seeded snapshots when an approval is reversed.
  },

  archiveGraduatedStudent(email: string) {
    localCollegeRepository.removeAcceptedStudentProfile(email);

    // Future Supabase handoff:
    // mark the student profile archived/graduated and remove it from active roster queries.
  },

  upsertInstructorAssignments(input: {
    email: string;
    assignedCourseIds: string[];
  }) {
    ensureSeededAcademicData();
    const assignments = readJson<Record<string, string[]>>(
      STORAGE_KEYS.instructorAssignments,
      seededInstructorAssignments,
    );
    writeJson(STORAGE_KEYS.instructorAssignments, {
      ...assignments,
      [input.email]: input.assignedCourseIds,
    });

    // Future Supabase handoff:
    // replace this with insert/update operations for instructor-course assignments.
    return input.assignedCourseIds;
  },

  removeInstructorAssignments(email: string) {
    ensureSeededAcademicData();
    const normalizedEmail = email.trim().toLowerCase();
    const assignments = readJson<Record<string, string[]>>(
      STORAGE_KEYS.instructorAssignments,
      seededInstructorAssignments,
    );
    const nextAssignments = { ...assignments };
    delete nextAssignments[normalizedEmail];
    writeJson(STORAGE_KEYS.instructorAssignments, nextAssignments);

    // Future Supabase handoff:
    // delete instructor-course assignment rows when an approval is reversed.
  },

  // Future Supabase handoff:
  // replace these local profile/snapshot lookups with database-backed queries keyed by authenticated user id.
};
