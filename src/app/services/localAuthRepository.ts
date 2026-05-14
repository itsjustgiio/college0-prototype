import type { AuthCredentialRecord, AuthUser, UserRole } from "../auth/authTypes";
import { courses, students } from "../data/mockData";
import { deriveInstructorEmail } from "../domain/instructor";

const STORAGE_KEYS = {
  credentials: "college0.auth.credentials",
  session: "college0.auth.session",
  removedCredentials: "college0.auth.removedCredentials",
} as const;

const seededCredentials: AuthCredentialRecord[] = [
  // Temporary demo accounts for feature testing.
  // Remove or replace this seeded block once real account provisioning is wired.
  ...students.map((student) => ({
    id: `student-${student.id}`,
    name: student.name,
    email: student.email,
    role: "student" as const,
    studentId: `S2026-${String(student.id).padStart(3, "0")}`,
    password: "student123",
    mustChangePassword: false,
    needsStudentTutorial: false,
  })),
  ...Array.from(new Set(courses.map((course) => course.instructor))).map((instructorName, index) => ({
    id: `instructor-${index + 1}`,
    name: instructorName,
    email: deriveInstructorEmail(instructorName),
    role: "instructor" as const,
    password: "faculty123",
    mustChangePassword: false,
  })),
  {
    id: "registrar-admin",
    name: "Admin User",
    email: "admin@college0.edu",
    role: "registrar",
    password: "registrar123",
    mustChangePassword: false,
  },
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

function ensureSeededCredentials() {
  if (!hasBrowserStorage()) return;

  const stored = readJson<AuthCredentialRecord[] | null>(STORAGE_KEYS.credentials, null);
  const removedEmails = new Set(readJson<string[]>(STORAGE_KEYS.removedCredentials, []));
  if (!stored) {
    writeJson(
      STORAGE_KEYS.credentials,
      seededCredentials.filter((credential) => !removedEmails.has(credential.email.toLowerCase())),
    );
    return;
  }

  const storedEmails = new Set(stored.map((credential) => credential.email.toLowerCase()));
  const missing = seededCredentials.filter(
    (credential) =>
      !storedEmails.has(credential.email.toLowerCase()) &&
      !removedEmails.has(credential.email.toLowerCase()),
  );

  if (missing.length > 0) {
    writeJson(STORAGE_KEYS.credentials, [...stored, ...missing]);
  }
}

function toSessionUser(record: AuthCredentialRecord): AuthUser {
  const { password: _password, ...user } = record;
  return user;
}

function readCredentials() {
  ensureSeededCredentials();
  return readJson<AuthCredentialRecord[]>(STORAGE_KEYS.credentials, seededCredentials);
}

export const localAuthRepository = {
  listInstructorCredentials() {
    return readCredentials()
      .filter((credential) => credential.role === "instructor")
      .map(({ password: _password, ...credential }) => credential)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getSession() {
    return readJson<AuthUser | null>(STORAGE_KEYS.session, null);
  },

  signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const record = readCredentials().find(
      (credential) =>
        credential.email.toLowerCase() === normalizedEmail && credential.password === password,
    );

    if (!record) {
      throw new Error("Invalid email or password.");
    }

    const session = toSessionUser(record);
    writeJson(STORAGE_KEYS.session, session);

    // Future Supabase handoff:
    // replace this local lookup with Supabase Auth sign-in and session management.
    return session;
  },

  signOut() {
    if (!hasBrowserStorage()) return;
    window.localStorage.removeItem(STORAGE_KEYS.session);
  },

  clearSessionForEmail(email: string) {
    if (!hasBrowserStorage()) return;
    const normalizedEmail = email.trim().toLowerCase();
    const session = readJson<AuthUser | null>(STORAGE_KEYS.session, null);
    if (session?.email.toLowerCase() === normalizedEmail) {
      window.localStorage.removeItem(STORAGE_KEYS.session);
    }
  },

  changePassword(userId: string, nextPassword: string) {
    const credentials = readCredentials();
    const nextCredentials = credentials.map((credential) =>
      credential.id === userId
        ? {
            ...credential,
            password: nextPassword,
            mustChangePassword: false,
          }
        : credential,
    );

    writeJson(STORAGE_KEYS.credentials, nextCredentials);

    const updatedCredential = nextCredentials.find((credential) => credential.id === userId);
    if (!updatedCredential) {
      throw new Error("User not found.");
    }

    const nextSession = toSessionUser(updatedCredential);
    writeJson(STORAGE_KEYS.session, nextSession);

    // Future Supabase handoff:
    // replace this with a secure password update request and refreshed auth session.
    return nextSession;
  },

  completeStudentTutorial(userId: string) {
    const credentials = readCredentials();
    const nextCredentials = credentials.map((credential) =>
      credential.id === userId
        ? {
            ...credential,
            needsStudentTutorial: false,
          }
        : credential,
    );

    writeJson(STORAGE_KEYS.credentials, nextCredentials);

    const updatedCredential = nextCredentials.find((credential) => credential.id === userId);
    if (!updatedCredential) {
      throw new Error("User not found.");
    }

    const nextSession = toSessionUser(updatedCredential);
    writeJson(STORAGE_KEYS.session, nextSession);
    return nextSession;
  },

  restoreStudentTutorial(userId: string) {
    const credentials = readCredentials();
    const nextCredentials = credentials.map((credential) =>
      credential.id === userId
        ? { ...credential, needsStudentTutorial: true }
        : credential,
    );

    writeJson(STORAGE_KEYS.credentials, nextCredentials);

    const updatedCredential = nextCredentials.find((credential) => credential.id === userId);
    if (!updatedCredential) {
      throw new Error("User not found.");
    }

    const nextSession = toSessionUser(updatedCredential);
    writeJson(STORAGE_KEYS.session, nextSession);
    return nextSession;
  },

  upsertAcceptedStudentCredential(input: {
    id: string;
    name: string;
    email: string;
    studentId: string;
    temporaryPassword: string;
  }) {
    const credentials = readCredentials();
    const normalizedEmail = input.email.trim().toLowerCase();
    const removedEmails = readJson<string[]>(STORAGE_KEYS.removedCredentials, []);
    const nextRecord: AuthCredentialRecord = {
      id: input.id,
      name: input.name,
      email: normalizedEmail,
      role: "student",
      studentId: input.studentId,
      password: input.temporaryPassword,
      mustChangePassword: true,
      needsStudentTutorial: true,
    };

    const nextCredentials = [
      nextRecord,
      ...credentials.filter((credential) => credential.email.toLowerCase() !== normalizedEmail),
    ];
    writeJson(STORAGE_KEYS.credentials, nextCredentials);
    writeJson(
      STORAGE_KEYS.removedCredentials,
      removedEmails.filter((email) => email !== normalizedEmail),
    );

    // Future Supabase handoff:
    // create a real auth account here once approvals are backed by the database.
    return nextRecord;
  },

  removeStudentCredential(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const credentials = readCredentials();
    const removedEmails = readJson<string[]>(STORAGE_KEYS.removedCredentials, []);
    const nextCredentials = credentials.filter(
      (credential) => credential.email.toLowerCase() !== normalizedEmail,
    );
    writeJson(STORAGE_KEYS.credentials, nextCredentials);
    writeJson(STORAGE_KEYS.removedCredentials, Array.from(new Set([...removedEmails, normalizedEmail])));
    localAuthRepository.clearSessionForEmail(normalizedEmail);

    // Future Supabase handoff:
    // disable or delete the auth account when an approval is reversed.
  },

  upsertAcceptedInstructorCredential(input: {
    id: string;
    name: string;
    email: string;
    temporaryPassword: string;
  }) {
    const credentials = readCredentials();
    const nextRecord: AuthCredentialRecord = {
      id: input.id,
      name: input.name,
      email: input.email,
      role: "instructor",
      password: input.temporaryPassword,
      mustChangePassword: true,
    };

    const nextCredentials = [
      nextRecord,
      ...credentials.filter((credential) => credential.email !== input.email),
    ];
    writeJson(STORAGE_KEYS.credentials, nextCredentials);

    // Future Supabase handoff:
    // create a real instructor auth account here once approvals are backed by the database.
    return nextRecord;
  },

  removeInstructorCredential(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const credentials = readCredentials();
    const nextCredentials = credentials.filter(
      (credential) =>
        credential.role !== "instructor" ||
        credential.email.toLowerCase() !== normalizedEmail,
    );
    writeJson(STORAGE_KEYS.credentials, nextCredentials);
    localAuthRepository.clearSessionForEmail(normalizedEmail);

    // Future Supabase handoff:
    // disable or delete the instructor auth account if an approval is reversed.
  },

  getRoleHome(role: UserRole) {
    return `/${role}`;
  },
};
