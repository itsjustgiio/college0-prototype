import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle, ClipboardList, FileText, GraduationCap, Lock, MessageSquare, Plus, Save, Settings, ShieldAlert, XCircle } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { students } from "../data/mockData";
import type { InstructorApplication, ProgramAdmissionSettings, StudentApplication } from "../domain/admissions";
import { isStudentDecisionOverride } from "../domain/admissions";
import { localAdmissionsRepository } from "../services/localAdmissionsRepository";
import { useSemesterPhase } from "../hooks/useSemesterPhase";
import { SEMESTER_PHASES, type SemesterPhase } from "../services/localSemesterRepository";
import { localCourseRepository, type CourseEditableFields, type CourseState } from "../services/localCourseRepository";
import { useCourses } from "../hooks/useCourses";
import { useLastTransitionSummary } from "../hooks/usePhaseState";
import { useAllGraduationApplications, usePendingGraduationApplications } from "../hooks/useGraduation";
import { useRegistrarReviews, useTabooWords } from "../hooks/useReviews";
import { useComplaints } from "../hooks/useComplaints";
import { GRADUATION_THRESHOLD, localGraduationRepository } from "../services/localGraduationRepository";
import { localReviewsRepository } from "../services/localReviewsRepository";
import { localComplaintsRepository, type ComplaintRecord, type ComplaintResolutionAction } from "../services/localComplaintsRepository";
import { useAuth } from "../auth/AuthProvider";
import { resolveStudentDisplayName } from "../domain/student";
import {
  WEEKDAYS,
  formatSchedule,
  isValidSchedule,
  minutesToTimeInput,
  parseTimeInputToMinutes,
  type CourseSchedule,
  type DayOfWeek,
} from "../domain/schedule";

const semesterPhaseDates: Record<SemesterPhase, { startDate: string; endDate: string }> = {
  setup: { startDate: "2026-03-15", endDate: "2026-04-14" },
  registration: { startDate: "2026-04-15", endDate: "2026-05-15" },
  running: { startDate: "2026-05-16", endDate: "2026-08-15" },
  grading: { startDate: "2026-08-16", endDate: "2026-08-30" },
};

const studentsAtRisk = students.filter((s) => s.gpa < 2.5 || s.warnings > 0);

function buildPhaseTimeline(activePhase: SemesterPhase) {
  return SEMESTER_PHASES.map((entry) => ({
    id: entry.id,
    phase: entry.label,
    status: entry.id === activePhase ? ("active" as const) : ("upcoming" as const),
    ...semesterPhaseDates[entry.id],
  }));
}

function RegistrarHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-3xl text-slate-950">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export function RegistrarDashboard() {
  const [phase] = useSemesterPhase();
  const semesterPhases = useMemo(() => buildPhaseTimeline(phase), [phase]);
  const courseCatalog = useCourses();
  const complaintRecords = useComplaints();
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      localAdmissionsRepository.listStudentApplications(),
      localAdmissionsRepository.listInstructorApplications(),
    ]).then(([studentApplications, instructorApplications]) => {
      if (!isMounted) return;
      setPendingApplicationsCount(
        [...studentApplications, ...instructorApplications].filter((application) => application.status === "pending").length,
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <RegistrarHeader
        title="Registrar Dashboard"
        description="A snapshot of applications, complaints, semester status, and student risk flags."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Students</p>
            <div className="mt-3 text-4xl text-slate-950">{students.length}</div>
            <div className="mt-2"><Badge variant="info">Active</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Courses</p>
            <div className="mt-3 text-4xl text-slate-950">{courseCatalog.length}</div>
            <div className="mt-2"><Badge variant="success">Spring 2026</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending applications</p>
            <div className="mt-3 text-4xl text-slate-950">{pendingApplicationsCount}</div>
            <div className="mt-2"><Badge variant="warning">Review needed</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Open complaints</p>
            <div className="mt-3 text-4xl text-slate-950">{complaintRecords.filter((c) => c.status !== "resolved").length}</div>
            <div className="mt-2"><Badge variant="danger">Action required</Badge></div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl text-slate-950">Current Semester Phase</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {semesterPhases.map((phase, index) => (
              <div
                key={phase.phase}
                className={`rounded-2xl border px-4 py-4 ${
                  phase.status === "active" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                      phase.status === "active" ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-950">{phase.phase}</div>
                      <div className="mt-1 text-xs text-slate-600">{phase.startDate} to {phase.endDate}</div>
                    </div>
                  </div>
                  <Badge variant={phase.status === "active" ? "info" : "neutral"}>
                    {phase.status === "active" ? "Active" : "Upcoming"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-700" />
              <h2 className="text-xl text-slate-950">Operational Watchlist</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
              <div className="text-sm font-medium text-amber-950">Applications awaiting review</div>
              <div className="mt-1 text-sm text-amber-900">
                {pendingApplicationsCount} applications still need a final decision.
              </div>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
              <div className="text-sm font-medium text-red-950">Student risk flags</div>
              <div className="mt-1 text-sm text-red-900">
                {studentsAtRisk.length} students currently meet at-risk criteria based on GPA or warnings.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-medium text-slate-950">Complaint backlog</div>
              <div className="mt-1 text-sm text-slate-700">
                {complaintRecords.filter((c) => c.status !== "resolved").length} complaints remain unresolved or under review.
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function RegistrarApplicationsPage() {
  const courseCatalog = useCourses();
  const [studentApplications, setStudentApplications] = useState<StudentApplication[]>([]);
  const [instructorApplications, setInstructorApplications] = useState<InstructorApplication[]>([]);
  const [admissionSettings, setAdmissionSettings] = useState<ProgramAdmissionSettings | null>(null);
  const [quotaInput, setQuotaInput] = useState("");
  const [studentOverrideReasons, setStudentOverrideReasons] = useState<Record<string, string>>({});
  const [instructorAssignments, setInstructorAssignments] = useState<Record<string, string[]>>({});
  const [decisionMessage, setDecisionMessage] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [latestIssuedCredentials, setLatestIssuedCredentials] = useState<{
    email: string;
    studentId: string;
    temporaryPassword: string;
  } | null>(null);
  const [latestInstructorCredentials, setLatestInstructorCredentials] = useState<{
    email: string;
    temporaryPassword: string;
    assignedCourseIds: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshApplications = async () => {
    setLoading(true);
    const [nextStudentApplications, nextInstructorApplications] = await Promise.all([
      localAdmissionsRepository.listStudentApplications(),
      localAdmissionsRepository.listInstructorApplications(),
    ]);
    const nextSettings = await localAdmissionsRepository.getSettings();
    setStudentApplications(nextStudentApplications);
    setInstructorApplications(nextInstructorApplications);
    setAdmissionSettings(nextSettings);
    setQuotaInput(String(nextSettings.studentQuota));
    setLoading(false);
  };

  useEffect(() => {
    void refreshApplications();
  }, []);

  const pendingStudentCount = useMemo(
    () => studentApplications.filter((application) => application.status === "pending").length,
    [studentApplications],
  );
  const pendingInstructorCount = useMemo(
    () => instructorApplications.filter((application) => application.status === "pending").length,
    [instructorApplications],
  );

  const decideStudent = async (application: StudentApplication, decision: "approved" | "rejected") => {
    setDecisionMessage("");
    setDecisionError("");

    const overrideReason = studentOverrideReasons[application.id];
    const isOverride = isStudentDecisionOverride(application.recommendedDecision, decision);

    try {
      const result = await localAdmissionsRepository.decideStudentApplication({
        applicationId: application.id,
        decision,
        overrideReason: isOverride ? overrideReason : undefined,
      });
      setDecisionMessage(`Student application ${decision}.`);
      setLatestIssuedCredentials(
        result.issuedCredentials
          ? {
              email: application.email,
              studentId: result.issuedCredentials.studentId,
              temporaryPassword: result.issuedCredentials.temporaryPassword,
            }
          : null,
      );
      await refreshApplications();
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : "Unable to update student application.");
    }
  };

  const decideInstructor = async (application: InstructorApplication, decision: "approved" | "rejected") => {
    setDecisionMessage("");
    setDecisionError("");

    try {
      const result = await localAdmissionsRepository.decideInstructorApplication({
        applicationId: application.id,
        decision,
        assignedCourseIds: instructorAssignments[application.id] ?? [],
      });
      setDecisionMessage(`Instructor application ${decision}.`);
      setLatestInstructorCredentials(
        result.issuedCredentials
          ? {
              email: result.issuedCredentials.email,
              temporaryPassword: result.issuedCredentials.temporaryPassword,
              assignedCourseIds: result.application.assignedCourseIds ?? [],
            }
          : null,
      );
      await refreshApplications();
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : "Unable to update instructor application.");
    }
  };

  const updateQuota = async () => {
    setDecisionMessage("");
    setDecisionError("");

    if (!admissionSettings) return;

    const nextQuota = Number(quotaInput);
    if (!Number.isInteger(nextQuota) || nextQuota < 0) {
      setDecisionError("Quota must be a whole number of zero or more.");
      return;
    }

    await localAdmissionsRepository.updateSettings({
      ...admissionSettings,
      studentQuota: nextQuota,
    });
    setDecisionMessage("Program quota updated.");
    await refreshApplications();
  };

  return (
    <div className="space-y-6">
      <RegistrarHeader
        title="Applications"
        description="Review student and instructor applications, apply the admissions rule, and record decisions."
      />

      {(decisionMessage || decisionError) && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${
          decisionError
            ? "border border-red-200 bg-red-50 text-red-700"
            : "border border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          {decisionError || decisionMessage}
        </div>
      )}

      {latestIssuedCredentials && (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <p className="font-medium text-emerald-900">Accepted student login created</p>
          <p className="mt-2">Email: {latestIssuedCredentials.email}</p>
          <p>Student ID: {latestIssuedCredentials.studentId}</p>
          <p>Temporary password: {latestIssuedCredentials.temporaryPassword}</p>
          <p className="mt-2">The student will be forced to change this password on first login.</p>
        </div>
      )}

      {latestInstructorCredentials && (
        <div className="rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
          <p className="font-medium text-blue-950">Approved instructor login created</p>
          <p className="mt-2">Email: {latestInstructorCredentials.email}</p>
          <p>Temporary password: {latestInstructorCredentials.temporaryPassword}</p>
          <p>Assigned classes: {latestInstructorCredentials.assignedCourseIds.join(", ")}</p>
          <p className="mt-2">The instructor will be forced to change this password on first login.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending student applications</p>
            <div className="mt-3 text-4xl text-slate-950">{pendingStudentCount}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending instructor applications</p>
            <div className="mt-3 text-4xl text-slate-950">{pendingInstructorCount}</div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Student Admission Quota</h2>
          </div>
        </CardHeader>
        <CardBody className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active students</p>
              <p className="mt-2 text-3xl text-slate-950">{admissionSettings?.activeStudentCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Program quota</p>
              <p className="mt-2 text-3xl text-slate-950">{admissionSettings?.studentQuota ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Seats remaining</p>
              <p className="mt-2 text-3xl text-slate-950">
                {Math.max(0, (admissionSettings?.studentQuota ?? 0) - (admissionSettings?.activeStudentCount ?? 0))}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Edit quota</span>
              <input
                type="number"
                min="0"
                value={quotaInput}
                onChange={(event) => setQuotaInput(event.target.value)}
                className="mt-2 w-36 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <Button variant="primary" onClick={updateQuota}>
              Save quota
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Student Applications</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-600">Loading student applications...</p>
          ) : studentApplications.length === 0 ? (
            <p className="text-sm text-slate-600">No student applications yet.</p>
          ) : (
            studentApplications.map((application) => {
              const canApprove = application.status !== "approved";
              const canReject = application.status !== "rejected";
              const approveIsOverride = isStudentDecisionOverride(application.recommendedDecision, "approved");
              const rejectIsOverride = isStudentDecisionOverride(application.recommendedDecision, "rejected");
              const flipNeedsReason =
                (canApprove && approveIsOverride) || (canReject && rejectIsOverride);

              return (
                <div key={application.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg text-slate-950">{application.applicantName}</h3>
                        <Badge variant={application.status === "approved" ? "success" : application.status === "rejected" ? "danger" : "warning"}>
                          {application.status}
                        </Badge>
                        <Badge variant={application.recommendedDecision === "accept" ? "success" : "danger"}>
                          Rule says {application.recommendedDecision}
                        </Badge>
                        {application.reviewedAt && application.status !== "pending" && !application.overrideReason && (
                          <Badge variant="info">Auto-decided</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{application.email}</p>
                      <p className="mt-1 text-sm text-slate-600">GPA {application.gpa.toFixed(2)} - Applied {new Date(application.submittedAt).toLocaleDateString()}</p>
                      {application.overrideReason && (
                        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          Override justification: {application.overrideReason}
                        </p>
                      )}
                      {application.generatedStudentId && (
                        <p className="mt-3 text-sm font-medium text-emerald-700">Generated student ID: {application.generatedStudentId}</p>
                      )}
                    </div>

                    <div className="w-full max-w-md space-y-3">
                      {flipNeedsReason && (
                        <textarea
                          value={studentOverrideReasons[application.id] ?? ""}
                          onChange={(event) =>
                            setStudentOverrideReasons((current) => ({
                              ...current,
                              [application.id]: event.target.value,
                            }))
                          }
                          placeholder="Required only if you decide against the system rule."
                          className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        />
                      )}
                      <div className="flex flex-wrap justify-end gap-2">
                        {canApprove && (
                          <Button variant="primary" size="sm" onClick={() => decideStudent(application, "approved")}>
                            {application.status === "rejected" ? "Override to approve" : "Approve"}
                          </Button>
                        )}
                        {canReject && (
                          <Button variant="danger" size="sm" onClick={() => decideStudent(application, "rejected")}>
                            {application.status === "approved" ? "Reverse to reject" : "Reject"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-700" />
            <h2 className="text-xl text-slate-950">Instructor Applications</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-600">Loading instructor applications...</p>
          ) : instructorApplications.length === 0 ? (
            <p className="text-sm text-slate-600">No instructor applications yet.</p>
          ) : (
            instructorApplications.map((application) => (
              <div key={application.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg text-slate-950">{application.applicantName}</h3>
                      <Badge variant={application.status === "approved" ? "success" : application.status === "rejected" ? "danger" : "warning"}>
                        {application.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{application.email}</p>
                    <p className="mt-1 text-sm text-slate-600">{application.subjectArea} - Applied {new Date(application.submittedAt).toLocaleDateString()}</p>
                  </div>

                  {application.status === "pending" && (
                    <div className="w-full max-w-md space-y-3">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">Assign classes before approval</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {courseCatalog.map((course) => {
                            const assignedCourseIds = instructorAssignments[application.id] ?? [];
                            const checked = assignedCourseIds.includes(course.id);

                            return (
                              <label key={course.id} className="flex items-start gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) =>
                                    setInstructorAssignments((current) => {
                                      const currentIds = current[application.id] ?? [];
                                      const nextIds = event.target.checked
                                        ? [...currentIds, course.id]
                                        : currentIds.filter((courseId) => courseId !== course.id);

                                      return {
                                        ...current,
                                        [application.id]: nextIds,
                                      };
                                    })
                                  }
                                  className="mt-1"
                                />
                                <span>
                                  <span className="block font-medium text-slate-950">{course.id}</span>
                                  <span className="block text-xs text-slate-500">{course.name}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="primary" size="sm" onClick={() => decideInstructor(application, "approved")}>
                          Approve
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => decideInstructor(application, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export function RegistrarGraduationPage() {
  const { user } = useAuth();
  const pendingApplications = usePendingGraduationApplications();
  const allApplications = useAllGraduationApplications();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [decisionMessage, setDecisionMessage] = useState("");
  const [decisionError, setDecisionError] = useState("");

  const recentDecisions = useMemo(
    () =>
      allApplications
        .filter((application) => application.status !== "pending")
        .sort((a, b) => (b.reviewedAt ?? b.submittedAt).localeCompare(a.reviewedAt ?? a.submittedAt))
        .slice(0, 8),
    [allApplications],
  );

  const review = (applicationId: string, decision: "approved" | "rejected") => {
    setDecisionMessage("");
    setDecisionError("");

    try {
      const reviewerEmail = user?.email ?? "registrar@college0.edu";
      const note = reviewNotes[applicationId] ?? "";

      if (decision === "approved") {
        localGraduationRepository.approveApplication({
          applicationId,
          reviewerEmail,
          registrarNote: note,
        });
        setDecisionMessage("Graduation application approved.");
      } else {
        localGraduationRepository.rejectApplication({
          applicationId,
          reviewerEmail,
          registrarNote: note,
        });
        setDecisionMessage("Graduation application rejected and a reckless-application warning was issued.");
      }

      setReviewNotes((current) => ({ ...current, [applicationId]: "" }));
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : "Unable to complete graduation review.");
    }
  };

  return (
    <div className="space-y-6">
      <RegistrarHeader
        title="Graduation Workflow"
        description="Review graduation applications, record threshold overrides, and finalize student outcomes."
      />

      {(decisionMessage || decisionError) && (
        <div className={`rounded-2xl border px-5 py-4 text-sm ${
          decisionError ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
        }`}>
          {decisionError || decisionMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Pending Applications</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {pendingApplications.length === 0 ? (
            <p className="text-sm text-slate-600">No graduation applications are waiting for review.</p>
          ) : (
            pendingApplications.map((application) => {
              const subThreshold = application.passingCompletionsAtSubmission < GRADUATION_THRESHOLD;
              const note = reviewNotes[application.id] ?? "";
              const studentName = resolveStudentDisplayName(application.studentEmail);

              return (
                <div key={application.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg text-slate-950">{studentName}</h3>
                        <Badge variant="warning">pending</Badge>
                        <Badge variant={subThreshold ? "danger" : "success"}>
                          {application.passingCompletionsAtSubmission}/{GRADUATION_THRESHOLD} passing courses
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{application.studentEmail}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Submitted {new Date(application.submittedAt).toLocaleDateString()}
                      </p>
                      {subThreshold && (
                        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          Approval is an override below the prototype graduation threshold. A justification is required.
                        </p>
                      )}
                    </div>

                    <div className="w-full max-w-xl space-y-3">
                      <textarea
                        value={note}
                        onChange={(event) =>
                          setReviewNotes((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                        placeholder={
                          subThreshold
                            ? "Required override justification for approval. Required reason for rejection."
                            : "Optional approval note. Required reason for rejection."
                        }
                        className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => review(application.id, "approved")}
                          disabled={subThreshold && !note.trim()}
                        >
                          {subThreshold ? "Approve with override" : "Approve"}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => review(application.id, "rejected")}
                          disabled={!note.trim()}
                        >
                          Reject and warn
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-700" />
            <h2 className="text-xl text-slate-950">Recently Decided</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          {recentDecisions.length === 0 ? (
            <p className="text-sm text-slate-600">No graduation decisions have been recorded yet.</p>
          ) : (
            recentDecisions.map((application) => (
              <div key={application.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base text-slate-950">{resolveStudentDisplayName(application.studentEmail)}</h3>
                      <Badge variant={application.status === "approved" ? "success" : "danger"}>
                        {application.status}
                      </Badge>
                      <Badge variant={application.passingCompletionsAtSubmission < GRADUATION_THRESHOLD ? "warning" : "neutral"}>
                        {application.passingCompletionsAtSubmission}/{GRADUATION_THRESHOLD}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{application.studentEmail}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Reviewed {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : "date unavailable"}
                      {application.reviewedBy ? ` by ${application.reviewedBy}` : ""}
                    </p>
                  </div>
                  {application.registrarNote && (
                    <p className="max-w-xl rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      {application.registrarNote}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export function RegistrarReviewsPage() {
  const tabooWords = useTabooWords();
  const reviews = useRegistrarReviews();
  const [tabooInput, setTabooInput] = useState(() => tabooWords.join(", "));
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setTabooInput(tabooWords.join(", "));
  }, [tabooWords]);

  const saveTabooWords = () => {
    const nextWords = tabooInput
      .split(/[\n,]/)
      .map((word) => word.trim())
      .filter(Boolean);
    const saved = localReviewsRepository.setTabooWords(nextWords);
    setSaveMessage(`Saved ${saved.length} taboo word${saved.length === 1 ? "" : "s"}.`);
  };

  return (
    <div className="space-y-6">
      <RegistrarHeader
        title="Review Moderation"
        description="Manage taboo words and inspect the full registrar-only review audit trail."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-700" />
            <h2 className="text-xl text-slate-950">Taboo Word List</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <textarea
            value={tabooInput}
            onChange={(event) => setTabooInput(event.target.value)}
            placeholder="Separate words with commas or new lines."
            className="min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              1-2 matches stay visible with masking and 1 warning. 3 or more matches are hidden and issue 2 warnings.
            </p>
            <Button variant="primary" onClick={saveTabooWords}>
              Save taboo words
            </Button>
          </div>
          {saveMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {saveMessage}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Registrar Review Audit</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-600">No student reviews have been submitted yet.</p>
          ) : (
            reviews.map((review) => {
              const course = localCourseRepository.get(review.courseId);
              return (
                <div key={review.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium text-slate-950">
                          {course ? `${course.id} - ${course.name}` : review.courseId}
                        </h3>
                        <Badge variant={review.visibility === "visible" ? "success" : "danger"}>
                          {review.visibility}
                        </Badge>
                        <Badge variant={review.tabooCount >= 3 ? "danger" : review.tabooCount > 0 ? "warning" : "neutral"}>
                          {review.tabooCount} taboo match{review.tabooCount === 1 ? "" : "es"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">
                        Reviewer: {resolveStudentDisplayName(review.studentEmail)} ({review.studentEmail})
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Rating {review.rating}/5 - Submitted {new Date(review.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="grid w-full max-w-2xl gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Raw comment</p>
                        <p className="mt-2 text-sm leading-6 text-slate-800">{review.rawComment}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Displayed comment</p>
                        <p className="mt-2 text-sm leading-6 text-slate-800">{review.displayComment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function complaintStatusLabel(status: ComplaintRecord["status"]) {
  return status === "under_review" ? "Under Review" : status === "open" ? "Open" : "Resolved";
}

function complaintStatusVariant(status: ComplaintRecord["status"]) {
  return status === "resolved" ? "success" : status === "open" ? "danger" : "warning";
}

export function RegistrarComplaintsPage() {
  const { user } = useAuth();
  const complaintRecords = useComplaints();
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [resolutionActions, setResolutionActions] = useState<Record<string, ComplaintResolutionAction>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const openCount = complaintRecords.filter((complaint) => complaint.status !== "resolved").length;

  const markUnderReview = (complaintId: string) => {
    setMessage(null);
    try {
      localComplaintsRepository.markUnderReview(complaintId);
      setMessage({ kind: "success", text: "Complaint marked under review." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to update complaint." });
    }
  };

  const resolveComplaint = (complaint: ComplaintRecord) => {
    setMessage(null);
    const action = resolutionActions[complaint.id] ?? "no_action";
    const note = resolutionNotes[complaint.id] ?? "";
    try {
      localComplaintsRepository.resolve({
        complaintId: complaint.id,
        registrarEmail: user?.email ?? "registrar@college0.edu",
        action,
        note,
      });
      setResolutionNotes((current) => ({ ...current, [complaint.id]: "" }));
      setResolutionActions((current) => ({ ...current, [complaint.id]: "no_action" }));
      setMessage({ kind: "success", text: "Complaint resolved and registrar action recorded." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to resolve complaint." });
    }
  };

  return (
    <div className="space-y-6">
      <RegistrarHeader
        title="Complaints"
        description="Investigate complaints, issue warnings, or de-register students when the case requires it."
      />

      {message && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${
          message.kind === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-red-200 bg-red-50 text-red-900"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Open or reviewing</p>
            <div className="mt-3 text-4xl text-slate-950">{openCount}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Resolved</p>
            <div className="mt-3 text-4xl text-slate-950">{complaintRecords.length - openCount}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total cases</p>
            <div className="mt-3 text-4xl text-slate-950">{complaintRecords.length}</div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-700" />
            <h2 className="text-xl text-slate-950">Complaint Log</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {complaintRecords.length === 0 ? (
            <p className="text-sm text-slate-600">No complaints have been filed yet.</p>
          ) : (
            complaintRecords.map((complaint) => {
              const action = resolutionActions[complaint.id] ?? "no_action";
              const canDeregister = complaint.filedAgainstRole === "student";

              return (
                <div key={complaint.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium text-slate-950">{complaint.type}</h3>
                        <Badge variant={complaintStatusVariant(complaint.status)}>
                          {complaintStatusLabel(complaint.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{complaint.details}</p>
                      <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                        <p>Course: <span className="font-medium text-slate-900">{complaint.courseId}</span></p>
                        <p>Filed: {new Date(complaint.submittedAt).toLocaleString()}</p>
                        <p>Reporter: {complaint.filedByRole} - {complaint.filedByEmail}</p>
                        <p>Against: {complaint.filedAgainstRole} - {complaint.filedAgainstEmail}</p>
                      </div>
                      {complaint.resolutionNote && (
                        <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                          Resolution: {complaint.resolutionNote}
                        </p>
                      )}
                    </div>
                    {complaint.status !== "resolved" && (
                      <Button variant="outline" size="sm" onClick={() => markUnderReview(complaint.id)}>
                        Mark reviewing
                      </Button>
                    )}
                  </div>

                  {complaint.status !== "resolved" && (
                    <div className="mt-5 grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Registrar action</span>
                        <select
                          value={action}
                          onChange={(event) =>
                            setResolutionActions((current) => ({
                              ...current,
                              [complaint.id]: event.target.value as ComplaintResolutionAction,
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="no_action">Resolve without punishment</option>
                          <option value="warn_target">Warn accused party</option>
                          <option value="warn_reporter">Warn reporter</option>
                          {canDeregister && <option value="deregister_student">De-register accused student</option>}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Resolution note</span>
                        <input
                          value={resolutionNotes[complaint.id] ?? ""}
                          onChange={(event) =>
                            setResolutionNotes((current) => ({
                              ...current,
                              [complaint.id]: event.target.value,
                            }))
                          }
                          placeholder="Record investigation outcome and reason."
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        />
                      </label>
                      <Button variant="primary" onClick={() => resolveComplaint(complaint)}>
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}

interface NewCourseForm {
  id: string;
  name: string;
  instructor: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  seats: string;
  credits: string;
}

const emptyNewCourse: NewCourseForm = {
  id: "",
  name: "",
  instructor: "",
  days: [],
  startTime: "09:00",
  endTime: "10:30",
  seats: "",
  credits: "3",
};

function toggleDay(days: DayOfWeek[], day: DayOfWeek): DayOfWeek[] {
  return days.includes(day) ? days.filter((entry) => entry !== day) : [...days, day];
}

function orderedDays(days: DayOfWeek[]): DayOfWeek[] {
  return WEEKDAYS.filter((day) => days.includes(day));
}

export function RegistrarClassSetupPage() {
  const [phase] = useSemesterPhase();
  const isEditable = phase === "setup";
  const courseStates = useCourses();
  const [edits, setEdits] = useState<Record<string, Partial<CourseEditableFields>>>({});
  const [newCourse, setNewCourse] = useState<NewCourseForm>(emptyNewCourse);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const getDraftValue = <K extends keyof CourseEditableFields>(
    course: CourseState,
    field: K,
  ): CourseEditableFields[K] => {
    const draft = edits[course.id];
    if (draft && field in draft && draft[field] !== undefined) {
      return draft[field] as CourseEditableFields[K];
    }
    return course[field];
  };

  const setDraftValue = <K extends keyof CourseEditableFields>(
    courseId: string,
    field: K,
    value: CourseEditableFields[K],
  ) => {
    setEdits((current) => ({
      ...current,
      [courseId]: { ...current[courseId], [field]: value },
    }));
  };

  const saveCourse = (course: CourseState) => {
    setFeedback(null);
    const partial = edits[course.id];
    if (!partial || Object.keys(partial).length === 0) return;
    if (partial.seats !== undefined && (!Number.isInteger(partial.seats) || partial.seats <= 0)) {
      setFeedback({ kind: "error", message: "Seats must be a positive whole number." });
      return;
    }
    if (partial.schedule !== undefined && !isValidSchedule(partial.schedule)) {
      setFeedback({
        kind: "error",
        message: "Pick at least one day and ensure the end time comes after the start time.",
      });
      return;
    }
    const sanitized: Partial<CourseEditableFields> = partial.schedule
      ? { ...partial, schedule: { ...partial.schedule, days: orderedDays(partial.schedule.days) } }
      : partial;
    try {
      localCourseRepository.update(course.id, sanitized);
      setEdits((current) => {
        const next = { ...current };
        delete next[course.id];
        return next;
      });
      setFeedback({ kind: "success", message: `${course.id} updated.` });
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Save failed." });
    }
  };

  const cancelEdit = (courseId: string) => {
    setEdits((current) => {
      const next = { ...current };
      delete next[courseId];
      return next;
    });
  };

  const addCourse = () => {
    setFeedback(null);
    const id = newCourse.id.trim().toUpperCase();
    const name = newCourse.name.trim();
    const instructor = newCourse.instructor.trim();
    const seats = Number(newCourse.seats);
    const credits = Number(newCourse.credits);

    if (!id || !name || !instructor) {
      setFeedback({ kind: "error", message: "Provide an ID, name, and instructor." });
      return;
    }
    if (!Number.isInteger(seats) || seats <= 0) {
      setFeedback({ kind: "error", message: "Seats must be a positive whole number." });
      return;
    }
    if (!Number.isInteger(credits) || credits <= 0) {
      setFeedback({ kind: "error", message: "Credits must be a positive whole number." });
      return;
    }

    const startMinutes = parseTimeInputToMinutes(newCourse.startTime);
    const endMinutes = parseTimeInputToMinutes(newCourse.endTime);
    if (startMinutes === null || endMinutes === null) {
      setFeedback({ kind: "error", message: "Enter valid start and end times." });
      return;
    }
    const schedule: CourseSchedule = {
      days: orderedDays(newCourse.days),
      startMinutes,
      endMinutes,
    };
    if (!isValidSchedule(schedule)) {
      setFeedback({
        kind: "error",
        message: "Pick at least one day and ensure the end time comes after the start time.",
      });
      return;
    }

    try {
      localCourseRepository.add({ id, name, instructor, schedule, seats, credits, rating: 0 });
      setNewCourse(emptyNewCourse);
      setFeedback({ kind: "success", message: `Course ${id} added.` });
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Add failed." });
    }
  };

  return (
    <div className="space-y-6">
      <RegistrarHeader
        title="Class Setup"
        description="Build the course catalog, assign instructors, and define class size. Editable only during the setup phase."
      />

      {!isEditable && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Lock className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Course configuration is locked.</p>
            <p className="mt-1 text-amber-800">
              The system is currently in the <span className="font-medium">{SEMESTER_PHASES.find((entry) => entry.id === phase)?.label}</span> phase.
              Class catalog edits and new classes are disabled until the registrar returns the cycle to Class Setup.
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            feedback.kind === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Add a new class</h2>
          </div>
        </CardHeader>
        <CardBody>
          <fieldset disabled={!isEditable} className="space-y-4 disabled:opacity-60">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Course ID</span>
                <input
                  value={newCourse.id}
                  onChange={(event) => setNewCourse((current) => ({ ...current, id: event.target.value }))}
                  placeholder="e.g. CS500"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Course name</span>
                <input
                  value={newCourse.name}
                  onChange={(event) => setNewCourse((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Instructor</span>
                <input
                  value={newCourse.instructor}
                  onChange={(event) => setNewCourse((current) => ({ ...current, instructor: event.target.value }))}
                  placeholder="e.g. Dr. Sarah Johnson"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Seats</span>
                <input
                  type="number"
                  min="1"
                  value={newCourse.seats}
                  onChange={(event) => setNewCourse((current) => ({ ...current, seats: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Credits</span>
                <input
                  type="number"
                  min="1"
                  value={newCourse.credits}
                  onChange={(event) => setNewCourse((current) => ({ ...current, credits: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm font-medium text-slate-700">Schedule</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const isOn = newCourse.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setNewCourse((current) => ({ ...current, days: toggleDay(current.days, day) }))}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                        isOn
                          ? "bg-slate-950 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Start time</span>
                  <input
                    type="time"
                    value={newCourse.startTime}
                    onChange={(event) => setNewCourse((current) => ({ ...current, startTime: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">End time</span>
                  <input
                    type="time"
                    value={newCourse.endTime}
                    onChange={(event) => setNewCourse((current) => ({ ...current, endTime: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                  />
                </label>
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-700">
                  Preview: <span className="font-medium text-slate-950">
                    {newCourse.days.length === 0
                      ? "Pick at least one day"
                      : `${orderedDays(newCourse.days).join("/")} ${newCourse.startTime} - ${newCourse.endTime}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" className="gap-2" onClick={addCourse} disabled={!isEditable}>
                <Plus className="h-4 w-4" />
                Add class
              </Button>
            </div>
          </fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl text-slate-950">Existing classes</h2>
            </div>
            <Badge variant="neutral">{courseStates.length} courses</Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {courseStates.length === 0 ? (
            <p className="text-sm text-slate-600">No classes have been configured yet.</p>
          ) : (
            courseStates.map((course) => {
              const hasDraft = Boolean(edits[course.id] && Object.keys(edits[course.id]).length > 0);

              return (
                <div key={course.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg text-slate-950">{course.id}</h3>
                      {course.cancelled && <Badge variant="danger">Cancelled</Badge>}
                      {hasDraft && <Badge variant="warning">Unsaved changes</Badge>}
                    </div>
                    <div className="text-sm text-slate-600">
                      {course.enrolledStudentIds.length} enrolled - {course.waitlistStudentIds.length} on waitlist
                    </div>
                  </div>

                  <fieldset disabled={!isEditable} className="space-y-3 disabled:opacity-60">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Course name</span>
                        <input
                          value={getDraftValue(course, "name") ?? ""}
                          onChange={(event) => setDraftValue(course.id, "name", event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Instructor</span>
                        <input
                          value={getDraftValue(course, "instructor") ?? ""}
                          onChange={(event) => setDraftValue(course.id, "instructor", event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Seats</span>
                        <input
                          type="number"
                          min="1"
                          value={getDraftValue(course, "seats") ?? course.seats}
                          onChange={(event) => setDraftValue(course.id, "seats", Number(event.target.value))}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                        />
                      </label>
                    </div>

                    {(() => {
                      const effectiveSchedule = (getDraftValue(course, "schedule") ?? course.schedule) as CourseSchedule;
                      return (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                          <p className="text-sm font-medium text-slate-700">Schedule</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {WEEKDAYS.map((day) => {
                              const isOn = effectiveSchedule.days.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() =>
                                    setDraftValue(course.id, "schedule", {
                                      ...effectiveSchedule,
                                      days: toggleDay(effectiveSchedule.days, day),
                                    })
                                  }
                                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                                    isOn
                                      ? "bg-slate-950 text-white"
                                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Start time</span>
                              <input
                                type="time"
                                value={minutesToTimeInput(effectiveSchedule.startMinutes)}
                                onChange={(event) => {
                                  const next = parseTimeInputToMinutes(event.target.value);
                                  if (next !== null) {
                                    setDraftValue(course.id, "schedule", { ...effectiveSchedule, startMinutes: next });
                                  }
                                }}
                                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                              />
                            </label>
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">End time</span>
                              <input
                                type="time"
                                value={minutesToTimeInput(effectiveSchedule.endMinutes)}
                                onChange={(event) => {
                                  const next = parseTimeInputToMinutes(event.target.value);
                                  if (next !== null) {
                                    setDraftValue(course.id, "schedule", { ...effectiveSchedule, endMinutes: next });
                                  }
                                }}
                                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
                              />
                            </label>
                            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-700">
                              Preview: <span className="font-medium text-slate-950">
                                {effectiveSchedule.days.length === 0
                                  ? "Pick at least one day"
                                  : formatSchedule({ ...effectiveSchedule, days: orderedDays(effectiveSchedule.days) })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {hasDraft && (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => cancelEdit(course.id)} disabled={!isEditable}>
                          Cancel
                        </Button>
                        <Button variant="primary" size="sm" className="gap-2" onClick={() => saveCourse(course)} disabled={!isEditable}>
                          <Save className="h-4 w-4" />
                          Save changes
                        </Button>
                      </div>
                    )}
                  </fieldset>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export function RegistrarSemesterControlPage() {
  const [phase, setPhase] = useSemesterPhase();
  const semesterPhases = useMemo(() => buildPhaseTimeline(phase), [phase]);
  const activeIndex = SEMESTER_PHASES.findIndex((entry) => entry.id === phase);
  const nextPhase = SEMESTER_PHASES[(activeIndex + 1) % SEMESTER_PHASES.length];
  const lastTransition = useLastTransitionSummary();

  return (
    <div className="space-y-6">
      <RegistrarHeader
        title="Semester Control"
        description="Manage the active phase and monitor rule-sensitive transitions across the term."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl text-slate-950">Phase Timeline</h2>
            </div>
            <Button variant="primary" size="sm" onClick={() => setPhase(nextPhase.id)}>
              Advance to {nextPhase.label}
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          {semesterPhases.map((phase, index) => (
            <div
              key={phase.phase}
              className={`rounded-2xl border px-4 py-4 ${
                phase.status === "active" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    phase.status === "active" ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-950">{phase.phase}</div>
                    <div className="mt-1 text-xs text-slate-600">{phase.startDate} to {phase.endDate}</div>
                  </div>
                </div>
                <Badge variant={phase.status === "active" ? "info" : "neutral"}>
                  {phase.status === "active" ? "Active" : "Upcoming"}
                </Badge>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-700" />
              <h2 className="text-xl text-slate-950">Last Transition</h2>
            </div>
            {lastTransition && (
              <Badge variant="neutral">{new Date(lastTransition.occurredAt).toLocaleString()}</Badge>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          {!lastTransition ? (
            <p className="text-sm text-slate-600">
              No phase-close rules have fired yet. Advance from Registration to Classes Running to trigger
              cancellation and warning checks.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-700">
                <span className="font-medium">{SEMESTER_PHASES.find((entry) => entry.id === lastTransition.from)?.label ?? lastTransition.from}</span>
                {" → "}
                <span className="font-medium">{SEMESTER_PHASES.find((entry) => entry.id === lastTransition.to)?.label ?? lastTransition.to}</span>
              </p>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {lastTransition.cancelledCourses.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Courses cancelled</p>
                    <p className="mt-2 text-2xl text-slate-950">{lastTransition.cancelledCourses.length}</p>
                  </div>
                )}
                {lastTransition.studentsFlaggedForReReg.length > 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Students in special re-reg</p>
                    <p className="mt-2 text-2xl text-emerald-900">{lastTransition.studentsFlaggedForReReg.length}</p>
                  </div>
                )}
                {lastTransition.studentsWarnedUnderload.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Under-load warnings issued</p>
                    <p className="mt-2 text-2xl text-amber-900">{lastTransition.studentsWarnedUnderload.length}</p>
                  </div>
                )}
                {lastTransition.instructorsWarned.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Instructors warned</p>
                    <p className="mt-2 text-2xl text-amber-900">{lastTransition.instructorsWarned.length}</p>
                  </div>
                )}
                {lastTransition.instructorsSuspended.length > 0 && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-red-700">Instructors suspended</p>
                    <p className="mt-2 text-2xl text-red-900">{lastTransition.instructorsSuspended.length}</p>
                  </div>
                )}
                {(lastTransition.instructorsMissingGrades?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Instructors missing grades</p>
                    <p className="mt-2 text-2xl text-amber-900">{lastTransition.instructorsMissingGrades?.length ?? 0}</p>
                  </div>
                )}
                {(lastTransition.instructorsWarnedClassGpa?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Class GPA outliers</p>
                    <p className="mt-2 text-2xl text-amber-900">{lastTransition.instructorsWarnedClassGpa?.length ?? 0}</p>
                  </div>
                )}
                {(lastTransition.studentsTerminated?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-red-700">Students terminated</p>
                    <p className="mt-2 text-2xl text-red-900">{lastTransition.studentsTerminated?.length ?? 0}</p>
                  </div>
                )}
                {(lastTransition.studentsWarnedGpaInterview?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-amber-700">GPA interview warnings</p>
                    <p className="mt-2 text-2xl text-amber-900">{lastTransition.studentsWarnedGpaInterview?.length ?? 0}</p>
                  </div>
                )}
                {(lastTransition.studentsHonorRoll?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Honor roll students</p>
                    <p className="mt-2 text-2xl text-emerald-900">{lastTransition.studentsHonorRoll?.length ?? 0}</p>
                  </div>
                )}
                {(lastTransition.warningsClearedByHonor ?? 0) > 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Warnings cleared by honor</p>
                    <p className="mt-2 text-2xl text-emerald-900">{lastTransition.warningsClearedByHonor ?? 0}</p>
                  </div>
                )}
              </div>

              {lastTransition.cancelledCourses.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">Cancelled courses</p>
                  <ul className="mt-2 space-y-1">
                    {lastTransition.cancelledCourses.map((course) => (
                      <li key={course.id} className="text-slate-700">
                        <span className="font-medium text-slate-950">{course.id}</span> · {course.name} · {course.instructor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-slate-700" />
            <h2 className="text-xl text-slate-950">Policy Watch</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            {SEMESTER_PHASES[activeIndex]?.description ?? ""}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            Advancing the phase would move the system into <span className="font-medium">{nextPhase.label}</span>.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
