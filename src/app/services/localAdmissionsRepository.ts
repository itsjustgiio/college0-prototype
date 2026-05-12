import type {
  InstructorApplication,
  ProgramAdmissionSettings,
  StudentApplication,
  StudentCredentialIssue,
} from "../domain/admissions";
import {
  isStudentDecisionOverride,
  recommendStudentDecision,
} from "../domain/admissions";
import type { AdmissionsRepository } from "./admissionsRepository";
import {
  mockAdmissionSettings,
  mockInstructorApplications,
  mockStudentApplications,
} from "./mockAdmissionsSeed";
import { localAuthRepository } from "./localAuthRepository";
import { localCollegeRepository } from "./localCollegeRepository";

const STORAGE_KEYS = {
  settings: "college0.admissions.settings",
  studentApplications: "college0.admissions.studentApplications",
  instructorApplications: "college0.admissions.instructorApplications",
  credentials: "college0.admissions.credentials",
} as const;

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

function nowIsoDate() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createStudentId(existingStudentsApproved: number) {
  return `S2026-${String(existingStudentsApproved + 11).padStart(3, "0")}`;
}

function createTemporaryPassword() {
  return `Temp${Math.floor(1000 + Math.random() * 9000)}`;
}

function adjustActiveStudentCount(delta: number) {
  const settings = readSettings();
  const nextSettings: ProgramAdmissionSettings = {
    ...settings,
    activeStudentCount: Math.max(0, settings.activeStudentCount + delta),
  };
  writeJson(STORAGE_KEYS.settings, nextSettings);
  return nextSettings;
}

function issueStudentApproval(application: StudentApplication, approvedCount: number) {
  const studentId = createStudentId(approvedCount);
  const temporaryPassword = createTemporaryPassword();

  const issuedCredentials: StudentCredentialIssue = {
    studentApplicationId: application.id,
    studentId,
    temporaryPassword,
    mustChangePassword: true,
    issuedAt: nowIsoDate(),
  };

  const nextCredentials = [issuedCredentials, ...readCredentials()];
  writeJson(STORAGE_KEYS.credentials, nextCredentials);

  localAuthRepository.upsertAcceptedStudentCredential({
    id: `accepted-${application.id}`,
    name: application.applicantName,
    email: application.email,
    studentId,
    temporaryPassword,
  });

  localCollegeRepository.upsertAcceptedStudentProfile({
    id: studentId,
    name: application.applicantName,
    email: application.email,
    gpa: application.gpa,
  });

  adjustActiveStudentCount(1);

  return issuedCredentials;
}

function revokeStudentApproval(application: StudentApplication) {
  const credentials = readCredentials();
  const nextCredentials = credentials.filter(
    (credential) => credential.studentApplicationId !== application.id,
  );
  writeJson(STORAGE_KEYS.credentials, nextCredentials);

  localAuthRepository.removeStudentCredential(application.email);
  localCollegeRepository.removeAcceptedStudentProfile(application.email);

  adjustActiveStudentCount(-1);
}

function ensureSeededData() {
  if (!hasBrowserStorage()) return;

  if (!window.localStorage.getItem(STORAGE_KEYS.settings)) {
    writeJson(STORAGE_KEYS.settings, mockAdmissionSettings);
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.studentApplications)) {
    writeJson(STORAGE_KEYS.studentApplications, mockStudentApplications);
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.instructorApplications)) {
    writeJson(STORAGE_KEYS.instructorApplications, mockInstructorApplications);
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.credentials)) {
    writeJson<StudentCredentialIssue[]>(STORAGE_KEYS.credentials, []);
  }
}

function readSettings() {
  ensureSeededData();
  return readJson<ProgramAdmissionSettings>(STORAGE_KEYS.settings, mockAdmissionSettings);
}

function readStudentApplications() {
  ensureSeededData();
  return readJson<StudentApplication[]>(STORAGE_KEYS.studentApplications, mockStudentApplications);
}

function readInstructorApplications() {
  ensureSeededData();
  return readJson<InstructorApplication[]>(STORAGE_KEYS.instructorApplications, mockInstructorApplications);
}

function readCredentials() {
  ensureSeededData();
  return readJson<StudentCredentialIssue[]>(STORAGE_KEYS.credentials, []);
}

