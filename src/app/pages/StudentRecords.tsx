import { TrendingDown, BookOpen, GraduationCap } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Badge } from "../components/Badge";
import { useAuth } from "../auth/AuthProvider";
import { localCollegeRepository } from "../services/localCollegeRepository";

export function StudentRecords() {
  const { user } = useAuth();
  const student = localCollegeRepository.getStudentProfile({
    name: user?.name ?? "Student",
    email: user?.email ?? "",
  });
  const { completed, computedGpa, biggestGpaDrags } = localCollegeRepository.getStudentGpaBreakdown(student.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-slate-950">Academic Records</h1>
        <p className="mt-1 text-sm text-slate-600">Completed coursework, GPA context, and the classes affecting your average most.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Profile GPA</p>
            <div className="mt-3 text-4xl text-slate-950">{student.gpa.toFixed(2)}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Computed from history</p>
            <div className="mt-3 text-4xl text-slate-950">{computedGpa.toFixed(2)}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Completed courses</p>
            <div className="mt-3 text-4xl text-slate-950">{completed.length}</div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl text-slate-950">Completed Course History</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {completed.map((course) => (
              <div key={`${course.id}-${course.semester}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{course.id} - {course.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{course.semester} - {course.credits} credits</p>
                  </div>
                  <Badge variant={course.grade.startsWith("A") ? "success" : course.grade.startsWith("B") ? "info" : "warning"}>
                    {course.grade}
                  </Badge>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-700" />
              <h2 className="text-xl text-slate-950">Largest GPA Drags</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {biggestGpaDrags.map((course) => (
              <div key={`${course.id}-${course.semester}-drag`} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-sm font-medium text-amber-950">{course.id} - {course.name}</p>
                <p className="mt-1 text-sm text-amber-800">Grade {course.grade} - {course.gradePoints.toFixed(1)} grade points</p>
              </div>
            ))}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-medium text-slate-950">
                <GraduationCap className="h-4 w-4 text-slate-700" />
                GPA explanation
              </div>
              <p className="mt-2">
                This local prototype computes GPA from completed course grades so the number has a visible record behind it.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
