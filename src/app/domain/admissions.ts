export type ApplicationStatus = "pending" | "approved" | "rejected";

export type StudentAdmissionRecommendation = "accept" | "reject";

export interface StudentApplication {
  id: string;
  applicantName: string;
  email: string;
  gpa: number;
  submittedAt: string;
  status: ApplicationStatus;
  recommendedDecision: StudentAdmissionRecommendation;
  registrarDecision?: "approved" | "rejected";
  overrideReason?: string;
  reviewedAt?: string;
  generatedStudentId?: string;
  issuedTemporaryPassword?: string;
}

export interface InstructorApplication {
  id: string;
  applicantName: string;
  email: string;
  subjectArea: string;
  submittedAt: string;
  status: ApplicationStatus;
  registrarDecision?: "approved" | "rejected";
  reviewedAt?: string;
  assignedCourseIds?: string[];
  issuedTemporaryPassword?: string;
}

export interface ProgramAdmissionSettings {
  studentQuota: number;
  activeStudentCount: number;
}

export interface StudentCredentialIssue {
  studentApplicationId: string;
  studentId: string;
  temporaryPassword: string;
  mustChangePassword: true;
  issuedAt: string;
}

export function recommendStudentDecision(
  application: Pick<StudentApplication, "gpa">,
  settings: ProgramAdmissionSettings,
): StudentAdmissionRecommendation {
  const quotaAvailable = settings.activeStudentCount < settings.studentQuota;
  return application.gpa > 3.0 && quotaAvailable ? "accept" : "reject";
}

export function isStudentDecisionOverride(
  recommendation: StudentAdmissionRecommendation,
  registrarDecision: "approved" | "rejected",
) {
  return (
    (recommendation === "accept" && registrarDecision === "rejected") ||
    (recommendation === "reject" && registrarDecision === "approved")
  );
}
