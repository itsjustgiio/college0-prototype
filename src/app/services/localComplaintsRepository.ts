import { complaints as seededComplaints } from "../data/mockData";
import { deriveInstructorEmail } from "../domain/instructor";
import { localCourseRepository } from "./localCourseRepository";
import { localWarningsRepository } from "./localWarningsRepository";

export type ComplaintFiledByRole = "student" | "instructor";
export type ComplaintAgainstRole = "student" | "instructor";
export type ComplaintStatus = "open" | "under_review" | "resolved";
export type ComplaintResolutionAction =
  | "no_action"
  | "warn_target"
  | "warn_reporter"
  | "deregister_student";

export interface ComplaintRecord {
  id: string;
  filedByRole: ComplaintFiledByRole;
  filedByEmail: string;
  filedAgainstRole: ComplaintAgainstRole;
  filedAgainstEmail: string;
  courseId: string;
  type: string;
  details: string;
  status: ComplaintStatus;
  submittedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionAction?: ComplaintResolutionAction;
  resolutionNote?: string;
}

const STORAGE_KEY = "college0.complaints";
const CHANGE_EVENT = "college0:complaints:changed";

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalize(value: string) {
  return value.trim().toLowerCase();
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

function createId() {
  return `complaint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emitChanged() {
  if (hasBrowserStorage()) {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

function seedComplaintRecords(): ComplaintRecord[] {
  return seededComplaints.map((complaint) => {
    const course = localCourseRepository.get(complaint.course);
    return {
      id: `seed-complaint-${complaint.id}`,
      filedByRole: "student",
      filedByEmail: complaint.studentEmail,
      filedAgainstRole: complaint.type === "Instructor Conduct" ? "instructor" : "student",
      filedAgainstEmail:
        complaint.type === "Instructor Conduct"
          ? deriveInstructorEmail(course?.instructor ?? "")
          : "registrar-review@college0.edu",
      courseId: complaint.course,
      type: complaint.type,
      details: complaint.details,
      status:
        complaint.status === "Resolved"
          ? "resolved"
          : complaint.status === "Under Review"
            ? "under_review"
            : "open",
      submittedAt: complaint.date,
      resolvedAt: complaint.status === "Resolved" ? complaint.date : undefined,
      resolutionAction: complaint.status === "Resolved" ? "no_action" : undefined,
      resolutionNote: complaint.status === "Resolved" ? "Seeded resolved complaint." : undefined,
    };
  });
}

function ensureSeeded() {
  if (!hasBrowserStorage()) return;
  if (!window.localStorage.getItem(STORAGE_KEY)) {
    writeJson(STORAGE_KEY, seedComplaintRecords());
  }
}

function readAll(): ComplaintRecord[] {
  ensureSeeded();
  return readJson<ComplaintRecord[]>(STORAGE_KEY, seedComplaintRecords());
}

function writeAll(records: ComplaintRecord[]) {
  writeJson(STORAGE_KEY, records);
  emitChanged();
}

function requireText(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function issueWarningForComplaint(record: ComplaintRecord, subjectEmail: string, subjectRole: ComplaintAgainstRole | ComplaintFiledByRole, note: string) {
  localWarningsRepository.issue({
    subjectId: subjectEmail,
    subjectRole,
    severity: 1,
    reason: `Complaint ${record.id}: ${note}`,
    source: `manual:complaint:${record.id}`,
  });
}

export const localComplaintsRepository = {
  list(): ComplaintRecord[] {
    return [...readAll()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  },

  submit(input: {
    filedByRole: ComplaintFiledByRole;
    filedByEmail: string;
    filedAgainstRole: ComplaintAgainstRole;
    filedAgainstEmail: string;
    courseId: string;
    type: string;
    details: string;
  }): ComplaintRecord {
    const record: ComplaintRecord = {
      id: createId(),
      filedByRole: input.filedByRole,
      filedByEmail: normalize(requireText(input.filedByEmail, "Reporter email")),
      filedAgainstRole: input.filedAgainstRole,
      filedAgainstEmail: normalize(requireText(input.filedAgainstEmail, "Target email")),
      courseId: requireText(input.courseId, "Course"),
      type: requireText(input.type, "Complaint type"),
      details: requireText(input.details, "Details"),
      status: "open",
      submittedAt: new Date().toISOString(),
    };

    writeAll([record, ...readAll()]);
    return record;
  },

  resolve(input: {
    complaintId: string;
    registrarEmail: string;
    action: ComplaintResolutionAction;
    note: string;
  }): ComplaintRecord {
    const note = requireText(input.note, "Resolution note");
    const all = readAll();
    const target = all.find((entry) => entry.id === input.complaintId);
    if (!target) throw new Error("Complaint not found.");
    if (target.status === "resolved") throw new Error("Complaint is already resolved.");

    if (input.action === "warn_target") {
      issueWarningForComplaint(target, target.filedAgainstEmail, target.filedAgainstRole, note);
    } else if (input.action === "warn_reporter") {
      issueWarningForComplaint(target, target.filedByEmail, target.filedByRole, note);
    } else if (input.action === "deregister_student") {
      if (target.filedAgainstRole !== "student") {
        throw new Error("Only a student can be de-registered from a course.");
      }
      localCourseRepository.drop(target.courseId, target.filedAgainstEmail);
      issueWarningForComplaint(target, target.filedAgainstEmail, "student", note);
    }

    const resolved: ComplaintRecord = {
      ...target,
      status: "resolved",
      resolvedAt: new Date().toISOString(),
      resolvedBy: normalize(input.registrarEmail),
      resolutionAction: input.action,
      resolutionNote: note,
    };

    writeAll(all.map((entry) => (entry.id === resolved.id ? resolved : entry)));
    return resolved;
  },

  markUnderReview(complaintId: string): ComplaintRecord {
    const all = readAll();
    const target = all.find((entry) => entry.id === complaintId);
    if (!target) throw new Error("Complaint not found.");
    const next: ComplaintRecord = { ...target, status: "under_review" };
    writeAll(all.map((entry) => (entry.id === complaintId ? next : entry)));
    return next;
  },

  subscribe(callback: () => void) {
    if (!hasBrowserStorage()) return () => {};
    window.addEventListener(CHANGE_EVENT, callback);
    return () => window.removeEventListener(CHANGE_EVENT, callback);
  },
};
