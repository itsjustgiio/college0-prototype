import { useEffect, useMemo, useState } from "react";
import { FileText, MessageSquare, Settings, AlertTriangle, ShieldAlert, ClipboardList } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { complaints, students, courses } from "../data/mockData";
import type { InstructorApplication, ProgramAdmissionSettings, StudentApplication } from "../domain/admissions";
import { isStudentDecisionOverride } from "../domain/admissions";
import { localAdmissionsRepository } from "../services/localAdmissionsRepository";

const semesterPhases = [
  { phase: "Registration", status: "active", startDate: "2026-04-15", endDate: "2026-05-15" },
  { phase: "Classes", status: "upcoming", startDate: "2026-05-16", endDate: "2026-08-15" },
  { phase: "Grading", status: "upcoming", startDate: "2026-08-16", endDate: "2026-08-30" },
  { phase: "Review", status: "upcoming", startDate: "2026-09-01", endDate: "2026-09-15" },
];

const studentsAtRisk = students.filter((s) => s.gpa < 2.5 || s.warnings > 0);

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
            <div className="mt-3 text-4xl text-slate-950">{courses.length}</div>
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
            <div className="mt-3 text-4xl text-slate-950">{complaints.filter((c) => c.status === "Open").length}</div>
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
                {complaints.filter((c) => c.status !== "Resolved").length} complaints remain unresolved or under review.
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function RegistrarApplicationsPage() {
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
              const approveIsOverride = isStudentDecisionOverride(application.recommendedDecision, "approved");
              const rejectIsOverride = isStudentDecisionOverride(application.recommendedDecision, "rejected");

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

                    {application.status === "pending" && (
                      <div className="w-full max-w-md space-y-3">
                        {(approveIsOverride || rejectIsOverride) && (
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
                          <Button variant="primary" size="sm" onClick={() => decideStudent(application, "approved")}>
                            Approve
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => decideStudent(application, "rejected")}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
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
                          {courses.map((course) => {
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

export function RegistrarComplaintsPage() {
  return (
    <div className="space-y-6">
      <RegistrarHeader
        title="Complaints"
        description="Track complaint status, affected courses, and which items still need action."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-700" />
            <h2 className="text-xl text-slate-950">Complaint Log</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-slate-100">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="px-6 py-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-950">{complaint.student}</h3>
                    <p className="mt-1 text-xs text-slate-600">{complaint.course} - {complaint.type}</p>
                    <p className="mt-2 text-xs text-slate-500">Filed {complaint.date}</p>
                  </div>
                  <Badge variant={complaint.status === "Resolved" ? "success" : complaint.status === "Open" ? "danger" : "warning"}>
                    {complaint.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function RegistrarSemesterControlPage() {
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
            <Button variant="primary" size="sm">Advance phase</Button>
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
            <ClipboardList className="h-5 w-5 text-slate-700" />
            <h2 className="text-xl text-slate-950">Policy Watch</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            Registration is currently active. Course add and waitlist rules are in effect.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            Advancing the phase would move the system into classes beginning on May 16, 2026.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
