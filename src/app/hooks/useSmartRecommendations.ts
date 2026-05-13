import { useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useCourses } from "./useCourses";
import { localCollegeRepository } from "../services/localCollegeRepository";
import { computeRecommendations, type CourseRecommendation } from "../services/smartCREService";

export interface SmartRecommendationsResult {
  recommendations: CourseRecommendation[];
  gpa: number;
  coursesCompleted: number;
  warnings: number;
  status: string;
  isFirstSemester: boolean;
  isOnProbation: boolean;
  isNearGraduation: boolean;
}

export function useSmartRecommendations(): SmartRecommendationsResult {
  const { user } = useAuth();
  const catalog = useCourses();

  return useMemo(() => {
    const email = user?.email ?? "";
    const name = user?.name ?? "";

    const profile = localCollegeRepository.getStudentProfile({ name, email });
    const snapshot = localCollegeRepository.getStudentCourseSnapshot(email);

    const recommendations = computeRecommendations(profile, snapshot, catalog);

    return {
      recommendations,
      gpa: profile.gpa,
      coursesCompleted: profile.coursesCompleted,
      warnings: profile.warnings,
      status: profile.status,
      isFirstSemester: snapshot.completedCourses.length === 0 && snapshot.enrolledCourses.length === 0,
      isOnProbation: profile.gpa > 0 && profile.gpa >= 2.0 && profile.gpa <= 2.25,
      isNearGraduation: profile.coursesCompleted >= 7,
    };
  }, [user, catalog]);
}
