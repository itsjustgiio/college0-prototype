import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Sparkles,
  Star,
  Calendar,
  CheckCircle,
  Plus,
  AlertTriangle,
  GraduationCap,
  Info,
  BookOpen,
} from "lucide-react";
import { Card, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { useSmartRecommendations } from "../hooks/useSmartRecommendations";
import { useSemesterPhase } from "../hooks/useSemesterPhase";
import { useAuth } from "../auth/AuthProvider";
import { localCourseRepository } from "../services/localCourseRepository";
import { formatSchedule } from "../domain/schedule";
import type { RecommendationReason } from "../services/smartCREService";

function impactVariant(impact: RecommendationReason["impact"]) {
  if (impact === "high") return "success";
  if (impact === "medium") return "info";
  return "neutral";
}

function ScoreBadge({ score, rank }: { score: number; rank: number }) {
  const clampedScore = Math.min(100, Math.max(0, score));
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-slate-950 px-4 py-5 text-center text-white">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Match</div>
      <div className="mt-2 text-4xl">{clampedScore}</div>
      <div className="mt-3">
        <Badge variant="neutral">Rank #{rank}</Badge>
      </div>
    </div>
  );
}

export function SmartCRE() {
  const [phase] = useSemesterPhase();
  const { user } = useAuth();
  const { recommendations, gpa, coursesCompleted, isFirstSemester, isOnProbation, isNearGraduation, registeredCount } =
    useSmartRecommendations();

  const MAX_COURSES = 4;
  const atCourseLimit = registeredCount >= MAX_COURSES;
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const handleAdd = (courseId: string) => {
    if (!user?.email) return;
    try {
      localCourseRepository.enroll(courseId, user.email);
      setEnrollError(null);
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "Could not enroll in course.");
    }
  };

  const isRegistrationOpen = phase === "registration" || phase === "running";

  const visibleRecs = recommendations.filter((r) => r.score > -30).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to="/student"
            className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="text-3xl text-slate-950">Smart Recommendations</h1>
          <p className="mt-1 text-sm text-slate-600">
            Courses ranked for your academic profile — {8 - coursesCompleted} course
            {8 - coursesCompleted !== 1 ? "s" : ""} remaining toward graduation.
          </p>
        </div>
        <Link to="/student/registration">
          <Button variant="primary" className="gap-2">
            <Calendar className="h-4 w-4" />
            Go to registration
          </Button>
        </Link>
      </div>

      {enrollError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-700" />
          <p className="text-sm text-red-900">{enrollError}</p>
        </div>
      )}

      {!isRegistrationOpen && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Info className="mt-0.5 h-5 w-5 text-amber-700" />
          <p className="text-sm text-amber-900">
            Recommendations will be available when course registration opens. Browsing in preview mode now.
          </p>
        </div>
      )}

      {isNearGraduation && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <GraduationCap className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div className="text-sm text-emerald-900">
            <p className="font-medium">You're one course away from being eligible to graduate.</p>
            <p className="mt-1">Courses that would satisfy your final requirement are highlighted below.</p>
          </div>
        </div>
      )}

      {isOnProbation && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Academic probation — GPA {gpa.toFixed(2)}</p>
            <p className="mt-1">
              Courses with high student ratings are ranked first to help you rebuild your GPA. Avoid lower-rated
              courses until your standing improves.
            </p>
          </div>
        </div>
      )}

      {isFirstSemester && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <BookOpen className="mt-0.5 h-5 w-5 text-blue-700" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">First semester — showing all courses by rating</p>
            <p className="mt-1">
              No prior course history on record yet. Recommendations will become more personalized after your first
              completed semester.
            </p>
          </div>
        </div>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardBody>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-blue-700" />
            <div>
              <h3 className="text-base text-blue-950">How the engine ranks courses</h3>
              <p className="mt-1 text-sm leading-6 text-blue-900">
                Scores are computed from graduation progress, course ratings, schedule compatibility, seat availability,
                and GPA-aware risk. The engine re-runs each time you open this page.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {visibleRecs.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Sparkles className="h-10 w-10 text-slate-300" />
              <p className="text-slate-600">No recommendations available right now.</p>
              <p className="text-sm text-slate-500">
                This appears when all available courses conflict with your schedule, are full, or have already been
                completed.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleRecs.map((rec, index) => {
            const normalizedEmail = user?.email?.trim().toLowerCase() ?? "";
            const isEnrolled = rec.course.enrolledStudentIds.includes(normalizedEmail);
            const isWaitlisted = rec.course.waitlistStudentIds.includes(normalizedEmail);
            const hasConflict = rec.reasons.some((r) => r.factor === "Time Conflict");
            const isGraduationCritical = rec.reasons.some((r) => r.factor === "Graduation Eligible");

            return (
              <Card key={rec.course.id} className={isGraduationCritical ? "border-emerald-300" : undefined}>
                <CardBody>
                  <div className="grid gap-6 lg:grid-cols-[120px_1fr]">
                    <ScoreBadge score={rec.score} rank={index + 1} />

                    <div>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl text-slate-950">{rec.course.id}</h2>
                            {isGraduationCritical && (
                              <Badge variant="success">
                                <GraduationCap className="h-3 w-3" />
                                Graduation eligible
                              </Badge>
                            )}
                            {hasConflict && <Badge variant="error">Schedule conflict</Badge>}
                            <span className="inline-flex items-center gap-1 text-sm text-amber-700">
                              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                              {rec.course.rating.toFixed(1)}
                            </span>
                          </div>
                          <p className="mt-1 text-base text-slate-700">{rec.course.name}</p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span>{rec.course.instructor}</span>
                            <span>{formatSchedule(rec.course.schedule)}</span>
                            <span>
                              {rec.course.enrolledStudentIds.length}/{rec.course.seats} enrolled
                            </span>
                          </div>

                          <p className="mt-3 text-sm italic text-slate-600">{rec.explanation}</p>
                        </div>

                        <Button
                          variant={isEnrolled || isWaitlisted ? "secondary" : "primary"}
                          onClick={() => handleAdd(rec.course.id)}
                          disabled={isEnrolled || isWaitlisted || hasConflict || atCourseLimit || !isRegistrationOpen}
                          className="shrink-0 gap-2"
                        >
                          {isEnrolled ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Enrolled
                            </>
                          ) : isWaitlisted ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Waitlisted
                            </>
                          ) : hasConflict || atCourseLimit ? (
                            "Conflict"
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Add to registration
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {rec.reasons.map((reason, idx) => (
                          <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-medium text-slate-950">{reason.factor}</h3>
                                <p className="mt-1 text-xs leading-5 text-slate-600">{reason.description}</p>
                              </div>
                              <Badge variant={impactVariant(reason.impact)}>{reason.impact}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
