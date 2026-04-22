import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Sparkles, Star, TrendingUp, Calendar, CheckCircle, Plus } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";

interface Recommendation {
  course: {
    id: string;
    name: string;
    instructor: string;
    time: string;
    rating: number;
    seats: number;
    enrolled: number;
  };
  score: number;
  reasons: {
    factor: string;
    description: string;
    impact: "high" | "medium" | "low";
  }[];
}

export function SmartCRE() {
  const [addedCourses, setAddedCourses] = useState<string[]>([]);

  const recommendations: Recommendation[] = [
    {
      course: {
        id: "CS401",
        name: "Machine Learning",
        instructor: "Dr. Emily White",
        time: "Mon/Wed 10:00-11:30 AM",
        rating: 4.9,
        seats: 15,
        enrolled: 14,
      },
      score: 95,
      reasons: [
        { factor: "Graduation Requirement", description: "Required for CS degree completion", impact: "high" },
        { factor: "High Course Rating", description: "4.9/5.0 student rating", impact: "high" },
        { factor: "Schedule Compatible", description: "No conflicts with enrolled courses", impact: "medium" },
        { factor: "GPA Boost", description: "Students with similar GPA average A-", impact: "medium" },
      ],
    },
    {
      course: {
        id: "CS302",
        name: "Web Development",
        instructor: "Prof. David Lee",
        time: "Tue/Thu 1:00-2:30 PM",
        rating: 4.6,
        seats: 30,
        enrolled: 22,
      },
      score: 88,
      reasons: [
        { factor: "Career Alignment", description: "Matches your interests in full-stack development", impact: "high" },
        { factor: "Good Availability", description: "8 seats remaining", impact: "medium" },
        { factor: "Schedule Compatible", description: "Fits well with current schedule", impact: "medium" },
        { factor: "Strong Rating", description: "4.6/5.0 student rating", impact: "low" },
      ],
    },
    {
      course: {
        id: "CS402",
        name: "Software Engineering",
        instructor: "Dr. Michael Chen",
        time: "Tue/Thu 2:00-3:30 PM",
        rating: 4.3,
        seats: 25,
        enrolled: 20,
      },
      score: 82,
      reasons: [
        { factor: "Prerequisite Complete", description: "You completed CS201 with grade A", impact: "high" },
        { factor: "Industry Relevant", description: "High demand skill in job market", impact: "medium" },
        { factor: "Moderate Difficulty", description: "Matches your academic performance", impact: "medium" },
      ],
    },
    {
      course: {
        id: "MATH301",
        name: "Linear Algebra",
        instructor: "Dr. Lisa Brown",
        time: "Tue/Thu 9:00-10:30 AM",
        rating: 4.1,
        seats: 20,
        enrolled: 19,
      },
      score: 75,
      reasons: [
        { factor: "Math Requirement", description: "Fulfills mathematics elective", impact: "high" },
        { factor: "ML Prerequisite", description: "Useful for advanced ML courses", impact: "medium" },
        { factor: "Limited Seats", description: "Only 1 seat remaining", impact: "low" },
      ],
    },
  ];

  const handleAddToRegistration = (courseId: string) => {
    if (!addedCourses.includes(courseId)) {
      setAddedCourses((prev) => [...prev, courseId]);
    }
  };

  const getImpactBadge = (impact: string) => {
    if (impact === "high") return "success";
    if (impact === "medium") return "info";
    return "neutral";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/student" className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="text-3xl text-slate-950">Smart Recommendations</h1>
          <p className="mt-1 text-sm text-slate-600">A cleaner view of the courses that best fit your progress and schedule.</p>
        </div>
        <Link to="/student/registration">
          <Button variant="primary" className="gap-2">
            <Calendar className="h-4 w-4" />
            Go to registration
            {addedCourses.length > 0 && <Badge variant="success">{addedCourses.length} added</Badge>}
          </Button>
        </Link>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardBody>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-blue-700" />
            <div>
              <h3 className="text-base text-blue-950">How recommendations are ranked</h3>
              <p className="mt-1 text-sm leading-6 text-blue-900">
                Scores weigh degree completion, schedule fit, course quality, and seat availability. This page keeps the reasoning visible without overwhelming the screen.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const isAdded = addedCourses.includes(rec.course.id);

          return (
            <Card key={rec.course.id}>
              <CardBody>
                <div className="grid gap-6 lg:grid-cols-[120px_1fr]">
                  <div className="rounded-3xl bg-slate-950 px-4 py-5 text-center text-white">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Match</div>
                    <div className="mt-2 text-4xl">{rec.score}</div>
                    <div className="mt-3">
                      <Badge variant="neutral">Rank #{index + 1}</Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl text-slate-950">{rec.course.id}</h2>
                          <div className="inline-flex items-center gap-1 text-sm text-amber-700">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            {rec.course.rating}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{rec.course.name}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                          <span>{rec.course.instructor}</span>
                          <span>{rec.course.time}</span>
                          <span>{rec.course.enrolled}/{rec.course.seats} enrolled</span>
                        </div>
                      </div>

                      <Button
                        variant={isAdded ? "secondary" : "primary"}
                        onClick={() => handleAddToRegistration(rec.course.id)}
                        disabled={isAdded}
                        className="gap-2"
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Added
                          </>
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
                            <Badge variant={getImpactBadge(reason.impact)}>{reason.impact}</Badge>
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
    </div>
  );
}
