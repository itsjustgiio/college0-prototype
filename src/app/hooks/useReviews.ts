import { useEffect, useState } from "react";
import {
  localReviewsRepository,
  type CourseReview,
  type CourseReviewSummary,
  type VisibleCourseReview,
} from "../services/localReviewsRepository";

export function useCourseReviewSummary(courseId: string): CourseReviewSummary {
  const [summary, setSummary] = useState<CourseReviewSummary>(() =>
    localReviewsRepository.getCourseSummary(courseId),
  );

  useEffect(() => {
    const refresh = () => setSummary(localReviewsRepository.getCourseSummary(courseId));
    refresh();
    return localReviewsRepository.subscribe(refresh);
  }, [courseId]);

  return summary;
}

export function useVisibleCourseReviews(courseId: string): VisibleCourseReview[] {
  const [reviews, setReviews] = useState<VisibleCourseReview[]>(() =>
    localReviewsRepository.listVisibleForCourse(courseId),
  );

  useEffect(() => {
    const refresh = () => setReviews(localReviewsRepository.listVisibleForCourse(courseId));
    refresh();
    return localReviewsRepository.subscribe(refresh);
  }, [courseId]);

  return reviews;
}

export function useOwnCourseReview(courseId: string, studentEmail: string): CourseReview | null {
  const [review, setReview] = useState<CourseReview | null>(() =>
    localReviewsRepository.findStudentCourseReview(courseId, studentEmail),
  );

  useEffect(() => {
    const refresh = () => setReview(localReviewsRepository.findStudentCourseReview(courseId, studentEmail));
    refresh();
    return localReviewsRepository.subscribe(refresh);
  }, [courseId, studentEmail]);

  return review;
}

export function useRegistrarReviews(): CourseReview[] {
  const [reviews, setReviews] = useState<CourseReview[]>(() => localReviewsRepository.listAllForRegistrar());

  useEffect(() => {
    const refresh = () => setReviews(localReviewsRepository.listAllForRegistrar());
    refresh();
    return localReviewsRepository.subscribe(refresh);
  }, []);

  return reviews;
}

export function useTabooWords(): string[] {
  const [words, setWords] = useState<string[]>(() => localReviewsRepository.getTabooWords());

  useEffect(() => {
    const refresh = () => setWords(localReviewsRepository.getTabooWords());
    refresh();
    return localReviewsRepository.subscribe(refresh);
  }, []);

  return words;
}
