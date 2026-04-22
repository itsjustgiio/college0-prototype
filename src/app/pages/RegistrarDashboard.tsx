import { FileText, MessageSquare, Settings, AlertTriangle, ShieldAlert, ClipboardList } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { applications, complaints, students, courses } from "../data/mockData";

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
            <div className="mt-3 text-4xl text-slate-950">{applications.filter((a) => a.status === "Pending").length}</div>
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
                {applications.filter((a) => a.status === "Pending").length} applications still need a final decision.
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
  return (
    <div className="space-y-6">
      <RegistrarHeader
        title="Applications"
        description="Review admissions decisions, current status, and applicant quality in one place."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Application Queue</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Email</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">GPA</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Applied</th>
                  <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.16em] text-slate-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.16em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-950">{app.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{app.email}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-950">{app.gpa}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{app.appliedDate}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={app.status === "Approved" ? "success" : app.status === "Rejected" ? "danger" : "warning"}>
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {app.status === "Pending" && (
                        <div className="flex justify-end gap-2">
                          <Button variant="primary" size="sm">Approve</Button>
                          <Button variant="danger" size="sm">Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    <p className="mt-1 text-xs text-slate-600">{complaint.course} • {complaint.type}</p>
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