export const localAdmissionsRepository: AdmissionsRepository = {
  async getSettings() {
    return readSettings();
  },

  async updateSettings(settings) {
    writeJson(STORAGE_KEYS.settings, settings);

    const refreshedApplications = readStudentApplications().map((application) =>
      application.status === "pending"
        ? {
            ...application,
            recommendedDecision: recommendStudentDecision(application, settings),
          }
        : application,
    );
    writeJson(STORAGE_KEYS.studentApplications, refreshedApplications);

    // Future Supabase handoff:
    // persist registrar-managed admissions settings and recompute recommendation fields server-side if desired.
    return settings;
  },

  async listStudentApplications() {
    return readStudentApplications();
  },

  async listInstructorApplications() {
    return readInstructorApplications();
  },

  async findStudentApplicationByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    return readStudentApplications().find((application) => application.email.toLowerCase() === normalizedEmail);
  },

  async findInstructorApplicationByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    return readInstructorApplications().find((application) => application.email.toLowerCase() === normalizedEmail);
  },

  async submitStudentApplication(input) {
    const settings = readSettings();
    const recommendation = recommendStudentDecision(input, settings);
    const autoDecision = recommendation === "accept" ? "approved" : "rejected";

    const baseApplication: StudentApplication = {
      id: createId("stu-app"),
      applicantName: input.applicantName,
      email: input.email,
      gpa: input.gpa,
      submittedAt: nowIsoDate(),
      status: autoDecision,
      recommendedDecision: recommendation,
      registrarDecision: autoDecision,
      reviewedAt: nowIsoDate(),
    };

    let nextApplication = baseApplication;

    if (autoDecision === "approved") {
      const approvedCount = readStudentApplications().filter(
        (entry) => entry.status === "approved",
      ).length;
      const issuedCredentials = issueStudentApproval(baseApplication, approvedCount);
      nextApplication = {
        ...baseApplication,
        generatedStudentId: issuedCredentials.studentId,
        issuedTemporaryPassword: issuedCredentials.temporaryPassword,
      };
    }

    const nextApplications = [nextApplication, ...readStudentApplications()];
    writeJson(STORAGE_KEYS.studentApplications, nextApplications);

    // Future Supabase handoff:
    // replace this local write with an insert into `student_applications` plus the auto-decision side effects.
    return nextApplication;
  },

  async submitInstructorApplication(input) {
    const nextApplication: InstructorApplication = {
      id: createId("inst-app"),
      applicantName: input.applicantName,
      email: input.email,
      subjectArea: input.subjectArea,
      submittedAt: nowIsoDate(),
      status: "pending",
    };

    const nextApplications = [nextApplication, ...readInstructorApplications()];
    writeJson(STORAGE_KEYS.instructorApplications, nextApplications);

    // Future Supabase handoff:
    // replace this local write with an insert into `instructor_applications`.
    return nextApplication;
  },

  async decideStudentApplication(input) {
    const applications = readStudentApplications();
    const application = applications.find((entry) => entry.id === input.applicationId);

    if (!application) {
      throw new Error("Student application not found.");
    }

    const isOverride = isStudentDecisionOverride(application.recommendedDecision, input.decision);
    if (isOverride && !input.overrideReason?.trim()) {
      throw new Error("Override justification is required.");
    }

    const previousStatus = application.status;
    const reviewedApplication: StudentApplication = {
      ...application,
      status: input.decision,
      registrarDecision: input.decision,
      overrideReason: isOverride ? input.overrideReason?.trim() : undefined,
      reviewedAt: nowIsoDate(),
    };

    let issuedCredentials: StudentCredentialIssue | undefined;

    if (input.decision === "approved" && previousStatus !== "approved") {
      const approvedCount = applications.filter((entry) => entry.status === "approved").length;
      issuedCredentials = issueStudentApproval(reviewedApplication, approvedCount);
      reviewedApplication.generatedStudentId = issuedCredentials.studentId;
      reviewedApplication.issuedTemporaryPassword = issuedCredentials.temporaryPassword;
    } else if (input.decision === "rejected" && previousStatus === "approved") {
      revokeStudentApproval(reviewedApplication);
      reviewedApplication.generatedStudentId = undefined;
      reviewedApplication.issuedTemporaryPassword = undefined;
    }

    const nextApplications = applications.map((entry) =>
      entry.id === reviewedApplication.id ? reviewedApplication : entry,
    );
    writeJson(STORAGE_KEYS.studentApplications, nextApplications);

    // Future Supabase handoff:
    // replace this update with a status update + credential issuance/revocation transaction.
    return { application: reviewedApplication, issuedCredentials };
  },

  async decideInstructorApplication(input) {
    const applications = readInstructorApplications();
    const application = applications.find((entry) => entry.id === input.applicationId);

    if (!application) {
      throw new Error("Instructor application not found.");
    }

    if (input.decision === "approved" && !input.assignedCourseIds?.length) {
      throw new Error("Assign at least one class before approving an instructor.");
    }

    const reviewedApplication: InstructorApplication = {
      ...application,
      status: input.decision,
      registrarDecision: input.decision,
      reviewedAt: nowIsoDate(),
      assignedCourseIds: input.decision === "approved" ? input.assignedCourseIds ?? [] : [],
    };

    const nextApplications = applications.map((entry) =>
      entry.id === reviewedApplication.id ? reviewedApplication : entry,
    );
    writeJson(STORAGE_KEYS.instructorApplications, nextApplications);

    if (input.decision === "approved") {
      const temporaryPassword = createTemporaryPassword();
      reviewedApplication.issuedTemporaryPassword = temporaryPassword;
      localAuthRepository.upsertAcceptedInstructorCredential({
        id: `accepted-${reviewedApplication.id}`,
        name: reviewedApplication.applicantName,
        email: reviewedApplication.email,
        temporaryPassword,
      });
      localCollegeRepository.upsertInstructorAssignments({
        email: reviewedApplication.email,
        assignedCourseIds: reviewedApplication.assignedCourseIds ?? [],
      });

      return {
        application: reviewedApplication,
        issuedCredentials: {
          email: reviewedApplication.email,
          temporaryPassword,
        },
      };
    }

    // Future Supabase handoff:
    // update `instructor_applications` and create class assignments for approved instructors.
    return {
      application: reviewedApplication,
    };
  },
};
