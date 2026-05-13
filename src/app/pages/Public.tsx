import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  User,
  UserCog,
} from "lucide-react";
import { students } from "../data/mockData";
import type { InstructorApplication, StudentApplication } from "../domain/admissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useSemesterPhase } from "../hooks/useSemesterPhase";
import { SEMESTER_PHASES } from "../services/localSemesterRepository";
import { useCourses } from "../hooks/useCourses";
import { useCourseReviewSummary, useVisibleCourseReviews } from "../hooks/useReviews";
import { formatSchedule } from "../domain/schedule";

export function Public() {
  const [phase, setPhase] = useSemesterPhase();
  const currentPhase = SEMESTER_PHASES.find((entry) => entry.id === phase) ?? SEMESTER_PHASES[1];
  const courses = useCourses();
  const [classFilter, setClassFilter] = useState<"All" | "CS" | "Math" | "General Ed" | "Business">("All");
  const [studentForm, setStudentForm] = useState({ applicantName: "", email: "", gpa: "" });
  const [studentSubmitState, setStudentSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [studentSubmitMessage, setStudentSubmitMessage] = useState("");
  const [instructorForm, setInstructorForm] = useState({ applicantName: "", email: "", subjectArea: "" });
  const [instructorSubmitState, setInstructorSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [instructorSubmitMessage, setInstructorSubmitMessage] = useState("");
  const [statusLookup, setStatusLookup] = useState({ type: "student" as "student" | "instructor", email: "" });
  const [statusLookupMessage, setStatusLookupMessage] = useState("");
  const [statusLookupResult, setStatusLookupResult] = useState<
    | { type: "student"; application: StudentApplication }
    | { type: "instructor"; application: InstructorApplication }
    | null
  >(null);
  const highestRatedCourses = [...courses].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const lowestRatedCourses = [...courses].sort((a, b) => a.rating - b.rating).slice(0, 3);
  const highestGpaStudents = [...students].sort((a, b) => b.gpa - a.gpa).slice(0, 3);
  const classGroups = [
    { label: "All", match: () => true },
    { label: "CS", match: (courseId: string) => courseId.startsWith("CS") },
    { label: "Math", match: (courseId: string) => courseId.startsWith("MATH") },
    { label: "General Ed", match: (courseId: string) => courseId.startsWith("ENG") },
    { label: "Business", match: (courseId: string) => courseId.startsWith("BUS") },
  ] as const;
  const visibleCourses = courses.filter((course) => {
    const activeGroup = classGroups.find((group) => group.label === classFilter);
    return activeGroup ? activeGroup.match(course.id) : true;
  });

  const portals = [
    {
      to: "/student",
      icon: User,
      title: "Student",
      description: "Registration, progress, support.",
    },
    {
      to: "/instructor",
      icon: UserCog,
      title: "Instructor",
      description: "Courses, students, grading.",
    },
    {
      to: "/registrar",
      icon: ShieldCheck,
      title: "Registrar",
      description: "Applications, policy, oversight.",
    },
  ];

  const submitStudentApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStudentSubmitState("idle");
    setStudentSubmitMessage("");

    const parsedGpa = Number(studentForm.gpa);
    if (!studentForm.applicantName.trim() || !studentForm.email.trim() || Number.isNaN(parsedGpa)) {
      setStudentSubmitState("error");
      setStudentSubmitMessage("Enter a name, email, and numeric GPA.");
      return;
    }

    if (parsedGpa < 0 || parsedGpa > 4) {
      setStudentSubmitState("error");
      setStudentSubmitMessage("GPA must be between 0.0 and 4.0.");
      return;
    }

    const { localAdmissionsRepository } = await import("../services/localAdmissionsRepository");
    await localAdmissionsRepository.submitStudentApplication({
      applicantName: studentForm.applicantName.trim(),
      email: studentForm.email.trim(),
      gpa: parsedGpa,
    });

    setStudentSubmitState("success");
    setStudentSubmitMessage("Student application submitted for registrar review.");
    setStudentForm({ applicantName: "", email: "", gpa: "" });
  };

  const submitInstructorApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInstructorSubmitState("idle");
    setInstructorSubmitMessage("");

    if (!instructorForm.applicantName.trim() || !instructorForm.email.trim() || !instructorForm.subjectArea.trim()) {
      setInstructorSubmitState("error");
      setInstructorSubmitMessage("Enter a name, email, and subject area.");
      return;
    }

    const { localAdmissionsRepository } = await import("../services/localAdmissionsRepository");
    await localAdmissionsRepository.submitInstructorApplication({
      applicantName: instructorForm.applicantName.trim(),
      email: instructorForm.email.trim(),
      subjectArea: instructorForm.subjectArea.trim(),
    });

    setInstructorSubmitState("success");
    setInstructorSubmitMessage("Instructor application submitted for registrar review.");
    setInstructorForm({ applicantName: "", email: "", subjectArea: "" });
  };

  const checkApplicationStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusLookupMessage("");
    setStatusLookupResult(null);

    if (!statusLookup.email.trim()) {
      setStatusLookupMessage("Enter the email used on the application.");
      return;
    }

    const { localAdmissionsRepository } = await import("../services/localAdmissionsRepository");
    const application =
      statusLookup.type === "student"
        ? await localAdmissionsRepository.findStudentApplicationByEmail(statusLookup.email)
        : await localAdmissionsRepository.findInstructorApplicationByEmail(statusLookup.email);

    if (!application) {
      setStatusLookupMessage("No matching application was found for that email.");
      return;
    }

    setStatusLookupResult(
      statusLookup.type === "student"
        ? { type: "student", application: application as StudentApplication }
        : { type: "instructor", application: application as InstructorApplication },
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f6fa] px-5 py-8 md:px-8">
      <div className="absolute inset-x-0 top-0 h-[500px] bg-[linear-gradient(135deg,#10243b_0%,#16385f_55%,#235f9d_100%)]" />

      <div className="relative mx-auto max-w-[1360px]">
        <div className="mb-8 flex items-center justify-between rounded-3xl border border-white/10 bg-white/6 px-5 py-4 text-white md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold">College0</div>
              <div className="text-xs uppercase tracking-[0.24em] text-blue-100/80">Program Management System</div>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-sm text-blue-100/80 md:flex">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">Spring 2026</span>
            <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-amber-100">
              Phase: {currentPhase.label}
            </span>
            <Dialog>
              <DialogTrigger className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/15">
                View all classes
              </DialogTrigger>
              <DialogContent className="max-h-[84vh] overflow-hidden rounded-[28px] border-slate-200 bg-white p-0 sm:max-w-5xl">
                <DialogHeader className="border-b border-slate-200 px-6 py-5">
                  <DialogTitle className="text-2xl text-slate-950">All available classes</DialogTitle>
                  <DialogDescription className="text-sm leading-6 text-slate-600">
                    Filter the public class list by subject area.
                  </DialogDescription>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {classGroups.map((group) => (
                      <button
                        key={group.label}
                        type="button"
                        onClick={() => setClassFilter(group.label)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                          classFilter === group.label
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {group.label}
                      </button>
                    ))}
                  </div>
                </DialogHeader>
                <div className="max-h-[62vh] overflow-y-auto">
                  <div className="divide-y divide-slate-100">
                    {visibleCourses.map((course) => (
                      <div key={course.id} className="grid gap-3 px-6 py-4 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                          <p className="text-sm font-medium text-slate-950">{course.id} - {course.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{course.instructor}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatSchedule(course.schedule)}</p>
                          <PublicCourseReviewPreview courseId={course.id} />
                        </div>
                        <div className="flex items-center gap-4 text-sm md:justify-end">
                          <span className="text-slate-600">{course.enrolledStudentIds.length}/{course.seats} seats</span>
                          <span className="font-semibold text-amber-700">{course.rating.toFixed(1)} rating</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#2d4f76_0%,#29496d_100%)] p-8 text-white shadow-[0_30px_80px_-50px_rgba(4,18,39,0.7)] md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-blue-100/90">
              <Sparkles className="h-3.5 w-3.5" />
              College0 overview
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl text-white md:text-6xl">
              A cleaner system for registration, advising, and oversight.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100/88">
              One shared workspace for students, instructors, and registrars to follow the semester from course setup through grading.
            </p>

            <div className="mt-10 flex flex-wrap gap-3 text-sm text-blue-100/88">
              <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">4 semester phases</span>
              <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">Role-based dashboards</span>
              <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">AI support with fallback warnings</span>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/8 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-blue-100/75">Demo control</p>
                  <p className="mt-1 text-sm text-white">
                    Active phase: <span className="font-semibold">{currentPhase.label}</span>
                  </p>
                </div>
                <p className="max-w-md text-xs leading-5 text-blue-100/75">{currentPhase.description}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {SEMESTER_PHASES.map((entry) => {
                  const isActive = entry.id === phase;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setPhase(entry.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white text-slate-950"
                          : "border border-white/15 bg-white/5 text-blue-100/90 hover:bg-white/15"
                      }`}
                    >
                      {entry.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-blue-50">
                  Apply as student
                </DialogTrigger>
                <DialogContent className="rounded-[28px] border-slate-200 bg-white p-0 sm:max-w-xl">
                  <DialogHeader className="border-b border-slate-200 px-6 py-5">
                    <DialogTitle className="text-2xl text-slate-950">Student application</DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-slate-600">
                      Submit a visitor application for registrar review.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4 px-6 py-5" onSubmit={submitStudentApplication}>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Full name</span>
                      <input
                        value={studentForm.applicantName}
                        onChange={(event) => setStudentForm((form) => ({ ...form, applicantName: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Email</span>
                      <input
                        type="email"
                        value={studentForm.email}
                        onChange={(event) => setStudentForm((form) => ({ ...form, email: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Current GPA</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        value={studentForm.gpa}
                        onChange={(event) => setStudentForm((form) => ({ ...form, gpa: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      />
                    </label>

                    {studentSubmitMessage && (
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          studentSubmitState === "success"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {studentSubmitMessage}
                      </div>
                    )}

                    <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800">
                      Submit student application
                    </button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15">
                  Apply as instructor
                </DialogTrigger>
                <DialogContent className="rounded-[28px] border-slate-200 bg-white p-0 sm:max-w-xl">
                  <DialogHeader className="border-b border-slate-200 px-6 py-5">
                    <DialogTitle className="text-2xl text-slate-950">Instructor application</DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-slate-600">
                      Submit a teaching application for registrar review.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4 px-6 py-5" onSubmit={submitInstructorApplication}>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Full name</span>
                      <input
                        value={instructorForm.applicantName}
                        onChange={(event) => setInstructorForm((form) => ({ ...form, applicantName: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Email</span>
                      <input
                        type="email"
                        value={instructorForm.email}
                        onChange={(event) => setInstructorForm((form) => ({ ...form, email: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Subject area</span>
                      <input
                        value={instructorForm.subjectArea}
                        onChange={(event) => setInstructorForm((form) => ({ ...form, subjectArea: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      />
                    </label>

                    {instructorSubmitMessage && (
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          instructorSubmitState === "success"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {instructorSubmitMessage}
                      </div>
                    )}

                    <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800">
                      Submit instructor application
                    </button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15">
                  Check application status
                </DialogTrigger>
                <DialogContent className="rounded-[28px] border-slate-200 bg-white p-0 sm:max-w-2xl">
                  <DialogHeader className="border-b border-slate-200 px-6 py-5">
                    <DialogTitle className="text-2xl text-slate-950">Application status</DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-slate-600">
                      Look up the result using the same email used when applying.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4 px-6 py-5" onSubmit={checkApplicationStatus}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Application type</span>
                        <select
                          value={statusLookup.type}
                          onChange={(event) =>
                            setStatusLookup((lookup) => ({
                              ...lookup,
                              type: event.target.value as "student" | "instructor",
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Email</span>
                        <input
                          type="email"
                          value={statusLookup.email}
                          onChange={(event) => setStatusLookup((lookup) => ({ ...lookup, email: event.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        />
                      </label>
                    </div>

                    <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800">
                      Check status
                    </button>

                    {statusLookupMessage && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {statusLookupMessage}
                      </div>
                    )}

                    {statusLookupResult?.application && (
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-medium text-slate-950">
                            {statusLookupResult.application.applicantName}
                          </p>
                          <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200">
                            {statusLookupResult.application.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{statusLookupResult.application.email}</p>

                        {statusLookupResult.type === "student" && statusLookupResult.application.status === "approved" && (
                          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            <p>Student ID: {statusLookupResult.application.generatedStudentId}</p>
                            <p>Temporary password: {statusLookupResult.application.issuedTemporaryPassword}</p>
                            <p className="mt-2">Use these credentials to log in and create a new password.</p>
                          </div>
                        )}

                        {statusLookupResult.type === "student" &&
                          statusLookupResult.application.status === "rejected" &&
                          statusLookupResult.application.overrideReason && (
                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                              Registrar explanation: {statusLookupResult.application.overrideReason}
                            </div>
                          )}

                        {statusLookupResult.type === "instructor" &&
                          statusLookupResult.application.status === "approved" && (
                            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                              <p>Temporary password: {statusLookupResult.application.issuedTemporaryPassword}</p>
                              <p>Assigned classes: {statusLookupResult.application.assignedCourseIds?.join(", ") || "Pending assignment"}</p>
                              <p className="mt-2">Use the temporary password to log in and create a new password.</p>
                            </div>
                          )}
                      </div>
                    )}
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_56px_-40px_rgba(15,23,42,0.28)] xl:p-7">
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Open a workspace</p>
              <h2 className="mt-2 text-3xl text-slate-950">Choose your role</h2>
            </div>

            <div className="space-y-4">
              {portals.map((portal) => {
                const Icon = portal.icon;

                return (
                  <Link key={portal.title} to={portal.to} className="group block">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_20px_50px_-34px_rgba(15,23,42,0.22)]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-xl text-slate-950">{portal.title}</h3>
                            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{portal.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.16)]">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-600" />
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Highest rated classes</p>
            </div>
            <div className="mt-4 space-y-3">
              {highestRatedCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{course.id}</p>
                    <p className="text-sm text-slate-600">{course.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-700">{course.rating.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.16)]">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-700" />
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Lowest rated classes</p>
            </div>
            <div className="mt-4 space-y-3">
              {lowestRatedCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{course.id}</p>
                    <p className="text-sm text-slate-600">{course.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{course.rating.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.16)]">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-700" />
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Highest GPA students</p>
            </div>
            <div className="mt-4 space-y-3">
              {highestGpaStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{student.name}</p>
                    <p className="text-sm text-slate-600">{student.status}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">{student.gpa.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

function PublicCourseReviewPreview({ courseId }: { courseId: string }) {
  const summary = useCourseReviewSummary(courseId);
  const reviews = useVisibleCourseReviews(courseId);

  if (summary.averageRating === null && reviews.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {summary.averageRating !== null && (
        <p className="text-xs font-medium text-slate-600">
          Visible review average: {summary.averageRating.toFixed(2)} / 5 from {summary.visibleReviewCount} review{summary.visibleReviewCount === 1 ? "" : "s"}
        </p>
      )}
      {reviews.slice(0, 1).map((review) => (
        <p key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
          {review.displayComment}
        </p>
      ))}
    </div>
  );
}
