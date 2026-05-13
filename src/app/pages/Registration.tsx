import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { useAuth } from "../auth/AuthProvider";
import { useCourses } from "../hooks/useCourses";
import { useStudentEnrollment } from "../hooks/useStudentEnrollment";
import { useSemesterPhase } from "../hooks/useSemesterPhase";
import { useSpecialReregEligible, useStudentSuspension } from "../hooks/usePhaseState";
import { SEMESTER_PHASES } from "../services/localSemesterRepository";
import { WEEKDAYS, formatMinutes, formatSchedule, type DayOfWeek } from "../domain/schedule";
import { localCourseRepository, type CourseState } from "../services/localCourseRepository";

type CourseAction =
  | { kind: "enroll" }
  | { kind: "waitlist" }
  | { kind: "retake" }
  | { kind: "drop-enrollment" }
  | { kind: "drop-waitlist" }
  | { kind: "blocked"; reason: string };

const MIN_COURSES = 2;
const MAX_COURSES = 4;
const SCHEDULE_START_MINUTES = 8 * 60;
const SCHEDULE_END_MINUTES = 20 * 60;
const SCHEDULE_HOUR_HEIGHT = 64;
const COURSE_COLORS = [
  "border-emerald-500 bg-emerald-100 text-emerald-950",
  "border-rose-500 bg-rose-100 text-rose-950",
  "border-amber-500 bg-amber-100 text-amber-950",
  "border-violet-500 bg-violet-100 text-violet-950",
  "border-sky-500 bg-sky-100 text-sky-950",
  "border-cyan-500 bg-cyan-100 text-cyan-950",
];

