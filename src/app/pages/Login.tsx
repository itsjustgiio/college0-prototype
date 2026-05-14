import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ArrowLeft, GraduationCap, LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { students } from "../data/mockData";
import { localAuthRepository } from "../services/localAuthRepository";

interface DemoAccount {
  role: string;
  email: string;
  password: string;
}

const roleSummaries = [
  { role: "Student", description: "Course planning, progress, and advising tools." },
  { role: "Instructor", description: "Teaching load, roster, and grading views." },
  { role: "Registrar", description: "Applications, policy decisions, and oversight." },
];

export function Login() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const demoAccounts: DemoAccount[] = [
    ...students.map((student) => ({ role: "Student", email: student.email, password: "student123" })),
    ...localAuthRepository.listInstructorCredentials().map((instructor) => ({
      role: "Instructor",
      email: instructor.email,
      password: "faculty123",
    })),
    { role: "Registrar", email: "admin@college0.edu", password: "registrar123" },
  ];

  if (user) {
    return <Navigate to={user.mustChangePassword ? "/change-password" : `/${user.role}`} replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const nextUser = signIn(email, password);
      navigate(nextUser.mustChangePassword ? "/change-password" : `/${nextUser.role}`, { replace: true });
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to sign in.");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] px-5 py-8 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1fr_0.92fr]">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,#10243b_0%,#16385f_60%,#235f9d_100%)] p-8 text-white md:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-5xl text-white">College0 Login</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-blue-100/88">
            Sign in to open the student, instructor, or registrar workspace.
          </p>
          <div className="mt-8 space-y-3">
            {roleSummaries.map((summary) => {
              const matchingAccounts = demoAccounts.filter((account) => account.role === summary.role);
              const isExpanded = expandedRole === summary.role;

              return (
                <div key={summary.role} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{summary.role}</p>
                      <p className="mt-1 text-sm text-blue-100/85">{summary.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedRole(isExpanded ? null : summary.role)}
                      className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/15"
                    >
                      {isExpanded ? "Hide" : "View all"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-2">
                      {matchingAccounts.map((account) => (
                        <div key={account.email} className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3">
                          <p className="text-sm font-medium text-white">{account.email}</p>
                          <p className="mt-1 text-sm text-blue-100/85">{account.password}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_56px_-40px_rgba(15,23,42,0.28)] md:p-8">
          <div className="mb-6">
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Prototype authentication</p>
            <h2 className="mt-2 text-3xl text-slate-950">Sign in</h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800">
              <LogIn className="h-4 w-4" />
              Continue
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
