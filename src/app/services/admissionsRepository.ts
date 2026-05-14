import type {
  InstructorApplication,
  ProgramAdmissionSettings,
  StudentApplication,
  StudentCredentialIssue,
} from "../domain/admissions";

export interface AdmissionsRepository {
  getSettings(): Promise<ProgramAdmissionSettings>;
  updateSettings(settings: ProgramAdmissionSettings): Promise<ProgramAdmissionSettings>;
  listStudentApplications(): Promise<StudentApplication[]>;
  listInstructorApplications(): Promise<InstructorApplication[]>;
  findStudentApplicationByEmail(email: string): Promise<StudentApplication | undefined>;
  findInstructorApplicationByEmail(email: string): Promise<InstructorApplication | undefined>;
  submitStudentApplication(
    input: Pick<StudentApplication, "applicantName" | "email" | "gpa">,
  ): Promise<StudentApplication>;
  submitInstructorApplication(
    input: Pick<InstructorApplication, "applicantName" | "email" | "subjectArea">,
  ): Promise<InstructorApplication>;
  decideStudentApplication(input: {
    applicationId: string;
    decision: "approved" | "rejected";
    overrideReason?: string;
  }): Promise<{
    application: StudentApplication;
    issuedCredentials?: StudentCredentialIssue;
  }>;
  decideInstructorApplication(input: {
    applicationId: string;
    decision: "approved" | "rejected";
    assignedCourseIds?: string[];
  }): Promise<{
    application: InstructorApplication;
    issuedCredentials?: {
      email: string;
      temporaryPassword: string;
    };
  }>;
  updateInstructorAssignments(input: {
    applicationId: string;
    assignedCourseIds: string[];
  }): Promise<InstructorApplication>;
}

// Future Supabase implementation can satisfy this contract without changing page components.
