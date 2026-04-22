import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Calendar, Clock, Users, Star, AlertCircle, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { courses } from "../data/mockData";

interface SelectedCourse {
  id: string;
  name: string;
  instructor: string;
  time: string;
  credits: number;
  status: "enrolled" | "waitlist";
}

export function Registration() {
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const minCourses = 2;
  const maxCourses = 4;

  const hasTimeConflict = (newCourse: typeof courses[0]) => {
    return selectedCourses.some((selected) => selected.time === newCourse.time);
  };

  const pushError = (message: string, filterText: string) => {
    setErrors((prev) => [...prev, message]);
    setTimeout(() => {
      setErrors((prev) => prev.filter((error) => !error.includes(filterText)));
    }, 3000);
  };

  const toggleCourse = (course: typeof courses[0]) => {
    const alreadySelected = selectedCourses.find((c) => c.id === course.id);

    if (alreadySelected) {
      setSelectedCourses((prev) => prev.filter((c) => c.id !== course.id));
      setErrors((prev) => prev.filter((e) => !e.includes(course.id)));
      return;
    }

    if (selectedCourses.length >= maxCourses) {
      pushError(`Maximum ${maxCourses} courses allowed (BR-03)`, "BR-03");
      return;
    }

    if (hasTimeConflict(course)) {
      pushError(`Time conflict: ${course.id} overlaps with an existing course`, course.id);
      return;
    }

    const isFull = course.enrolled >= course.seats;
    const status = isFull ? "waitlist" : "enrolled";

    setSelectedCourses((prev) => [
      ...prev,
      {
        id: course.id,
        name: course.name,
        instructor: course.instructor,
        time: course.time,
        credits: course.credits,
        status,
      },
    ]);

    if (isFull) {
      pushError(`${course.id} is full and was added to the waitlist`, course.id);
    }
  };

  const handleSubmit = () => {
    if (selectedCourses.length < minCourses) {
      setErrors([`Minimum ${minCourses} courses required (BR-03)`]);
      return;
    }
    if (selectedCourses.length > maxCourses) {
      setErrors([`Maximum ${maxCourses} courses allowed (BR-03)`]);
      return;
    }
    alert("Registration submitted successfully!");
  };

  const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);
  const enrolledCount = selectedCourses.filter((c) => c.status === "enrolled").length;
  const waitlistCount = selectedCourses.filter((c) => c.status === "waitlist").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/student" className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="text-3xl text-slate-950">Course Registration</h1>
          <p className="mt-1 text-sm text-slate-600">Spring 2026 semester. Select between 2 and 4 courses.</p>
        </div>
        <Link to="/student/smart-cre">
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            View recommendations
          </Button>
        </Link>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardBody>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-blue-700" />
            <div>
              <h3 className="text-base text-blue-950">Registration requirements</h3>
              <p className="mt-1 text-sm leading-6 text-blue-900">
                Students must register for at least 2 courses and no more than 4. Full sections are added to the waitlist automatically.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <Card key={index} className="border-red-200 bg-red-50">
              <CardBody className="py-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-700" />
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.65fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl text-slate-950">Available Courses</h2>
                <p className="mt-1 text-sm text-slate-600">Select or remove courses directly from the list.</p>
              </div>
              <Badge variant="neutral">UC-07</Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {courses.map((course) => {
                const isSelected = selectedCourses.some((c) => c.id === course.id);
                const selectedEntry = selectedCourses.find((c) => c.id === course.id);
                const isFull = course.enrolled >= course.seats;
                const seatsLeft = course.seats - course.enrolled;

                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => toggleCourse(course)}
                    className={`w-full px-6 py-5 text-left transition-colors ${
                      isSelected ? "bg-blue-50" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg text-slate-950">{course.id}</h3>
                          <div className="inline-flex items-center gap-1 text-sm text-amber-700">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            {course.rating}
                          </div>
                          {isFull && <Badge variant="warning">Waitlist only</Badge>}
                          {selectedEntry && (
                            <Badge variant={selectedEntry.status === "waitlist" ? "warning" : "success"}>
                              {selectedEntry.status === "waitlist" ? "Waitlisted" : "Selected"}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{course.name}</p>
                        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{course.instructor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>{course.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>
                              {course.enrolled}/{course.seats} enrolled
                              {seatsLeft > 0 && seatsLeft <= 5 ? ` • ${seatsLeft} left` : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        isSelected ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-transparent"
                      }`}>
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl text-slate-950">Summary</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Selected courses</span>
                <span className="font-medium text-slate-950">{selectedCourses.length}/{maxCourses}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all ${
                    selectedCourses.length >= minCourses && selectedCourses.length <= maxCourses
                      ? "bg-emerald-500"
                      : selectedCourses.length > maxCourses
                        ? "bg-red-500"
                        : "bg-amber-500"
                  }`}
                  style={{ width: `${(selectedCourses.length / maxCourses) * 100}%` }}
                />
              </div>
              {selectedCourses.length < minCourses && (
                <p className="mt-2 text-xs text-amber-700">Select at least {minCourses - selectedCourses.length} more course(s).</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className="text-2xl text-slate-950">{enrolledCount}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Enrolled</div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-center">
                <div className="text-2xl text-amber-700">{waitlistCount}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-amber-700">Waitlist</div>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 text-center">
                <div className="text-2xl text-blue-700">{totalCredits}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-blue-700">Credits</div>
              </div>
            </div>

            {selectedCourses.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-950">Selected courses</h3>
                {selectedCourses.map((course) => (
                  <div key={course.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-950">{course.id}</div>
                        <div className="mt-1 text-xs text-slate-600">{course.name}</div>
                      </div>
                      <Badge variant={course.status === "waitlist" ? "warning" : "success"}>
                        {course.status === "waitlist" ? "Waitlist" : "Enrolled"}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{course.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center">
                <Calendar className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">No courses selected yet.</p>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={handleSubmit}
              disabled={selectedCourses.length < minCourses || selectedCourses.length > maxCourses}
            >
              Submit registration
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
