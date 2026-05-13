import { deriveInstructorEmail } from "../domain/instructor";
import { localCourseRepository } from "./localCourseRepository";
import { localGradingRepository } from "./localGradingRepository";
import { localWarningsRepository } from "./localWarningsRepository";

export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type ReviewVisibility = "visible" | "hidden";

export interface CourseReview {
  id: string;
  courseId: string;
  studentEmail: string;
  rating: ReviewRating;
  rawComment: string;
  displayComment: string;
  tabooCount: number;
  visibility: ReviewVisibility;
  submittedAt: string;
}

export interface VisibleCourseReview {
  id: string;
  courseId: string;
  rating: ReviewRating;
  displayComment: string;
  submittedAt: string;
}

export interface CourseReviewSummary {
  averageRating: number | null;
  visibleReviewCount: number;
}

const STORAGE_KEY = "college0.reviews";
const TABOO_STORAGE_KEY = "college0.reviews.tabooWords";
const CHANGE_EVENT = "college0:reviews:changed";
const DEFAULT_TABOO_WORDS = ["cheat", "fraud", "trash"];

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasBrowserStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function createId() {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emitChanged() {
  if (hasBrowserStorage()) {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

function readAll(): CourseReview[] {
  return readJson<CourseReview[]>(STORAGE_KEY, []);
}

function writeAll(reviews: CourseReview[]) {
  writeJson(STORAGE_KEY, reviews);
  emitChanged();
}

function readTabooWords(): string[] {
  return readJson<string[]>(TABOO_STORAGE_KEY, DEFAULT_TABOO_WORDS);
}

function writeTabooWords(words: string[]) {
  writeJson(TABOO_STORAGE_KEY, words);
  emitChanged();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function moderateComment(comment: string, tabooWords: string[]) {
  let tabooCount = 0;
  let displayComment = comment;

  for (const word of tabooWords) {
    const normalizedWord = word.trim();
    if (!normalizedWord) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(normalizedWord)}\\b`, "gi");
    displayComment = displayComment.replace(pattern, (match) => {
      tabooCount += 1;
      return "*".repeat(match.length);
    });
  }

  return { tabooCount, displayComment };
}

function visibleForCourse(courseId: string) {
  return readAll().filter((review) => review.courseId === courseId && review.visibility === "visible");
}

function summarize(courseId: string): CourseReviewSummary {
  const visible = visibleForCourse(courseId);
  if (visible.length === 0) {
    return { averageRating: null, visibleReviewCount: 0 };
  }

  const total = visible.reduce((sum, review) => sum + review.rating, 0);
  return {
    averageRating: Number((total / visible.length).toFixed(2)),
    visibleReviewCount: visible.length,
  };
}

function syncVisibleAverage(courseId: string) {
  const summary = summarize(courseId);
  if (summary.averageRating !== null) {
    localCourseRepository.setRating(courseId, summary.averageRating);
  }
  return summary;
}

function maybeWarnInstructor(courseId: string, averageRating: number | null) {
  if (averageRating === null || averageRating >= 2) return;
  const course = localCourseRepository.get(courseId);
  if (!course) return;
  const instructorEmail = deriveInstructorEmail(course.instructor);
  const source = `auto:course-rating-below-2:${courseId}`;
  const alreadyWarned = localWarningsRepository
    .listAll(instructorEmail)
    .some((warning) => warning.source === source);

  if (alreadyWarned) return;

  localWarningsRepository.issue({
    subjectId: instructorEmail,
    subjectRole: "instructor",
    severity: 1,
    reason: `${courseId} visible review average fell below 2.0.`,
    source,
  });
}

export const localReviewsRepository = {
  getTabooWords(): string[] {
    return readTabooWords();
  },

  setTabooWords(words: string[]) {
    const next = Array.from(
      new Set(words.map((word) => normalize(word)).filter(Boolean)),
    );
    writeTabooWords(next);
    return next;
  },

  submitReview(input: {
    courseId: string;
    studentEmail: string;
    rating: ReviewRating;
    comment: string;
  }): CourseReview {
    const studentEmail = normalize(input.studentEmail);
    const comment = input.comment.trim();
    if (!comment) throw new Error("A review comment is required.");
    if (input.rating < 1 || input.rating > 5) throw new Error("Choose a 1-5 star rating.");

    const course = localCourseRepository.get(input.courseId);
    if (!course) throw new Error("Course not found.");
    if (!course.enrolledStudentIds.includes(studentEmail)) {
      throw new Error("You can only review a course you are currently enrolled in.");
    }
    if (localGradingRepository.getGrade({ courseId: input.courseId, studentEmail })) {
      throw new Error("Reviews close once your grade has been posted.");
    }
    if (readAll().some((review) => review.courseId === input.courseId && review.studentEmail === studentEmail)) {
      throw new Error("You have already reviewed this course.");
    }

    const { tabooCount, displayComment } = moderateComment(comment, readTabooWords());
    const visibility: ReviewVisibility = tabooCount >= 3 ? "hidden" : "visible";
    const review: CourseReview = {
      id: createId(),
      courseId: input.courseId,
      studentEmail,
      rating: input.rating,
      rawComment: comment,
      displayComment,
      tabooCount,
      visibility,
      submittedAt: new Date().toISOString(),
    };

    writeAll([review, ...readAll()]);

    if (tabooCount === 1 || tabooCount === 2) {
      localWarningsRepository.issue({
        subjectId: studentEmail,
        subjectRole: "student",
        severity: 1,
        reason: `Review for ${input.courseId} contained ${tabooCount} taboo word${tabooCount === 1 ? "" : "s"}.`,
        source: `auto:review-taboo-visible:${review.id}`,
      });
    } else if (tabooCount >= 3) {
      localWarningsRepository.issue({
        subjectId: studentEmail,
        subjectRole: "student",
        severity: 2,
        reason: `Review for ${input.courseId} contained ${tabooCount} taboo words and was hidden.`,
        source: `auto:review-taboo-hidden:${review.id}`,
      });
    }

    const summary = syncVisibleAverage(input.courseId);
    maybeWarnInstructor(input.courseId, summary.averageRating);
    return review;
  },

  findStudentCourseReview(courseId: string, studentEmail: string): CourseReview | null {
    const target = normalize(studentEmail);
    return readAll().find((review) => review.courseId === courseId && review.studentEmail === target) ?? null;
  },

  listVisibleForCourse(courseId: string): VisibleCourseReview[] {
    return visibleForCourse(courseId).map(({ id, courseId: nextCourseId, rating, displayComment, submittedAt }) => ({
      id,
      courseId: nextCourseId,
      rating,
      displayComment,
      submittedAt,
    }));
  },

  getCourseSummary(courseId: string): CourseReviewSummary {
    return summarize(courseId);
  },

  listAllForRegistrar(): CourseReview[] {
    return readAll();
  },

  subscribe(callback: () => void) {
    if (!hasBrowserStorage()) return () => {};
    window.addEventListener(CHANGE_EVENT, callback);
    return () => window.removeEventListener(CHANGE_EVENT, callback);
  },
};
