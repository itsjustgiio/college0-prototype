import { Link } from "react-router";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardBody } from "../components/Card";
import { Button } from "../components/Button";

export function Flow() {
  const flows = [
    {
      title: 'Main User Flow',
      description: 'Primary student journey through the system',
      steps: [
        { label: 'Public View', to: '/public', description: 'Explore program information' },
        { label: 'Login', to: '/student', description: 'Access student portal' },
        { label: 'Dashboard', to: '/student', description: 'View academic status & progress' },
        { label: 'Registration', to: '/student/registration', description: 'Select 2-4 courses (BR-03)' },
        { label: 'Smart CRE', to: '/student/smart-cre', description: 'AI-powered recommendations' },
        { label: 'AI Assistant', to: '/student/ai-assistant', description: 'Get instant answers' },
      ],
    },
    {
      title: 'Registrar Workflow',
      description: 'Administrative oversight and management',
      steps: [
        { label: 'Dashboard', to: '/registrar', description: 'System overview' },
        { label: 'Applications', to: '/registrar', description: 'Review pending applications' },
        { label: 'Semester Control', to: '/registrar', description: '4-phase semester management' },
        { label: 'Complaints', to: '/registrar', description: 'Handle student complaints' },
      ],
    },
    {
      title: 'Instructor Workflow',
      description: 'Course and student management',
      steps: [
        { label: 'Dashboard', to: '/instructor', description: 'View assigned courses' },
        { label: 'Students', to: '/instructor', description: 'Manage enrolled students' },
        { label: 'Waitlist', to: '/instructor', description: 'Process waitlist requests' },
        { label: 'Grading', to: '/instructor', description: 'Submit course grades' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Cover
        </Link>

        <h1 className="text-4xl mb-2">Prototype Flows</h1>
        <p className="text-slate-600 mb-12">Interactive user journeys and workflows</p>

        <div className="space-y-12">
          {flows.map((flow, flowIndex) => (
            <Card key={flowIndex}>
              <CardBody className="p-8">
                <h2 className="text-2xl mb-2">{flow.title}</h2>
                <p className="text-slate-600 mb-8">{flow.description}</p>

                <div className="relative">
                  {/* Flow Steps */}
                  <div className="flex items-center gap-4 overflow-x-auto pb-4">
                    {flow.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center gap-4 flex-shrink-0">
                        {/* Step Card */}
                        <Link to={step.to}>
                          <div className="w-64 p-6 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                                {stepIndex + 1}
                              </div>
                              <h3 className="text-lg text-slate-900">{step.label}</h3>
                            </div>
                            <p className="text-sm text-slate-600">{step.description}</p>
                            <div className="mt-4">
                              <Button variant="outline" size="sm" className="w-full">
                                View Screen
                              </Button>
                            </div>
                          </div>
                        </Link>

                        {/* Arrow */}
                        {stepIndex < flow.steps.length - 1 && (
                          <ArrowRight className="w-6 h-6 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {/* Business Rules Flow */}
          <Card>
            <CardBody className="p-8">
              <h2 className="text-2xl mb-2">Key Business Rules</h2>
              <p className="text-slate-600 mb-8">Critical system constraints visualized in the prototype</p>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded mb-3">
                    BR-03
                  </div>
                  <h3 className="text-lg mb-2">Course Registration Limits</h3>
                  <p className="text-sm text-slate-700 mb-4">
                    Students MUST register for 2-4 courses per semester.
                    This constraint is enforced in the registration flow.
                  </p>
                  <Link to="/student/registration">
                    <Button variant="outline" size="sm">View in Registration</Button>
                  </Link>
                </div>

                <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <div className="inline-block px-3 py-1 bg-yellow-600 text-white text-sm rounded mb-3">
                    BR-05
                  </div>
                  <h3 className="text-lg mb-2">GPA Termination</h3>
                  <p className="text-sm text-slate-700 mb-4">
                    Students with GPA below 2.0 face termination.
                    Warning displayed in student dashboard.
                  </p>
                  <Link to="/student">
                    <Button variant="outline" size="sm">View in Dashboard</Button>
                  </Link>
                </div>

                <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="inline-block px-3 py-1 bg-red-600 text-white text-sm rounded mb-3">
                    BR-06
                  </div>
                  <h3 className="text-lg mb-2">Warning System</h3>
                  <p className="text-sm text-slate-700 mb-4">
                    Three warnings result in suspension.
                    Tracked in registrar dashboard.
                  </p>
                  <Link to="/registrar">
                    <Button variant="outline" size="sm">View in Registrar</Button>
                  </Link>
                </div>

                <div className="p-6 bg-purple-50 border-2 border-purple-200 rounded-xl">
                  <div className="inline-block px-3 py-1 bg-purple-600 text-white text-sm rounded mb-3">
                    BR-08
                  </div>
                  <h3 className="text-lg mb-2">Course Cancellation</h3>
                  <p className="text-sm text-slate-700 mb-4">
                    Courses with fewer than 3 students are cancelled.
                    Monitored in instructor dashboard.
                  </p>
                  <Link to="/instructor">
                    <Button variant="outline" size="sm">View in Instructor</Button>
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
