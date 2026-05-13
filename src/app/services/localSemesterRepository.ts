import { localCourseRepository } from "./localCourseRepository";
import { localWarningsRepository } from "./localWarningsRepository";
import {
  localPhaseStateRepository,
  type CancelledCourseSummary,
  type TransitionSummary,
} from "./localPhaseStateRepository";
import { localGradingRepository } from "./localGradingRepository";
import { deriveInstructorEmail } from "../domain/instructor";
import { students as matriculatedStudents } from "../data/mockData";

export type SemesterPhase = "setup" | "registration" | "running" | "grading";

export const SEMESTER_PHASES: { id: SemesterPhase; label: string; description: string }[] = [
  { id: "setup", label: "Class Setup", description: "Registrars build the schedule, assign instructors, set class sizes." },
  { id: "registration", label: "Registration", description: "Matriculated students register 2-4 courses subject to time and seat rules." },
  { id: "running", label: "Classes Running", description: "Classes are in session. Low-enrollment courses cancelled; students under-loaded warned." },
  { id: "grading", label: "Grading", description: "Instructors post grades. Honor roll, warnings, and terminations resolve at close." },
];

const STORAGE_KEY = "college0.semester.phase";
const CHANGE_EVENT = "college0:semester:phase-changed";
const DEFAULT_PHASE: SemesterPhase = "registration";

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValidPhase(value: string | null): value is SemesterPhase {
  return value === "setup" || value === "registration" || value === "running" || value === "grading";
}

function applyRegistrationCloseRules(): TransitionSummary {
  const occurredAt = new Date().toISOString();
  const beforeCatalog = localCourseRepository.list();

  const toCancel = beforeCatalog.filter(
    (course) => !course.cancelled && course.enrolledStudentIds.length < 3,
  );

  const cancelledCourses: CancelledCourseSummary[] = [];
  const affectedStudents = new Set<string>();

  for (const course of toCancel) {
    course.enrolledStudentIds.forEach((email) => affectedStudents.add(email));
    course.waitlistStudentIds.forEach((email) => affectedStudents.add(email));
    localCourseRepository.markCancelled(course.id, "Below the 3-student minimum");
    cancelledCourses.push({ id: course.id, name: course.name, instructor: course.instructor });
  }

  const studentsFlaggedForReReg: string[] = [];
  for (const email of affectedStudents) {
    localPhaseStateRepository.markSpecialReregEligible(email);
    studentsFlaggedForReReg.push(email);
  }

  const instructorWarningCounts = new Map<string, number>();
  for (const course of cancelledCourses) {
    const instructorEmail = deriveInstructorEmail(course.instructor);
    localWarningsRepository.issue({
      subjectId: instructorEmail,
      subjectRole: "instructor",
      severity: 1,
      reason: `${course.id} (${course.name}) cancelled below the 3-student minimum.`,
      source: "auto:course-cancelled",
    });
    instructorWarningCounts.set(instructorEmail, (instructorWarningCounts.get(instructorEmail) ?? 0) + 1);
  }
  const instructorsWarned = Array.from(instructorWarningCounts.keys());

  const afterCatalog = localCourseRepository.list();
  const instructorsSuspended: string[] = [];
  for (const instructorEmail of instructorsWarned) {
    const stillActive = afterCatalog.filter(
      (course) => !course.cancelled && deriveInstructorEmail(course.instructor) === instructorEmail,
    );
    if (stillActive.length === 0) {
      localPhaseStateRepository.suspendInstructor(instructorEmail);
      instructorsSuspended.push(instructorEmail);
    }
  }

  const studentsWarnedUnderload: string[] = [];
  for (const student of matriculatedStudents) {
    const normalizedEmail = student.email.toLowerCase();
    const enrolledCount = afterCatalog.filter(
      (course) => !course.cancelled && course.enrolledStudentIds.includes(normalizedEmail),
    ).length;
    if (enrolledCount < 2) {
      localWarningsRepository.issue({
        subjectId: normalizedEmail,
        subjectRole: "student",
        severity: 1,
        reason: `Less than 2 enrolled courses at the close of registration (${enrolledCount} enrolled).`,
        source: "auto:under-loaded",
      });
      studentsWarnedUnderload.push(normalizedEmail);
    }
  }

  return {
    from: "registration",
    to: "running",
    occurredAt,
    cancelledCourses,
    studentsFlaggedForReReg,
    studentsWarnedUnderload,
    instructorsWarned,
    instructorsSuspended,
  };
}

