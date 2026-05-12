import type {
  InstructorApplication,
  ProgramAdmissionSettings,
  StudentApplication,
} from "../domain/admissions";
import { recommendStudentDecision } from "../domain/admissions";

export const mockAdmissionSettings: ProgramAdmissionSettings = {
  studentQuota: 12,
  activeStudentCount: 10,
};

const studentApplicationsBase = [
  {
    id: "stu-app-001",
    applicantName: "Alex Thompson",
    email: "alex.t@email.com",
    gpa: 3.6,
    submittedAt: "2026-04-15",
    status: "pending" as const,
  },
  {
    id: "stu-app-002",
    applicantName: "Kevin Park",
    email: "kevin.p@email.com",
    gpa: 2.1,
    submittedAt: "2026-04-12",
    status: "pending" as const,
  },
];

export const mockStudentApplications: StudentApplication[] = studentApplicationsBase.map((application) => ({
  ...application,
  recommendedDecision: recommendStudentDecision(application, mockAdmissionSettings),
}));

export const mockInstructorApplications: InstructorApplication[] = [
  {
    id: "inst-app-001",
    applicantName: "Dr. Lena Ortiz",
    email: "lena.ortiz@email.com",
    subjectArea: "Computer Science",
    submittedAt: "2026-04-17",
    status: "pending",
  },
  {
    id: "inst-app-002",
    applicantName: "Prof. Aaron Brooks",
    email: "aaron.brooks@email.com",
    subjectArea: "Technical Writing",
    submittedAt: "2026-04-19",
    status: "pending",
  },
];
