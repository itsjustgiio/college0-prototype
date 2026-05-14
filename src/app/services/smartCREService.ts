import type { CourseState } from "./localCourseRepository";
import type { StudentAcademicProfile, StudentCourseSnapshot } from "./localCollegeRepository";
import { schedulesConflict } from "../domain/schedule";

export interface RecommendationReason {
  factor: string;
  description: string;
  impact: "high" | "medium" | "low";
}

export interface CourseRecommendation {
  course: CourseState;
  score: number;
  reasons: RecommendationReason[];
  explanation: string;
}

export function computeRecommendations(
  profile: StudentAcademicProfile,
  snapshot: StudentCourseSnapshot,
  catalog: CourseState[],
): CourseRecommendation[] {
  const normalizedEmail = profile.email.trim().toLowerCase();

  const completedGrades = new Map<string, string>();
  for (const entry of snapshot.completedCourses) {
    completedGrades.set(entry.id, entry.grade);
  }

  // Merge snapshot enrollment with live course enrollment so both data sources agree
  const snapshotEnrolledIds = new Set(snapshot.enrolledCourses.map((c) => c.id));
  const liveEnrolledIds = new Set(
    catalog
      .filter(
        (c) =>
          c.enrolledStudentIds.includes(normalizedEmail) ||
          c.waitlistStudentIds.includes(normalizedEmail),
      )
      .map((c) => c.id),
  );
  const enrolledIds = new Set([...snapshotEnrolledIds, ...liveEnrolledIds]);
  const enrolledCourses = catalog.filter((c) => enrolledIds.has(c.id));

  const eligible = catalog.filter((course) => {
    if (course.cancelled) return false;
    const grade = completedGrades.get(course.id);
    if (grade && grade !== "F") return false;
    if (enrolledIds.has(course.id)) return false;
    return true;
  });

  const graded = eligible.map((course) => {
    let score = 0;
    const reasons: RecommendationReason[] = [];

    const neverTaken = !completedGrades.has(course.id);
    if (neverTaken) {
      score += 30;
      const remaining = Math.max(0, 8 - profile.coursesCompleted);
      reasons.push({
        factor: "Graduation Progress",
        description: `Counts toward your degree (${remaining} course${remaining !== 1 ? "s" : ""} remaining)`,
        impact: "high",
      });
    } else {
      score += 20;
      reasons.push({
        factor: "Retake Eligible",
        description: "You previously earned an F — retaking can improve your transcript",
        impact: "high",
      });
    }

    score += Math.round(course.rating * 8);
    const ratingImpact: RecommendationReason["impact"] =
      course.rating >= 4.5 ? "high" : course.rating >= 3.5 ? "medium" : "low";
    reasons.push({
      factor: "Student Rating",
      description: `Rated ${course.rating.toFixed(1)}/5.0 by students`,
      impact: ratingImpact,
    });

    const conflicting = enrolledCourses.find((e) => schedulesConflict(e.schedule, course.schedule));
    if (conflicting) {
      score -= 60;
      reasons.push({
        factor: "Time Conflict",
        description: `Overlaps with ${conflicting.id} you are enrolled in — resolve before adding`,
        impact: "high",
      });
    } else if (enrolledCourses.length > 0) {
      score += 10;
      reasons.push({
        factor: "Schedule Compatible",
        description: "Fits into your current schedule with no time conflicts",
        impact: "medium",
      });
    }

    const seatsLeft = course.seats - course.enrolledStudentIds.length;
    if (seatsLeft > 0) {
      score += seatsLeft <= 3 ? 5 : 10;
      reasons.push({
        factor: seatsLeft <= 3 ? "Very Limited Seats" : "Seats Available",
        description:
          seatsLeft <= 3
            ? `Only ${seatsLeft} seat${seatsLeft !== 1 ? "s" : ""} left — register soon`
            : `${seatsLeft} of ${course.seats} seats open`,
        impact: seatsLeft <= 3 ? "high" : "medium",
      });
    } else {
      score -= 10;
      reasons.push({
        factor: "Waitlist Only",
        description: "Course is full; joining would place you on the waitlist",
        impact: "low",
      });
    }

    if (profile.gpa > 0 && profile.gpa < 2.5 && course.rating < 3.5) {
      score -= 15;
      reasons.push({
        factor: "Academic Caution",
        description: "Lower-rated courses carry higher risk — prioritize well-rated options to rebuild GPA",
        impact: "medium",
      });
    }

    if (profile.coursesCompleted >= 7 && neverTaken) {
      score += 20;
      reasons.push({
        factor: "Graduation Eligible",
        description: "Completing this course may qualify you to apply for graduation",
        impact: "high",
      });
    }

    return { course, score, reasons };
  });

  const sorted = graded.sort((a, b) => b.score - a.score);

  return sorted.map(({ course, score, reasons }) => {
    const highlights = reasons
      .filter((r) => r.impact === "high")
      .slice(0, 2)
      .map((r) => r.description.charAt(0).toLowerCase() + r.description.slice(1));

    const explanation =
      highlights.length > 0
        ? `Recommended because ${highlights.join(", and ")}.`
        : "Matches your academic profile and schedule.";

    return { course, score, reasons, explanation };
  });
}
