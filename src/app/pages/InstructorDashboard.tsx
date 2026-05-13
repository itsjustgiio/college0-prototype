import { useState } from "react";
import { BookOpen, Users, TrendingUp, AlertCircle, ClipboardCheck, Lock, UserPlus, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../auth/AuthProvider";
import { localCollegeRepository } from "../services/localCollegeRepository";
import { useCourses } from "../hooks/useCourses";
import { formatSchedule } from "../domain/schedule";
import { localCourseRepository } from "../services/localCourseRepository";
import { useSemesterPhase } from "../hooks/useSemesterPhase";
import { SEMESTER_PHASES } from "../services/localSemesterRepository";
import { useInstructorSuspension } from "../hooks/usePhaseState";
import { useCourseGrades } from "../hooks/useGrading";
import { localGradingRepository } from "../services/localGradingRepository";
import { GRADE_OPTIONS, isLetterGrade } from "../domain/grading";
import { resolveStudentDisplayName } from "../domain/student";

function InstructorHeader({
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

export function InstructorDashboard() {
  const { user } = useAuth();
  useCourses();
  const isSuspended = useInstructorSuspension(user?.email ?? "");
  const instructorCourses = localCollegeRepository.getInstructorCourses({
    email: user?.email ?? "",
    name: user?.name ?? "",
  });
  const studentsList = localCollegeRepository.getInstructorRoster(user?.email ?? "");
  const waitlistStudents = localCollegeRepository.getInstructorWaitlist(user?.email ?? "");
  const averageRating = instructorCourses.length
    ? (instructorCourses.reduce((sum, course) => sum + course.rating, 0) / instructorCourses.length).toFixed(1)
    : "0.0";
  const lowestEnrollmentCourse = [...instructorCourses].sort(
    (a, b) => a.enrolledStudentIds.length - b.enrolledStudentIds.length,
  )[0];

  return (
    <div className="space-y-6">
      <InstructorHeader
        title="Instructor Dashboard"
        description="A snapshot of your teaching load, student activity, and grading work."
      />

      {isSuspended && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-700" />
          <div className="text-sm text-red-900">
            <p className="font-medium">Teaching privileges suspended for the next cycle.</p>
            <p className="mt-1 text-red-800">
              All of your assigned courses were cancelled for low enrollment. You will not be assigned classes
              for the next semester. Contact the registrar if you believe this was issued in error.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned courses</p>
            <div className="mt-3 text-4xl text-slate-950">{instructorCourses.length}</div>
            <div className="mt-2"><Badge variant="info">Spring 2026</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Students</p>
            <div className="mt-3 text-4xl text-slate-950">{studentsList.length}</div>
            <div className="mt-2"><Badge variant="success">Active roster</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Waitlist</p>
            <div className="mt-3 text-4xl text-slate-950">{waitlistStudents.length}</div>
            <div className="mt-2"><Badge variant="warning">Pending review</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Average rating</p>
            <div className="mt-3 text-4xl text-slate-950">{averageRating}</div>
            <div className="mt-2"><Badge variant="success">Excellent</Badge></div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl text-slate-950">Current Courses</h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {instructorCourses.map((course) => (
                <div key={course.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-950">{course.id}</h3>
                      <p className="mt-1 text-sm text-slate-600">{course.name}</p>
                      <div className="mt-2 text-xs text-slate-500">{formatSchedule(course.schedule)}</div>
                    </div>
                    <Badge variant={course.enrolledStudentIds.length >= course.seats ? "danger" : "success"}>
                      {course.enrolledStudentIds.length}/{course.seats} enrolled
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {lowestEnrollmentCourse && (
          <Card className="border-amber-200 bg-amber-50">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="text-base text-amber-950">Low enrollment alert</h3>
                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    {lowestEnrollmentCourse.id} {lowestEnrollmentCourse.name} is currently the lightest section in your teaching load and may need review if the roster stays low.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

export function InstructorCoursesPage() {
  const { user } = useAuth();
  const [phase] = useSemesterPhase();
  const isRegistrationOpen = phase === "registration";
  useCourses();
  const instructorCourses = localCollegeRepository.getInstructorCourses({
    email: user?.email ?? "",
    name: user?.name ?? "",
  });
  const [admissionMessage, setAdmissionMessage] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const admit = (courseId: string, studentEmail: string) => {
    setAdmissionMessage(null);
    try {
      localCourseRepository.admitFromWaitlist(courseId, studentEmail);
      setAdmissionMessage({
        kind: "success",
        message: `Admitted ${resolveStudentDisplayName(studentEmail)} into ${courseId}.`,
      });
    } catch (error) {
      setAdmissionMessage({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to admit student.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <InstructorHeader
        title="My Courses"
        description="Detailed course status, capacity, and waitlist load for your sections."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Teaching Load</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Course</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Time</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Enrolled</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Capacity</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Rating</th>
                  <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.16em] text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instructorCourses.map((course) => {
                  const enrolledCount = course.enrolledStudentIds.length;
                  return (
                    <tr key={course.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-950">{course.id}</div>
                        <div className="mt-1 text-xs text-slate-600">{course.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{formatSchedule(course.schedule)}</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-950">{enrolledCount}</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-700">{course.seats}</td>
                      <td className="px-6 py-4 text-center text-sm text-amber-700">{course.rating}</td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={enrolledCount >= course.seats ? "danger" : enrolledCount < 20 ? "warning" : "success"}>
                          {enrolledCount >= course.seats ? "Full" : enrolledCount < 20 ? "Watch" : "Healthy"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-700" />
              <h2 className="text-xl text-slate-950">Waitlist Admission</h2>
            </div>
            {!isRegistrationOpen && (
              <Badge variant="warning">Registration locked</Badge>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {!isRegistrationOpen && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Lock className="mt-0.5 h-4 w-4 text-amber-700" />
              <p className="text-sm text-amber-900">
                Admit actions are available only during the{" "}
                <span className="font-medium">Registration</span> phase. The system is currently in the{" "}
                <span className="font-medium">{SEMESTER_PHASES.find((entry) => entry.id === phase)?.label}</span>{" "}
                phase.
              </p>
            </div>
          )}

          {admissionMessage && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                admissionMessage.kind === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {admissionMessage.message}
            </div>
          )}

          {instructorCourses.length === 0 ? (
            <p className="text-sm text-slate-600">No assigned courses yet.</p>
          ) : (
            instructorCourses.map((course) => {
              const seatsTaken = course.enrolledStudentIds.length;
              const seatsFree = course.seats - seatsTaken;
              const waitlist = course.waitlistStudentIds;

              return (
                <div key={course.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-medium text-slate-950">{course.id}</h3>
                      <p className="mt-1 text-sm text-slate-600">{course.name}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span>
                        {seatsTaken}/{course.seats} seats
                      </span>
                      <Badge variant={seatsFree > 0 ? "success" : "warning"}>
                        {seatsFree > 0 ? `${seatsFree} free` : "Full"}
                      </Badge>
                    </div>
                  </div>

                  {waitlist.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No students currently waiting.</p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {waitlist.map((studentEmail, index) => {
                        const canAdmit = isRegistrationOpen && seatsFree > 0;
                        return (
                          <div
                            key={studentEmail}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm text-amber-700">
                                {index + 1}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-950">
                                  {resolveStudentDisplayName(studentEmail)}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{studentEmail}</div>
                              </div>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              className="gap-2"
                              onClick={() => admit(course.id, studentEmail)}
                              disabled={!canAdmit}
                            >
                              <UserPlus className="h-4 w-4" />
                              Admit
                            </Button>
                          </div>
                        );
                      })}
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

export function InstructorStudentsPage() {
  const { user } = useAuth();
  const studentsList = localCollegeRepository.getInstructorRoster(user?.email ?? "");

  return (
    <div className="space-y-6">
      <InstructorHeader
        title="Students"
        description="Roster health, attendance, and standing for the students in your sections."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Roster Overview</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Student</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Course</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Grade</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Attendance</th>
                  <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.16em] text-slate-500">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsList.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-950">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{student.course}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-950">{student.grade}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700">{student.attendance}%</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={student.status === "Good Standing" ? "success" : "warning"}>{student.status}</Badge>
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

export function InstructorGradingPage() {
  const { user } = useAuth();
  const [phase] = useSemesterPhase();
  const isGradingOpen = phase === "grading";
  useCourses();
  const instructorCourses = localCollegeRepository.getInstructorCourses({
    email: user?.email ?? "",
    name: user?.name ?? "",
  });

  return (
    <div className="space-y-6">
      <InstructorHeader
        title="Grading"
        description="Post a letter grade for each enrolled student. Editable only during the grading phase."
      />

      {!isGradingOpen && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Lock className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Grade entry is locked.</p>
            <p className="mt-1 text-amber-800">
              The system is currently in the <span className="font-medium">{SEMESTER_PHASES.find((entry) => entry.id === phase)?.label}</span> phase.
              Grade entry reopens when the registrar advances to the Grading phase.
            </p>
          </div>
        </div>
      )}

      {instructorCourses.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-600">No assigned courses to grade yet.</p>
          </CardBody>
        </Card>
      ) : (
        instructorCourses.map((course) => (
          <CourseGradingPanel
            key={course.id}
            courseId={course.id}
            courseName={course.name}
            enrolledStudentIds={course.enrolledStudentIds}
            instructorEmail={user?.email ?? ""}
            isEditable={isGradingOpen}
          />
        ))
      )}
    </div>
  );
}

function CourseGradingPanel({
  courseId,
  courseName,
  enrolledStudentIds,
  instructorEmail,
  isEditable,
}: {
  courseId: string;
  courseName: string;
  enrolledStudentIds: string[];
  instructorEmail: string;
  isEditable: boolean;
}) {
  const records = useCourseGrades(courseId);
  const gradedCount = records.length;
  const total = enrolledStudentIds.length;
  const classGpa = localGradingRepository.getClassGpa(courseId);
  const gpaOutlier = total > 0 && gradedCount === total && (classGpa > 3.5 || classGpa < 2.5);

  const gradeByStudent = new Map(records.map((record) => [record.studentEmail, record.grade]));

  const handleChange = (studentEmail: string, value: string) => {
    if (!value) {
      localGradingRepository.clearGrade({ courseId, studentEmail });
      return;
    }
    if (!isLetterGrade(value)) return;
    localGradingRepository.setGrade({
      courseId,
      studentEmail,
      grade: value,
      instructorEmail,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-700" />
            <div>
              <h2 className="text-xl text-slate-950">{courseId}</h2>
              <p className="mt-1 text-sm text-slate-600">{courseName}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={gradedCount === total && total > 0 ? "success" : "warning"}>
              {gradedCount}/{total} graded
            </Badge>
            {gradedCount > 0 && (
              <Badge variant={gpaOutlier ? "danger" : "neutral"}>
                Class GPA {classGpa.toFixed(2)}
              </Badge>
            )}
            {gpaOutlier && <Badge variant="danger">Outlier (review at close)</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {total === 0 ? (
          <div className="px-6 py-6 text-sm text-slate-600">No enrolled students to grade.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {enrolledStudentIds.map((studentEmail) => {
              const grade = gradeByStudent.get(studentEmail) ?? "";
              return (
                <div
                  key={studentEmail}
                  className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-950">
                      {resolveStudentDisplayName(studentEmail)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{studentEmail}</div>
                  </div>
                  <select
                    value={grade}
                    onChange={(event) => handleChange(studentEmail, event.target.value)}
                    disabled={!isEditable}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">Not graded</option>
                    {GRADE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