export function Registration() {
  const { user } = useAuth();
  const email = user?.email ?? "";
  const [phase] = useSemesterPhase();
  const specialReregEligible = useSpecialReregEligible(email);
  const suspension = useStudentSuspension(email);
  const inSpecialReReg = phase === "running" && specialReregEligible;
  const isRegistrationOpen = !suspension && (phase === "registration" || inSpecialReReg);
  const courses = useCourses();
  const enrollment = useStudentEnrollment(email);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);

  const decideAction = (course: CourseState): CourseAction => {
    if (enrollment.enrolled.some((entry) => entry.id === course.id)) {
      return { kind: "drop-enrollment" };
    }
    if (enrollment.waitlisted.some((entry) => entry.id === course.id)) {
      return { kind: "drop-waitlist" };
    }
    if (course.cancelled) {
      return { kind: "blocked", reason: course.cancelReason ?? "Course is cancelled" };
    }
    if (suspension) {
      return { kind: "blocked", reason: "Suspended students cannot register this semester." };
    }
    if (enrollment.hasPassed(course)) {
      return { kind: "blocked", reason: `Already completed with grade ${enrollment.priorGrade(course)}` };
    }
    const conflict = enrollment.hasConflictWith(course);
    if (conflict) {
      return { kind: "blocked", reason: `Time conflict with ${conflict.id}` };
    }
    if (enrollment.registeredCount >= MAX_COURSES) {
      return { kind: "blocked", reason: `Maximum ${MAX_COURSES} courses already selected` };
    }
    const seatsTaken = course.enrolledStudentIds.length;
    if (seatsTaken >= course.seats) {
      return { kind: "waitlist" };
    }
    if (enrollment.priorGrade(course) === "F") {
      return { kind: "retake" };
    }
    return { kind: "enroll" };
  };

  const performAction = (course: CourseState, action: CourseAction) => {
    if (!email) {
      setFeedback({ kind: "error", message: "Sign in before changing your course load." });
      return;
    }
    try {
      switch (action.kind) {
        case "enroll":
        case "retake": {
          const result = localCourseRepository.enroll(course.id, email);
          setFeedback({
            kind: "success",
            message:
              result.status === "enrolled"
                ? `${course.id} ${action.kind === "retake" ? "queued for retake" : "added"}.`
                : `${course.id} is full; placed on the waitlist.`,
          });
          return;
        }
        case "waitlist": {
          const result = localCourseRepository.enroll(course.id, email);
          setFeedback({
            kind: result.status === "enrolled" ? "success" : "info",
            message:
              result.status === "enrolled"
                ? `A seat just opened: enrolled in ${course.id}.`
                : `${course.id} added to your waitlist.`,
          });
          return;
        }
        case "drop-enrollment": {
          localCourseRepository.drop(course.id, email);
          setFeedback({ kind: "success", message: `Dropped ${course.id}.` });
          return;
        }
        case "drop-waitlist": {
          localCourseRepository.drop(course.id, email);
          setFeedback({ kind: "success", message: `Removed ${course.id} from your waitlist.` });
          return;
        }
        case "blocked":
          setFeedback({ kind: "error", message: action.reason });
      }
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to update registration.",
      });
    }
  };

  const totalCredits = enrollment.enrolled.reduce((sum, course) => sum + course.credits, 0);
  const registeredCourses = [...enrollment.enrolled, ...enrollment.waitlisted];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/student" className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="text-3xl text-slate-950">Course Registration</h1>
          <p className="mt-1 text-sm text-slate-600">
            Live enroll, drop, or queue for waitlist. Editable only during the registration phase.
          </p>
        </div>
        <Link to="/student/smart-cre">
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            View recommendations
          </Button>
        </Link>
      </div>

      {inSpecialReReg && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div className="text-sm text-emerald-900">
            <p className="font-medium">Special re-registration window open.</p>
            <p className="mt-1 text-emerald-800">
              One or more of your courses was cancelled. You may add replacement courses now even though the
              system has moved to the <span className="font-medium">Classes Running</span> phase.
            </p>
          </div>
        </div>
      )}

      {!isRegistrationOpen && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Lock className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">{suspension ? "Registration blocked by suspension." : "Registration is locked."}</p>
            <p className="mt-1 text-amber-800">
              {suspension
                ? "You reached 3 active warning points and are suspended for 1 semester. Resolve the fine with the registrar before returning to normal registration."
                : (
                    <>
                      The system is currently in the <span className="font-medium">{SEMESTER_PHASES.find((entry) => entry.id === phase)?.label}</span> phase.
                      Enroll, drop, and waitlist actions reopen when the registrar returns the cycle to Registration.
                    </>
                  )}
            </p>
          </div>
        </div>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardBody>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-blue-700" />
            <div>
              <h3 className="text-base text-blue-950">Registration rules</h3>
              <p className="mt-1 text-sm leading-6 text-blue-900">
                Register between {MIN_COURSES} and {MAX_COURSES} courses. Full sections route to the waitlist
                until the course instructor admits you. Courses you have already passed cannot be retaken; a
                previous F unlocks a retake.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            feedback.kind === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : feedback.kind === "info"
                ? "border border-amber-200 bg-amber-50 text-amber-800"
                : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <ScheduleBuilder
        registeredCourses={registeredCourses}
        waitlistedCourseIds={new Set(enrollment.waitlisted.map((course) => course.id))}
        totalCredits={totalCredits}
      />

      <div className="grid gap-6 xl:grid-cols-[1.65fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl text-slate-950">Available Courses</h2>
                <p className="mt-1 text-sm text-slate-600">Pick a course to enroll, drop, or join its waitlist.</p>
              </div>
              <Badge variant="neutral">UC-07</Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {courses.map((course) => {
                const action = decideAction(course);
                const enrolledCount = course.enrolledStudentIds.length;
                const waitlistCount = course.waitlistStudentIds.length;
                const seatsLeft = course.seats - enrolledCount;
                const isInteractive = isRegistrationOpen && action.kind !== "blocked";
                const buttonLabel =
                  action.kind === "drop-enrollment"
                    ? "Drop"
                    : action.kind === "drop-waitlist"
                      ? "Leave waitlist"
                      : action.kind === "waitlist"
                        ? "Join waitlist"
                        : action.kind === "retake"
                          ? "Retake (prior F)"
                          : action.kind === "enroll"
                            ? "Enroll"
                            : "Unavailable";
                const buttonVariant =
                  action.kind === "drop-enrollment" || action.kind === "drop-waitlist"
                    ? "outline"
                    : action.kind === "waitlist"
                      ? "secondary"
                      : action.kind === "retake"
                        ? "outline"
                        : "primary";

                return (
                  <div
                    key={course.id}
                    className={`flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between ${
                      action.kind === "drop-enrollment" || action.kind === "drop-waitlist"
                        ? "bg-blue-50/40"
                        : "bg-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg text-slate-950">{course.id}</h3>
                        <div className="inline-flex items-center gap-1 text-sm text-amber-700">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          {course.rating}
                        </div>
                        {course.cancelled && <Badge variant="danger">Cancelled</Badge>}
                        {action.kind === "drop-enrollment" && <Badge variant="success">Enrolled</Badge>}
                        {action.kind === "drop-waitlist" && <Badge variant="warning">Waitlisted</Badge>}
                        {action.kind === "waitlist" && <Badge variant="warning">Waitlist only</Badge>}
                        {action.kind === "retake" && <Badge variant="info">Retake eligible</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{course.name}</p>
                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span>{course.instructor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{formatSchedule(course.schedule)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>
                            {enrolledCount}/{course.seats} enrolled
                            {waitlistCount > 0 ? ` • ${waitlistCount} waiting` : ""}
                            {seatsLeft > 0 && seatsLeft <= 5 ? ` • ${seatsLeft} left` : ""}
                          </span>
                        </div>
                      </div>
                      {action.kind === "blocked" && (
                        <p className="mt-3 text-xs text-slate-500">{action.reason}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <Button
                        variant={buttonVariant as "primary" | "secondary" | "outline"}
                        size="sm"
                        onClick={() => performAction(course, action)}
                        disabled={!isInteractive}
                      >
                        {buttonLabel}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl text-slate-950">Summary</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Registered courses</span>
                <span className="font-medium text-slate-950">
                  {enrollment.registeredCount}/{MAX_COURSES}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all ${
                    enrollment.registeredCount >= MIN_COURSES && enrollment.registeredCount <= MAX_COURSES
                      ? "bg-emerald-500"
                      : enrollment.registeredCount > MAX_COURSES
                        ? "bg-red-500"
                        : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(enrollment.registeredCount / MAX_COURSES, 1) * 100}%` }}
                />
              </div>
              {enrollment.registeredCount < MIN_COURSES && (
                <p className="mt-2 text-xs text-amber-700">
                  Below the {MIN_COURSES}-course minimum. Add {MIN_COURSES - enrollment.registeredCount} more before
                  the registration phase closes.
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className="text-2xl text-slate-950">{enrollment.enrolled.length}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Enrolled</div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-center">
                <div className="text-2xl text-amber-700">{enrollment.waitlisted.length}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-amber-700">Waitlist</div>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 text-center">
                <div className="text-2xl text-blue-700">{totalCredits}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-blue-700">Credits</div>
              </div>
            </div>

            {enrollment.registeredCount > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-950">Your schedule</h3>
                {[...enrollment.enrolled, ...enrollment.waitlisted].map((course) => {
                  const isWaitlisted = enrollment.waitlisted.some((entry) => entry.id === course.id);
                  return (
                    <div key={course.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-950">{course.id}</div>
                          <div className="mt-1 text-xs text-slate-600">{course.name}</div>
                        </div>
                        <Badge variant={isWaitlisted ? "warning" : "success"}>
                          {isWaitlisted ? "Waitlist" : "Enrolled"}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">{formatSchedule(course.schedule)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">No courses registered yet.</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function colorForCourse(index: number) {
  return COURSE_COLORS[index % COURSE_COLORS.length];
}

function timeMarks() {
  const marks: number[] = [];
  for (let minutes = SCHEDULE_START_MINUTES; minutes <= SCHEDULE_END_MINUTES; minutes += 60) {
    marks.push(minutes);
  }
  return marks;
}

function clampToSchedule(minutes: number) {
  return Math.min(Math.max(minutes, SCHEDULE_START_MINUTES), SCHEDULE_END_MINUTES);
}

function blockStyle(course: CourseState) {
  const start = clampToSchedule(course.schedule.startMinutes);
  const end = clampToSchedule(course.schedule.endMinutes);
  const total = SCHEDULE_END_MINUTES - SCHEDULE_START_MINUTES;
  return {
    top: `${((start - SCHEDULE_START_MINUTES) / total) * 100}%`,
    height: `${Math.max(((end - start) / total) * 100, 6)}%`,
  };
}

function ScheduleBuilder({
  registeredCourses,
  waitlistedCourseIds,
  totalCredits,
}: {
  registeredCourses: CourseState[];
  waitlistedCourseIds: Set<string>;
  totalCredits: number;
}) {
  const marks = timeMarks();
  const scheduleHeight = ((SCHEDULE_END_MINUTES - SCHEDULE_START_MINUTES) / 60) * SCHEDULE_HOUR_HEIGHT;
  const courseColorById = new Map(registeredCourses.map((course, index) => [course.id, colorForCourse(index)]));
  const blocks = registeredCourses.flatMap((course) =>
    course.schedule.days.map((day) => ({
      course,
      day,
      color: courseColorById.get(course.id) ?? COURSE_COLORS[0],
    })),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-700" />
            <div>
              <h2 className="text-xl text-slate-950">Schedule Builder</h2>
              <p className="mt-1 text-sm text-slate-600">Weekly view of your enrolled and waitlisted classes.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="neutral">Result 1 of 1</Badge>
            <Badge variant={registeredCourses.length >= MIN_COURSES ? "success" : "warning"}>
              {registeredCourses.length}/{MAX_COURSES} courses
            </Badge>
            <Badge variant="info">{totalCredits} credits</Badge>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-950">Selected courses</p>
                  <p className="mt-1 text-xs text-slate-600">These blocks appear on the calendar.</p>
                </div>
                <Badge variant="neutral">{registeredCourses.length}</Badge>
              </div>
            </div>

            {registeredCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">Enroll or join a waitlist to preview your schedule.</p>
              </div>
            ) : (
              registeredCourses.map((course, index) => {
                const isWaitlisted = waitlistedCourseIds.has(course.id);
                return (
                  <div key={course.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className={`flex h-14 w-16 shrink-0 items-center justify-center rounded-xl border-l-4 text-center text-sm font-semibold ${colorForCourse(index)}`}>
                      {course.id.split(/(?=\d)/)[0]}
                      <br />
                      {course.id.replace(/^\D+/, "")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-950">{course.name}</p>
                        <Badge variant={isWaitlisted ? "warning" : "success"}>{isWaitlisted ? "Waitlisted" : "Enrolled"}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{course.instructor}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatSchedule(course.schedule)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Class details</span>
                <span className="h-5 w-9 rounded-full bg-slate-200 p-0.5">
                  <span className="block h-4 w-4 rounded-full bg-white shadow-sm" />
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Sort by
                <select className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                  <option>Earliest start</option>
                  <option>Course code</option>
                </select>
              </label>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <div className="min-w-[820px]">
                <div className="grid grid-cols-[72px_repeat(5,minmax(0,1fr))] border-b border-slate-200 bg-slate-100">
                  <div className="px-3 py-3 text-xs uppercase tracking-[0.14em] text-slate-500">Time</div>
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="border-l border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-950">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[72px_repeat(5,minmax(0,1fr))]">
                  <div className="relative bg-slate-50" style={{ height: scheduleHeight }}>
                    {marks.map((mark) => (
                      <div
                        key={mark}
                        className="absolute right-2 -translate-y-2 text-xs text-slate-500"
                        style={{ top: `${((mark - SCHEDULE_START_MINUTES) / (SCHEDULE_END_MINUTES - SCHEDULE_START_MINUTES)) * 100}%` }}
                      >
                        {formatMinutes(mark).replace(":00", "")}
                      </div>
                    ))}
                  </div>

                  {WEEKDAYS.map((day) => (
                    <div key={day} className="relative border-l border-slate-200" style={{ height: scheduleHeight }}>
                      {marks.map((mark) => (
                        <div
                          key={`${day}-${mark}`}
                          className="absolute left-0 right-0 border-t border-slate-100"
                          style={{ top: `${((mark - SCHEDULE_START_MINUTES) / (SCHEDULE_END_MINUTES - SCHEDULE_START_MINUTES)) * 100}%` }}
                        />
                      ))}

                      {blocks
                        .filter((block) => block.day === day)
                        .map(({ course, color }) => {
                          const isWaitlisted = waitlistedCourseIds.has(course.id);
                          return (
                            <div
                              key={`${course.id}-${day}`}
                              className={`absolute left-1 right-1 overflow-hidden rounded-xl border-l-4 px-2 py-2 text-center text-xs shadow-sm ${color} ${isWaitlisted ? "opacity-70" : ""}`}
                              style={blockStyle(course)}
                            >
                              <p className="font-semibold leading-tight">{course.id}</p>
                              <p className="leading-tight">LEC</p>
                              <p className="mt-1 truncate leading-tight">{course.name}</p>
                              <p className="mt-1 leading-tight">{formatMinutes(course.schedule.startMinutes)} - {formatMinutes(course.schedule.endMinutes)}</p>
                              {isWaitlisted && <p className="mt-1 font-medium">Waitlist</p>}
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-950">Term overview</span>
                <span className="text-slate-500">Spring 2026</span>
              </div>
              <div className="space-y-2">
                {registeredCourses.length === 0 ? (
                  <div className="h-5 rounded-full bg-slate-200" />
                ) : (
                  registeredCourses.map((course, index) => (
                    <div key={`term-${course.id}`} className={`h-5 rounded-full border ${colorForCourse(index)}`}>
                      <span className="block truncate px-3 text-center text-xs leading-5">{course.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
