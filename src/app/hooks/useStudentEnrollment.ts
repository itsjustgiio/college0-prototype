import { useMemo } from "react";
import { useCourses } from "./useCourses";
import type { CourseState } from "../services/localCourseRepository";
import { schedulesConflict } from "../domain/schedule";
import { localCollegeRepository } from "../services/localCollegeRepository";

export interface StudentEnrollmentView {
  enrolled: CourseState[];
  waitlisted: CourseState[];
  hasConflictWith: (candidate: CourseState) => CourseState | null;
  priorGrade: (candidate: CourseState) => string | null;
  hasPassed: (candidate: CourseState) => boolean;
  registeredCount: number;
}

export function useStudentEnrollment(email: string): StudentEnrollmentView {
  const catalog = useCourses();
  const normalizedEmail = email.trim().toLowerCase();

  return useMemo(() => {
    const enrolled = catalog.filter((course) => course.enrolledStudentIds.includes(normalizedEmail));
    const waitlisted = catalog.filter((course) => course.waitlistStudentIds.includes(normalizedEmail));

    const snapshot = normalizedEmail
      ? localCollegeRepository.getStudentCourseSnapshot(normalizedEmail)
      : { completedCourses: [], enrolledCourses: [] };

    const priorGradeByCourse = new Map<string, string>();
    for (const entry of snapshot.completedCourses) {
      priorGradeByCourse.set(entry.id, entry.grade);
    }

    const hasConflictWith = (candidate: CourseState): CourseState | null => {
      const collision = enrolled.find((current) => schedulesConflict(current.schedule, candidate.schedule));
      return collision ?? null;
    };

    const priorGrade = (candidate: CourseState): string | null =>
      priorGradeByCourse.get(candidate.id) ?? null;

    const hasPassed = (candidate: CourseState): boolean => {
      const grade = priorGradeByCourse.get(candidate.id);
      return Boolean(grade && grade !== "F");
    };

    return {
      enrolled,
      waitlisted,
      hasConflictWith,
      priorGrade,
      hasPassed,
      registeredCount: enrolled.length + waitlisted.length,
    };
  }, [catalog, normalizedEmail]);
}
