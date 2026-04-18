import { Link } from "react-router";
import { ArrowLeft, CheckCircle, FileText, Users, Code, Palette } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";

export function Handoff() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Cover
        </Link>

        <h1 className="text-4xl mb-2">Handoff Documentation</h1>
        <p className="text-slate-600 mb-12">Complete guide for developers and stakeholders</p>

        <div className="space-y-8">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl">Project Overview</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg mb-2">System Purpose</h3>
                  <p className="text-slate-700">
                    College0 is an AI-enabled college program management system designed as a desktop web application.
                    This prototype demonstrates the complete user interface, role-based access, and business rule
                    enforcement for a systems design report.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg mb-2">Technology Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">React</Badge>
                    <Badge variant="info">TypeScript</Badge>
                    <Badge variant="info">Tailwind CSS v4</Badge>
                    <Badge variant="info">React Router</Badge>
                    <Badge variant="info">Lucide Icons</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg mb-2">Design Specifications</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>• Desktop-first design (1440px optimal width)</li>
                    <li>• Blue-based color system (#2563eb primary)</li>
                    <li>• Rounded cards (12px border-radius)</li>
                    <li>• Consistent 32px page padding</li>
                    <li>• 256px sidebar width</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* User Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl">User Roles</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="text-lg mb-2">Visitor</h3>
                  <p className="text-sm text-slate-600 mb-2">Public access to program information</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• View top-rated courses</li>
                    <li>• See highest GPA students</li>
                    <li>• Access AI assistant</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="text-lg mb-2">Student</h3>
                  <p className="text-sm text-slate-600 mb-2">Course registration and management</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Register for 2-4 courses (BR-03)</li>
                    <li>• View GPA and progress</li>
                    <li>• Get AI recommendations</li>
                    <li>• Submit course reviews</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="text-lg mb-2">Instructor</h3>
                  <p className="text-sm text-slate-600 mb-2">Course and student oversight</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• View assigned courses</li>
                    <li>• Manage enrolled students</li>
                    <li>• Process waitlist</li>
                    <li>• Submit grades</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="text-lg mb-2">Registrar</h3>
                  <p className="text-sm text-slate-600 mb-2">System administration</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Control semester phases</li>
                    <li>• Review applications</li>
                    <li>• Handle complaints</li>
                    <li>• Monitor at-risk students</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Business Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl">Business Rules Implemented</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info">BR-03</Badge>
                    <h3 className="text-lg">Course Registration Limits</h3>
                  </div>
                  <p className="text-sm text-slate-700">
                    Students must register for 2-4 courses per semester. Enforced in registration flow
                    with real-time validation and error messages.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="warning">BR-05</Badge>
                    <h3 className="text-lg">GPA Termination</h3>
                  </div>
                  <p className="text-sm text-slate-700">
                    Students with GPA below 2.0 face termination. Warning alerts displayed in
                    student dashboard and registrar overview.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-red-500 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="danger">BR-06</Badge>
                    <h3 className="text-lg">Warning System</h3>
                  </div>
                  <p className="text-sm text-slate-700">
                    Three warnings result in suspension. Tracked and displayed with warning
                    counters throughout the system.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info">BR-08</Badge>
                    <h3 className="text-lg">Course Cancellation</h3>
                  </div>
                  <p className="text-sm text-slate-700">
                    Courses with fewer than 3 students are cancelled. Low enrollment warnings
                    shown in instructor dashboard.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="success">BR-10</Badge>
                    <h3 className="text-lg">Semester Phases</h3>
                  </div>
                  <p className="text-sm text-slate-700">
                    4-phase semester system (Registration, Classes, Grading, Review) managed
                    through registrar control panel.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl">Key Features</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg mb-3">Course Registration (UC-07)</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>2-4 course selection with validation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Time conflict detection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Automatic waitlist for full courses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Real-time registration summary</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg mb-3">AI Assistant (UC-17)</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Local database search first</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>LLM fallback with warning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Source attribution (DB vs LLM)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Suggested questions</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg mb-3">Smart CRE</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>AI-powered course recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Multi-factor scoring system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Detailed reasoning explanations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>One-click add to registration</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg mb-3">Waitlist Management</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Automatic enrollment when full</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Position tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Instructor oversight panel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Student status badges</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Component Library */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl">Reusable Components</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm mb-1">Sidebar</h4>
                  <p className="text-xs text-slate-600">Role-based navigation</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm mb-1">Navbar</h4>
                  <p className="text-xs text-slate-600">Search & user profile</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm mb-1">Card</h4>
                  <p className="text-xs text-slate-600">Content containers</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm mb-1">Button</h4>
                  <p className="text-xs text-slate-600">5 variants, 3 sizes</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm mb-1">Badge</h4>
                  <p className="text-xs text-slate-600">Status indicators</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm mb-1">Tables</h4>
                  <p className="text-xs text-slate-600">Data presentation</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Next Steps */}
          <Card className="border-blue-300 bg-blue-50">
            <CardBody>
              <h2 className="text-2xl mb-4">Next Steps for Implementation</h2>
              <ol className="space-y-2 text-slate-700">
                <li>1. Connect to real database (replace mock data)</li>
                <li>2. Implement authentication system</li>
                <li>3. Add backend API endpoints</li>
                <li>4. Integrate actual AI/ML models for Smart CRE</li>
                <li>5. Add form validation and error handling</li>
                <li>6. Implement real-time notifications</li>
                <li>7. Add analytics and reporting</li>
                <li>8. Conduct user testing and refinement</li>
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
