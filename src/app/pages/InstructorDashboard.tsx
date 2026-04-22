import { BookOpen, Users, TrendingUp, AlertCircle, ClipboardCheck, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { courses } from "../data/mockData";

const instructorName = "Dr. Sarah Johnson";
const instructorCourses = courses.filter((c) => c.instructor === instructorName);

const studentsList = [
  { id: 1, name: "John Doe", course: "CS101", grade: "A", attendance: 95, status: "Good Standing" },
  { id: 2, name: "Jane Smith", course: "CS101", grade: "A-", attendance: 100, status: "Good Standing" },
  { id: 3, name: "Mike Johnson", course: "CS301", grade: "B+", attendance: 85, status: "Warning" },
  { id: 4, name: "Emily Davis", course: "CS101", grade: "A", attendance: 90, status: "Good Standing" },
  { id: 5, name: "Sarah Lee", course: "CS301", grade: "B", attendance: 92, status: "Good Standing" },
];

const waitlistStudents = [
  { id: 1, name: "Chris Wilson", course: "CS301", position: 1, appliedDate: "2026-04-20" },
  { id: 2, name: "Lisa Anderson", course: "CS301", position: 2, appliedDate: "2026-04-21" },
  { id: 3, name: "Tom Martinez", course: "CS301", position: 3, appliedDate: "2026-04-22" },
];

function InstructorHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-3xl text-slate-950">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export function InstructorDashboard() {
  return (
    <div className="space-y-6">
      <InstructorHeader
        title="Instructor Dashboard"
        description="A snapshot of your teaching load, student activity, and grading work."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned courses</p>
            <div className="mt-3 text-4xl text-slate-950">{instructorCourses.length}</div>
            <div className="mt-2"><Badge variant="info">Spring 2026</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Students</p>
            <div className="mt-3 text-4xl text-slate-950">{studentsList.length}</div>
            <div className="mt-2"><Badge variant="success">Active roster</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Waitlist</p>
            <div className="mt-3 text-4xl text-slate-950">{waitlistStudents.length}</div>
            <div className="mt-2"><Badge variant="warning">Pending review</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Average rating</p>
            <div className="mt-3 text-4xl text-slate-950">4.6</div>
            <div className="mt-2"><Badge variant="success">Excellent</Badge></div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl text-slate-950">Current Courses</h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {instructorCourses.map((course) => (
                <div key={course.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-950">{course.id}</h3>
                      <p className="mt-1 text-sm text-slate-600">{course.name}</p>
                      <div className="mt-2 text-xs text-slate-500">{course.time}</div>
                    </div>
                    <Badge variant={course.enrolled >= course.seats ? "danger" : "success"}>
                      {course.enrolled}/{course.seats} enrolled
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <h3 className="text-base text-amber-950">Low enrollment alert</h3>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  CS301 Database Systems is currently below target enrollment and may need review if the roster stays low.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function InstructorCoursesPage() {
  return (
    <div className="space-y-6">
      <InstructorHeader
        title="My Courses"
        description="Detailed course status, capacity, and waitlist load for your sections."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Teaching Load</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Course</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Time</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Enrolled</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Capacity</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Rating</th>
                  <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.16em] text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instructorCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-950">{course.id}</div>
                      <div className="mt-1 text-xs text-slate-600">{course.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{course.time}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-950">{course.enrolled}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700">{course.seats}</td>
                    <td className="px-6 py-4 text-center text-sm text-amber-700">{course.rating}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={course.enrolled >= course.seats ? "danger" : course.enrolled < 20 ? "warning" : "success"}>
                        {course.enrolled >= course.seats ? "Full" : course.enrolled < 20 ? "Watch" : "Healthy"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-700" />
            <h2 className="text-xl text-slate-950">Waitlist Queue</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-slate-100">
            {waitlistStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm text-amber-700">
                    {student.position}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-950">{student.name}</div>
                    <div className="mt-1 text-xs text-slate-600">{student.course}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">Applied {student.appliedDate}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function InstructorStudentsPage() {
  return (
    <div className="space-y-6">
      <InstructorHeader
        title="Students"
        description="Roster health, attendance, and standing for the students in your sections."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Roster Overview</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Student</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500">Course</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Grade</th>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Attendance</th>
                  <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.16em] text-slate-500">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsList.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-950">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{student.course}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-950">{student.grade}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700">{student.attendance}%</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={student.status === "Good Standing" ? "success" : "warning"}>{student.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function InstructorGradingPage() {
  const averageGrade = "A-";
  const submissionsPending = 7;

  return (
    <div className="space-y-6">
      <InstructorHeader
        title="Grading"
        description="A focused grading view with current averages and pending work."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Average grade</p>
            <div className="mt-3 text-4xl text-slate-950">{averageGrade}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending submissions</p>
            <div className="mt-3 text-4xl text-slate-950">{submissionsPending}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Grading status</p>
            <div className="mt-3"><Badge variant="warning">Needs review</Badge></div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl text-slate-950">Assessment Queue</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          {instructorCourses.map((course) => (
            <div key={course.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <div className="text-sm font-medium text-slate-950">{course.id}</div>
                <div className="mt-1 text-xs text-slate-600">{course.name}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="neutral">{Math.max(1, Math.round(course.enrolled / 5))} items pending</Badge>
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Review
                </Button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
