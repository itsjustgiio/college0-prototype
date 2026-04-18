import { Link } from "react-router";
import { Calendar, MessageSquare, Sparkles, Star, GraduationCap, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { currentStudent, enrolledCourses, completedCourses } from "../data/mockData";

export function StudentDashboard() {
  const totalCoursesRequired = 8;
  const coursesCompleted = currentStudent.coursesCompleted;
  const progressPercentage = (coursesCompleted / totalCoursesRequired) * 100;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="overflow-hidden border-slate-900/0 bg-[linear-gradient(135deg,#0f2137_0%,#14365e_45%,#1f5ea2_100%)] text-white">
          <CardBody className="relative">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-32 w-32 rounded-tl-[3rem] bg-white/8" />
            <div className="relative max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-100/80">Student workspace</p>
              <h1 className="mt-4 text-4xl text-white md:text-5xl">Welcome back, {currentStudent.name}</h1>
              <p className="mt-4 text-base leading-7 text-blue-100/85">
                Your next registration window is open. Keep an eye on progress requirements, active course load, and recommendation signals before seats tighten.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2">Spring 2026 semester</div>
                <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100">Good academic standing</div>
                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2">AI planning enabled</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="!border-slate-900 !bg-slate-950 !text-white">
          <CardBody className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Degree completion</p>
              <div className="mt-3 flex items-end gap-3">
                <div className="text-5xl font-semibold text-white">{Math.round(progressPercentage)}%</div>
                <div className="pb-2 text-sm text-slate-400">{coursesCompleted} of {totalCoursesRequired} courses</div>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300" style={{ width: `${progressPercentage}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/5 p-4 text-white">
                <div className="text-slate-400">Current GPA</div>
                <div className="mt-2 text-2xl font-semibold text-white">{currentStudent.gpa}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 text-white">
                <div className="text-slate-400">Warnings</div>
                <div className="mt-2 text-2xl font-semibold text-white">{currentStudent.warnings}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Academic status</p>
            <div className="mt-4 text-4xl text-slate-950">{currentStudent.gpa}</div>
            <div className="mt-1 text-sm text-slate-600">Current GPA across active coursework</div>
            <div className="mt-4">
              <Badge variant="success">{currentStudent.status}</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Course load</p>
            <div className="mt-4 text-4xl text-slate-950">{enrolledCourses.length}</div>
            <div className="mt-1 text-sm text-slate-600">Enrolled courses this semester</div>
            <div className="mt-4">
              <Badge variant="info">Active</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Program progress</p>
            <div className="mt-4 text-4xl text-slate-950">{coursesCompleted}/{totalCoursesRequired}</div>
            <div className="mt-1 text-sm text-slate-600">Completed course requirement</div>
            <div className="mt-4">
              <Badge variant="neutral">{Math.round(progressPercentage)}% Complete</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Advising risk</p>
            <div className="mt-4 text-4xl text-slate-950">{currentStudent.warnings}</div>
            <div className="mt-1 text-sm text-slate-600">Open warnings on your record</div>
            <div className="mt-4">
              <Badge variant="success">Good Standing</Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      {currentStudent.gpa < 2.5 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="mb-1 text-yellow-900">Academic Warning</h3>
                <p className="text-sm text-yellow-800">
                  Your GPA is below 2.5. Please consult with your advisor.
                  <span className="ml-2 rounded bg-yellow-200 px-2 py-0.5 text-xs">BR-05</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/student/registration">
          <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_26px_60px_-40px_rgba(15,23,42,0.4)]">
            <CardBody>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-slate-950">Register for Courses</h3>
              <p className="text-sm leading-6 text-slate-600">Review seat availability, prerequisites, and schedule fit before checkout.</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">UC-07</p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/student/smart-cre">
          <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_26px_60px_-40px_rgba(15,23,42,0.4)]">
            <CardBody>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="mb-2 text-slate-950">Smart Recommendations</h3>
              <p className="text-sm leading-6 text-slate-600">See which courses improve progress, fit your interests, and match your history.</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">AI-powered</p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/student/ai-assistant">
          <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_26px_60px_-40px_rgba(15,23,42,0.4)]">
            <CardBody>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-slate-950">AI Assistant</h3>
              <p className="text-sm leading-6 text-slate-600">Ask about rules, course choices, and next steps without jumping between screens.</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">UC-17</p>
            </CardBody>
          </Card>
        </Link>

        <Card className="cursor-pointer border-dashed border-slate-300 bg-slate-50/60 opacity-85 transition-all hover:-translate-y-1">
          <CardBody>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
              <Star className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="mb-2 text-slate-950">Course Reviews</h3>
            <p className="text-sm leading-6 text-slate-600">Anonymous feedback and quality trends are staged here for a later release.</p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">Planned feature</p>
          </CardBody>
        </Card>
      </div>

      <div className="relative">
        <Card badge="BR-01">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl">Graduation Progress</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="mb-4">
              <div className="mb-2 flex justify-between">
                <span className="text-sm text-slate-600">
                  {coursesCompleted} of {totalCoursesRequired} courses completed
                </span>
                <span className="text-sm text-blue-600">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-[linear-gradient(90deg,#154a8a_0%,#2d73c7_60%,#73c5f2_100%)] transition-all" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              You need to complete {totalCoursesRequired - coursesCompleted} more courses to graduate. Keep up the great work!
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl">Enrolled Courses</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">Spring 2026</p>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="p-6 transition-colors hover:bg-slate-50/80">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="mb-1 text-slate-900">{course.id}</h3>
                      <p className="text-sm text-slate-600">{course.name}</p>
                    </div>
                    <Badge variant="info">Enrolled</Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                    <span>{course.instructor}</span>
                    <span>&bull;</span>
                    <span>{course.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl">Course History</h2>
            <p className="mt-1 text-sm text-slate-600">Completed Courses</p>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {completedCourses.map((course) => (
                <div key={course.id} className="p-6 transition-colors hover:bg-slate-50/80">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="mb-1 text-slate-900">{course.id}</h3>
                      <p className="text-sm text-slate-600">{course.name}</p>
                    </div>
                    <Badge variant="success">Grade: {course.grade}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {course.semester} &bull; {course.credits} Credits
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