function applyGradingCloseRules(): TransitionSummary {
  const occurredAt = new Date().toISOString();
  const catalog = localCourseRepository.list();

  const instructorsMissingGradesSet = new Set<string>();
  const instructorsWarnedClassGpaSet = new Set<string>();

  for (const course of catalog) {
    if (course.cancelled) continue;
    const instructorEmail = deriveInstructorEmail(course.instructor);
    const enrolledCount = course.enrolledStudentIds.length;
    if (enrolledCount === 0) continue;

    const missing = localGradingRepository.getMissingGradeCount(course.id);
    if (missing > 0) {
      localWarningsRepository.issue({
        subjectId: instructorEmail,
        subjectRole: "instructor",
        severity: 1,
        reason: `${course.id} (${course.name}) closed with ${missing} ungraded student(s).`,
        source: "auto:incomplete-grading",
      });
      instructorsMissingGradesSet.add(instructorEmail);
      continue;
    }

    const classGpa = localGradingRepository.getClassGpa(course.id);
    if (classGpa > 3.5 || classGpa < 2.5) {
      localWarningsRepository.issue({
        subjectId: instructorEmail,
        subjectRole: "instructor",
        severity: 1,
        reason: `${course.id} (${course.name}) closed with class GPA ${classGpa.toFixed(2)} outside the 2.5–3.5 band.`,
        source: "auto:class-gpa-outlier",
      });
      instructorsWarnedClassGpaSet.add(instructorEmail);
    }
  }

  const studentsTerminated: string[] = [];
  const studentsWarnedGpaInterview: string[] = [];
  const studentsHonorRoll: string[] = [];
  let warningsClearedByHonor = 0;

  for (const student of matriculatedStudents) {
    const normalizedEmail = student.email.toLowerCase();
    if (localPhaseStateRepository.isStudentTerminated(normalizedEmail)) continue;

    const { gpa: overallGpa, semestersCount } = localGradingRepository.getStudentOverallGpa(normalizedEmail);
    const semesterGpa = localGradingRepository.getStudentSemesterGpa(normalizedEmail);
    const failedTwice = localGradingRepository.hasFailedSameCourseTwice(normalizedEmail);

    if (overallGpa < 2.0 || failedTwice) {
      localPhaseStateRepository.terminateStudent(normalizedEmail);
      localWarningsRepository.issue({
        subjectId: normalizedEmail,
        subjectRole: "student",
        severity: 2,
        reason: failedTwice
          ? "Terminated: failed the same course twice."
          : `Terminated: overall GPA ${overallGpa.toFixed(2)} below 2.00.`,
        source: "auto:termination",
      });
      studentsTerminated.push(normalizedEmail);
      continue;
    }

    if (overallGpa >= 2.0 && overallGpa <= 2.25) {
      localWarningsRepository.issue({
        subjectId: normalizedEmail,
        subjectRole: "student",
        severity: 1,
        reason: `Overall GPA ${overallGpa.toFixed(2)} requires an interview with the registrar.`,
        source: "auto:gpa-interview",
      });
      studentsWarnedGpaInterview.push(normalizedEmail);
      continue;
    }

    const honorRollEligible = semesterGpa > 3.75 || (semestersCount > 1 && overallGpa > 3.5);
    if (honorRollEligible) {
      localPhaseStateRepository.markHonorRoll(normalizedEmail);
      studentsHonorRoll.push(normalizedEmail);
      const cleared = localWarningsRepository.clearOneWithHonor(
        normalizedEmail,
        `honor-roll-${occurredAt}`,
      );
      if (cleared) warningsClearedByHonor += 1;
    }
  }

  return {
    from: "grading",
    to: "setup",
    occurredAt,
    cancelledCourses: [],
    studentsFlaggedForReReg: [],
    studentsWarnedUnderload: [],
    instructorsWarned: [],
    instructorsSuspended: [],
    instructorsMissingGrades: Array.from(instructorsMissingGradesSet),
    instructorsWarnedClassGpa: Array.from(instructorsWarnedClassGpaSet),
    studentsTerminated,
    studentsWarnedGpaInterview,
    studentsHonorRoll,
    warningsClearedByHonor,
  };
}

export const localSemesterRepository = {
  getPhase(): SemesterPhase {
    if (!hasBrowserStorage()) return DEFAULT_PHASE;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isValidPhase(stored) ? stored : DEFAULT_PHASE;
  },

  setPhase(next: SemesterPhase) {
    if (!hasBrowserStorage()) return;
    const previous = localSemesterRepository.getPhase();
    window.localStorage.setItem(STORAGE_KEY, next);

    if (previous === "registration" && next === "running") {
      const summary = applyRegistrationCloseRules();
      localPhaseStateRepository.recordTransitionSummary(summary);
    } else if (previous === "grading" && next === "setup") {
      const summary = applyGradingCloseRules();
      localPhaseStateRepository.recordTransitionSummary(summary);
    }

    window.dispatchEvent(new CustomEvent<SemesterPhase>(CHANGE_EVENT, { detail: next }));
  },

  subscribe(callback: (phase: SemesterPhase) => void) {
    if (!hasBrowserStorage()) return () => {};
    const handler = (event: Event) => callback((event as CustomEvent<SemesterPhase>).detail);
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  },
};
