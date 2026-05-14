import { useState } from "react";
import { Link } from "react-router";
import {
  Calendar,
  MessageSquare,
  Sparkles,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  ShieldAlert,
  Award,
  Clock,
  XCircle,
  ClipboardList,
  CircleCheckBig,
  Star,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../auth/AuthProvider";
import { localCollegeRepository } from "../services/localCollegeRepository";
import { localCourseRepository } from "../services/localCourseRepository";
import { useStudentEnrollment } from "../hooks/useStudentEnrollment";
import { useStudentAcademicStatus, useStudentGradesThisSemester } from "../hooks/useGrading";
import { useGraduationStatus } from "../hooks/useGraduation";
import { useCourseReviewSummary, useOwnCourseReview, useVisibleCourseReviews } from "../hooks/useReviews";
import { localGraduationRepository, GRADUATION_THRESHOLD } from "../services/localGraduationRepository";
import { localReviewsRepository, type ReviewRating } from "../services/localReviewsRepository";
import { localGradingRepository } from "../services/localGradingRepository";
import { localComplaintsRepository, type ComplaintAgainstRole } from "../services/localComplaintsRepository";
import { useComplaints } from "../hooks/useComplaints";
import { useStudentFines, useStudentSuspension } from "../hooks/usePhaseState";
import { useSemesterPhase } from "../hooks/useSemesterPhase";
import { deriveInstructorEmail } from "../domain/instructor";
import { formatSchedule } from "../domain/schedule";

export function StudentDashboard() {
  const { user, completeStudentTutorial } = useAuth();
  const student = localCollegeRepository.getStudentProfile({
    name: user?.name ?? "Student",
    email: user?.email ?? "",
  });
  const enrollment = useStudentEnrollment(student.email);
  const { terminated, honorRoll } = useStudentAcademicStatus(student.email);
  const suspension = useStudentSuspension(student.email);
  const fines = useStudentFines(student.email);
  const unpaidFines = fines.filter((fine) => !fine.paidAt);
  const semesterGrades = useStudentGradesThisSemester(student.email);
  const graduation = useGraduationStatus(student.email);
  const { completedCourses } = localCollegeRepository.getStudentCourseSnapshot(student.email);

  const handleApplyToGraduate = () => {
    if (!student.email) return;
    localGraduationRepository.submitApplication(student.email);
  };
  const totalCoursesRequired = 8;
  const coursesCompleted = student.coursesCompleted;
  const progressPercentage = (coursesCompleted / totalCoursesRequired) * 100;

  return (
    <div className="space-y-8">
      {user?.role === "student" && user.needsStudentTutorial && (
        <section className="rounded-[28px] border border-blue-200 bg-blue-50 px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-blue-950">
                <CircleCheckBig className="h-5 w-5 text-blue-700" />
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-700">New student tutorial</p>
              </div>
              <h2 className="mt-3 text-2xl text-slate-950">Welcome to your College0 workspace</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Start with registration, keep your records close, and use the assistant when you need policy or planning help.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-4">
                  <Calendar className="h-5 w-5 text-blue-700" />
                  <p className="mt-3 text-sm font-medium text-slate-950">Register for courses</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">Select 2–4 courses each semester with no time conflicts.</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-4">
                  <ClipboardList className="h-5 w-5 text-emerald-700" />
                  <p className="mt-3 text-sm font-medium text-slate-950">View academic records</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">Track completed courses, grades, GPA, and graduation progress.</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-4">
                  <Star className="h-5 w-5 text-amber-600" />
                  <p className="mt-3 text-sm font-medium text-slate-950">Write course reviews</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">Rate courses 1–5 stars during the semester before grades are posted.</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-4">
                  <Sparkles className="h-5 w-5 text-purple-700" />
                  <p className="mt-3 text-sm font-medium text-slate-950">Smart recommendations</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">Let the CRE engine rank courses by fit, rating, and graduation progress.</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-4">
                  <MessageSquare className="h-5 w-5 text-amber-700" />
                  <p className="mt-3 text-sm font-medium text-slate-950">AI assistant</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">Ask about policies, registration rules, and your academic standing.</p>
                </div>
              </div>
            </div>

            <div className="flex w-full max-w-sm flex-col gap-3">
              <Link to="/student/registration">
                <Button variant="primary" className="w-full">
                  Open registration
                </Button>
              </Link>
              <Link to="/student/smart-cre">
                <Button variant="secondary" className="w-full">
                  View recommendations
                </Button>
              </Link>
              <Link to="/student/records">
                <Button variant="secondary" className="w-full">
                  View records
                </Button>
              </Link>
              <Button variant="ghost" className="w-full" onClick={completeStudentTutorial}>
                Mark tutorial complete
              </Button>
            </div>
          </div>
        </section>
      )}

      {terminated && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-700" />
          <div className="text-sm text-red-900">
            <p className="font-medium">Enrollment terminated at the close of grading.</p>
            <p className="mt-1 text-red-800">
              Your overall GPA fell below 2.0 or you failed the same course twice. You will not be eligible to
              register for future semesters until the registrar reviews your case.
            </p>
          </div>
        </div>
      )}

      {suspension && !terminated && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-700" />
          <div className="text-sm text-red-900">
            <p className="font-medium">Suspended for 1 semester after 3 warning points.</p>
            <p className="mt-1 text-red-800">
              Your registration access is blocked for {suspension.semester}. You must pay the registrar fine
              before returning to normal standing.
            </p>
          </div>
        </div>
      )}

      {unpaidFines.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Registrar fine due: ${unpaidFines.reduce((sum, fine) => sum + fine.amount, 0)}</p>
            <p className="mt-1 text-amber-800">
              Fine reason: {unpaidFines[0].reason} Contact the registrar to record payment.
            </p>
          </div>
        </div>
      )}

      {honorRoll && !terminated && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <Award className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div className="text-sm text-emerald-900">
            <p className="font-medium">Honor Roll — congratulations.</p>
            <p className="mt-1 text-emerald-800">
              Your semester or overall GPA crossed the honor threshold. One of your existing warnings (if any)
              has been automatically cleared.
            </p>
          </div>
        </div>
      )}

      {graduation.status === "graduated" && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <GraduationCap className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div className="text-sm text-emerald-900">
            <p className="font-medium">Bachelor's Degree conferred.</p>
            <p className="mt-1 text-emerald-800">
              Your graduation application was approved. The registrar will be in touch with ceremony details.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="overflow-hidden border-slate-900/0 bg-[linear-gradient(135deg,#0f2137_0%,#14365e_45%,#1f5ea2_100%)] text-white">
          <CardBody className="relative">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-32 w-32 rounded-tl-[3rem] bg-white/8" />
            <div className="relative max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-100/80">Student workspace</p>
              <h1 className="mt-4 text-4xl text-white md:text-5xl">Welcome back, {student.name}</h1>
              <p className="mt-4 text-base leading-7 text-blue-100/85">
                Your next registration window is open. Keep an eye on progress requirements, active course load, and recommendation signals before seats tighten.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2">Spring 2026 semester</div>
                <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100">Good academic standing</div>
                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2">AI planning enabled</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="!border-slate-900 !bg-slate-950 !text-white">
          <CardBody className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Degree completion</p>
              <div className="mt-3 flex items-end gap-3">
                <div className="text-5xl font-semibold text-white">{Math.round(progressPercentage)}%</div>
                <div className="pb-2 text-sm text-slate-400">{coursesCompleted} of {totalCoursesRequired} courses</div>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300" style={{ width: `${progressPercentage}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/5 p-4 text-white">
                <div className="text-slate-400">Current GPA</div>
                <div className="mt-2 text-2xl font-semibold text-white">{student.gpa}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 text-white">
                <div className="text-slate-400">Warnings</div>
                <div className="mt-2 text-2xl font-semibold text-white">{student.warnings}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Academic status</p>
            <div className="mt-4 text-4xl text-slate-950">{student.gpa}</div>
            <div className="mt-1 text-sm text-slate-600">Current GPA across active coursework</div>
            <div className="mt-4">
              <Badge variant="success">{student.status}</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Course load</p>
            <div className="mt-4 text-4xl text-slate-950">{enrollment.enrolled.length}</div>
            <div className="mt-1 text-sm text-slate-600">Enrolled courses this semester</div>
            <div className="mt-4">
              <Badge variant="info">Active</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Program progress</p>
            <div className="mt-4 text-4xl text-slate-950">{coursesCompleted}/{totalCoursesRequired}</div>
            <div className="mt-1 text-sm text-slate-600">Completed course requirement</div>
            <div className="mt-4">
              <Badge variant="neutral">{Math.round(progressPercentage)}% Complete</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Advising risk</p>
            <div className="mt-4 text-4xl text-slate-950">{student.warnings}</div>
            <div className="mt-1 text-sm text-slate-600">Open warnings on your record</div>
            <div className="mt-4">
              <Badge variant="success">Good Standing</Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      {student.gpa < 2.5 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="mb-1 text-yellow-900">Academic Warning</h3>
                <p className="text-sm text-yellow-800">
                  Your GPA is below 2.5. Please consult with your advisor.
                  <span className="ml-2 rounded bg-yellow-200 px-2 py-0.5 text-xs">BR-05</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/student/registration">
          <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_26px_60px_-40px_rgba(15,23,42,0.4)]">
            <CardBody>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-slate-950">Register for Courses</h3>
              <p className="text-sm leading-6 text-slate-600">Review seat availability, prerequisites, and schedule fit before checkout.</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">UC-07</p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/student/smart-cre">
          <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_26px_60px_-40px_rgba(15,23,42,0.4)]">
            <CardBody>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="mb-2 text-slate-950">Smart Recommendations</h3>
              <p className="text-sm leading-6 text-slate-600">See which courses improve progress, fit your interests, and match your history.</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">AI-powered</p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/student/ai-assistant">
          <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_26px_60px_-40px_rgba(15,23,42,0.4)]">
            <CardBody>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-slate-950">AI Assistant</h3>
              <p className="text-sm leading-6 text-slate-600">Ask about rules, course choices, and next steps without jumping between screens.</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">UC-17</p>
            </CardBody>
          </Card>
        </Link>

        <GraduationApplyCard
          status={graduation.status}
          passingCompletions={graduation.passingCompletions}
          latestRegistrarNote={graduation.latestApplication?.registrarNote}
          terminated={terminated}
          onApply={handleApplyToGraduate}
        />
      </div>

      <div className="relative">
        <Card badge="BR-01">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl">Graduation Progress</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="mb-4">
              <div className="mb-2 flex justify-between">
                <span className="text-sm text-slate-600">
                  {coursesCompleted} of {totalCoursesRequired} courses completed
                </span>
                <span className="text-sm text-blue-600">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-[linear-gradient(90deg,#154a8a_0%,#2d73c7_60%,#73c5f2_100%)] transition-all" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              You need to complete {totalCoursesRequired - coursesCompleted} more courses to graduate. Keep up the great work!
            </p>
          </CardBody>
        </Card>
      </div>

      <StudentComplaintPanel studentEmail={student.email} enrolledCourses={enrollment.enrolled} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl">Enrolled Courses</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">Spring 2026</p>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {enrollment.enrolled.length === 0 && enrollment.waitlisted.length === 0 ? (
                <div className="px-6 py-6 text-sm text-slate-600">
                  No active enrollments yet.{" "}
                  <Link to="/student/registration" className="font-medium text-blue-700 hover:text-blue-800">
                    Open registration
                  </Link>{" "}
                  to add courses.
                </div>
              ) : (
                <>
                  {enrollment.enrolled.map((course) => (
                    <div key={course.id} className="p-6 transition-colors hover:bg-slate-50/80">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3 className="mb-1 text-slate-900">{course.id}</h3>
                          <p className="text-sm text-slate-600">{course.name}</p>
                        </div>
                        <Badge variant="info">Enrolled</Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                        <span>{course.instructor}</span>
                        <span>&bull;</span>
                        <span>{formatSchedule(course.schedule)}</span>
                      </div>
                      <StudentCourseReviewPanel courseId={course.id} courseName={course.name} studentEmail={student.email} />
                    </div>
                  ))}
                  {enrollment.waitlisted.map((course) => (
                    <div key={course.id} className="p-6 transition-colors hover:bg-slate-50/80">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3 className="mb-1 text-slate-900">{course.id}</h3>
                          <p className="text-sm text-slate-600">{course.name}</p>
                        </div>
                        <Badge variant="warning">Waitlisted</Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                        <span>{course.instructor}</span>
                        <span>&bull;</span>
                        <span>{formatSchedule(course.schedule)}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl">Course History</h2>
            <p className="mt-1 text-sm text-slate-600">Completed Courses</p>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {completedCourses.map((course) => (
                <div key={course.id} className="p-6 transition-colors hover:bg-slate-50/80">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="mb-1 text-slate-900">{course.id}</h3>
                      <p className="text-sm text-slate-600">{course.name}</p>
                    </div>
                    <Badge variant="success">Grade: {course.grade}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {course.semester} &bull; {course.credits} Credits
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {graduation.status === "rejected" && !terminated && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <XCircle className="mt-0.5 h-5 w-5 text-red-700" />
          <div className="text-sm text-red-900">
            <p className="font-medium">Graduation application rejected.</p>
            <p className="mt-1 text-red-800">
              Registrar note: {graduation.latestApplication?.registrarNote ?? "No reason provided."}
            </p>
            <p className="mt-1 text-red-800">
              A reckless-application warning was added to your record. You may re-apply after completing more
              courses.
            </p>
          </div>
        </div>
      )}

      {semesterGrades.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl">Posted Grades — This Semester</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">Live as your instructors enter them.</p>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {semesterGrades.map((record) => {
                const course = localCourseRepository.get(record.courseId);
                return (
                  <div key={record.id} className="flex items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-slate-950">{record.courseId}</div>
                      {course && <div className="mt-1 text-xs text-slate-600">{course.name}</div>}
                    </div>
                    <Badge variant={record.grade === "F" ? "danger" : "success"}>Grade: {record.grade}</Badge>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function StudentCourseReviewPanel({
  courseId,
  courseName,
  studentEmail,
}: {
  courseId: string;
  courseName: string;
  studentEmail: string;
}) {
  const ownReview = useOwnCourseReview(courseId, studentEmail);
  const visibleReviews = useVisibleCourseReviews(courseId);
  const summary = useCourseReviewSummary(courseId);
  const [phase] = useSemesterPhase();
  const isReviewPhase = phase === "running";
  const gradePosted = Boolean(localGradingRepository.getGrade({ courseId, studentEmail }));
  const [rating, setRating] = useState<ReviewRating>(5);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const submit = () => {
    setFeedback(null);
    try {
      const review = localReviewsRepository.submitReview({
        courseId,
        studentEmail,
        rating,
        comment,
      });
      setComment("");
      setFeedback({
        kind: "success",
        message:
          review.visibility === "hidden"
            ? "Review received and hidden because it matched 3 or more taboo words."
            : review.tabooCount > 0
              ? "Review posted with taboo words masked."
              : "Review posted.",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to submit review.",
      });
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-950">Course reviews</p>
          <p className="mt-1 text-xs text-slate-600">
            {summary.averageRating === null
              ? "No visible reviews yet."
              : `${summary.averageRating.toFixed(2)} average from ${summary.visibleReviewCount} visible review${summary.visibleReviewCount === 1 ? "" : "s"}.`}
          </p>
        </div>
        {!isReviewPhase && <Badge variant="neutral">Opens during Classes Running</Badge>}
        {gradePosted && <Badge variant="warning">Review closed after grade posting</Badge>}
      </div>

      {visibleReviews.length > 0 && (
        <div className="mt-4 space-y-2">
          {visibleReviews.slice(0, 2).map((review) => (
            <div key={review.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
              <div className="flex items-center gap-1 text-amber-600">
                {Array.from({ length: review.rating }).map((_, index) => (
                  <Star key={`${review.id}-${index}`} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{review.displayComment}</p>
            </div>
          ))}
        </div>
      )}

      {!ownReview && !gradePosted && isReviewPhase && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {([1, 2, 3, 4, 5] as ReviewRating[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                  rating >= value
                    ? "border-amber-300 bg-amber-50 text-amber-600"
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                }`}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                <Star className={`h-4 w-4 ${rating >= value ? "fill-current" : ""}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={`Write your review of ${courseName}.`}
            className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={submit}>
              Submit review
            </Button>
          </div>
        </div>
      )}

      {!ownReview && !gradePosted && !isReviewPhase && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Reviews can be submitted only while classes are running.
        </div>
      )}

      {ownReview && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Your review has been recorded. {ownReview.visibility === "hidden" ? "It is hidden from public view." : "It is visible to others."}
        </div>
      )}

      {feedback && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
          feedback.kind === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-red-200 bg-red-50 text-red-900"
        }`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}

function StudentComplaintPanel({
  studentEmail,
  enrolledCourses,
}: {
  studentEmail: string;
  enrolledCourses: ReturnType<typeof useStudentEnrollment>["enrolled"];
}) {
  const complaints = useComplaints().filter((complaint) => complaint.filedByEmail === studentEmail.toLowerCase());
  const [courseId, setCourseId] = useState(enrolledCourses[0]?.id ?? "");
  const [againstRole, setAgainstRole] = useState<ComplaintAgainstRole>("instructor");
  const [targetEmail, setTargetEmail] = useState("");
  const [type, setType] = useState("Instructor Conduct");
  const [details, setDetails] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const selectedCourse = enrolledCourses.find((course) => course.id === courseId) ?? enrolledCourses[0];
  const effectiveCourseId = courseId || selectedCourse?.id || "";
  const effectiveTargetEmail =
    againstRole === "instructor"
      ? deriveInstructorEmail(selectedCourse?.instructor ?? "")
      : targetEmail;

  const submitComplaint = () => {
    setFeedback(null);
    try {
      localComplaintsRepository.submit({
        filedByRole: "student",
        filedByEmail: studentEmail,
        filedAgainstRole: againstRole,
        filedAgainstEmail: effectiveTargetEmail,
        courseId: effectiveCourseId,
        type,
        details,
      });
      setDetails("");
      if (againstRole === "student") setTargetEmail("");
      setFeedback({ kind: "success", message: "Complaint submitted to the registrar." });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to submit complaint.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-700" />
            <h2 className="text-xl">Complaints</h2>
          </div>
          <Badge variant="neutral">{complaints.length} filed</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">Ask the registrar to investigate another student or an instructor.</p>
      </CardHeader>
      <CardBody className="space-y-4">
        {enrolledCourses.length === 0 ? (
          <p className="text-sm text-slate-600">You need an active course before filing a course-related complaint.</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Course</span>
                <select
                  value={effectiveCourseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {enrolledCourses.map((course) => (
                    <option key={course.id} value={course.id}>{course.id} - {course.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Complaint about</span>
                <select
                  value={againstRole}
                  onChange={(event) => {
                    const nextRole = event.target.value as ComplaintAgainstRole;
                    setAgainstRole(nextRole);
                    setType(nextRole === "instructor" ? "Instructor Conduct" : "Student Conduct");
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <option value="instructor">Course instructor</option>
                  <option value="student">Another student</option>
                </select>
              </label>
            </div>

            {againstRole === "student" ? (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Student email</span>
                <input
                  value={targetEmail}
                  onChange={(event) => setTargetEmail(event.target.value)}
                  placeholder="student@college0.edu"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </label>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Instructor target: <span className="font-medium text-slate-950">{effectiveTargetEmail || "Select a course"}</span>
              </div>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Complaint type</span>
              <input
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Describe what the registrar should investigate."
              className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
            <div className="flex justify-end">
              <Button variant="primary" onClick={submitComplaint}>Submit complaint</Button>
            </div>
          </>
        )}

        {feedback && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}>
            {feedback.message}
          </div>
        )}

        {complaints.length > 0 && (
          <div className="space-y-2">
            {complaints.slice(0, 3).map((complaint) => (
              <div key={complaint.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-950">{complaint.type}</span>
                  <Badge variant={complaint.status === "resolved" ? "success" : complaint.status === "open" ? "danger" : "warning"}>
                    {complaint.status === "under_review" ? "Under Review" : complaint.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600">{complaint.courseId} - against {complaint.filedAgainstRole}</p>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function GraduationApplyCard({
  status,
  passingCompletions,
  latestRegistrarNote,
  terminated,
  onApply,
}: {
  status: "none" | "pending" | "approved" | "rejected" | "graduated";
  passingCompletions: number;
  latestRegistrarNote?: string;
  terminated: boolean;
  onApply: () => void;
}) {
  if (status === "graduated") {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardBody>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <GraduationCap className="h-6 w-6 text-emerald-700" />
          </div>
          <h3 className="mb-2 text-emerald-950">Bachelor's Degree</h3>
          <p className="text-sm leading-6 text-emerald-900">
            Conferred. Welcome to the alumni community.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-emerald-700">Status</p>
        </CardBody>
      </Card>
    );
  }

  if (status === "pending") {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardBody>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
            <Clock className="h-6 w-6 text-amber-700" />
          </div>
          <h3 className="mb-2 text-amber-950">Graduation review pending</h3>
          <p className="text-sm leading-6 text-amber-900">
            Your application is in the registrar's queue. {passingCompletions} of {GRADUATION_THRESHOLD} courses
            counted at submission.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-amber-700">Awaiting review</p>
        </CardBody>
      </Card>
    );
  }

  const eligible = passingCompletions >= GRADUATION_THRESHOLD;
  const disabled = terminated;
  const subline = terminated
    ? "Termination blocks new applications."
    : eligible
      ? "You meet the 8-course threshold."
      : `${passingCompletions} of ${GRADUATION_THRESHOLD} passing courses — registrar approval needed below threshold.`;

  return (
    <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_26px_60px_-40px_rgba(15,23,42,0.4)]">
      <CardBody>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
          <GraduationCap className="h-6 w-6 text-emerald-600" />
        </div>
        <h3 className="mb-2 text-slate-950">Apply to Graduate</h3>
        <p className="text-sm leading-6 text-slate-600">{subline}</p>
        {status === "rejected" && latestRegistrarNote && (
          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-800">
            Last rejection: {latestRegistrarNote}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Badge variant={eligible ? "success" : "warning"}>
            {passingCompletions}/{GRADUATION_THRESHOLD}
          </Badge>
          <Button variant="primary" size="sm" onClick={onApply} disabled={disabled}>
            {status === "rejected" ? "Re-apply" : "Apply"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
