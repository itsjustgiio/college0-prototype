import { Link } from "react-router";
import { ArrowRight, GraduationCap, LogIn, ShieldCheck, Sparkles, User, UserCog } from "lucide-react";

export function Public() {
  const portals = [
    {
      to: "/student",
      icon: User,
      title: "Student",
      description: "Plan courses, monitor progress, and act on advisor or AI recommendations.",
      meta: "Registration, progress, support",
    },
    {
      to: "/instructor",
      icon: UserCog,
      title: "Instructor",
      description: "Review rosters, manage teaching load, and respond to waitlist and grading tasks.",
      meta: "Courses, students, grading",
    },
    {
      to: "/registrar",
      icon: ShieldCheck,
      title: "Registrar",
      description: "Oversee applications, policy workflows, semester controls, and escalations.",
      meta: "Operations, policy, oversight",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f6fa] px-5 py-8 md:px-8">
      <div className="absolute inset-x-0 top-0 h-[540px] bg-[linear-gradient(135deg,#10243b_0%,#16385f_55%,#235f9d_100%)]" />

      <div className="relative mx-auto max-w-[1360px]">
        <div className="mb-8 flex items-center justify-between rounded-[28px] border border-white/10 bg-white/6 px-5 py-4 text-white md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold">College0</div>
              <div className="text-xs uppercase tracking-[0.24em] text-blue-100/80">Program Management System</div>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-sm text-blue-100/80 md:flex">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">Spring 2026</span>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-emerald-100">System healthy</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.95fr]">
          <section className="rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,#2d4f76_0%,#29496d_100%)] p-8 text-white shadow-[0_30px_80px_-50px_rgba(4,18,39,0.7)] md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-blue-100/90">
              <Sparkles className="h-3.5 w-3.5" />
              Unified academic operations
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl text-white md:text-6xl">
              A cleaner system for running registration, advising, and oversight.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100/88">
              College0 brings student planning, faculty workflows, and registrar controls into one coordinated workspace with fewer dead ends and better status visibility.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-3xl font-semibold">94%</p>
                <p className="mt-2 text-sm text-blue-100/76">Graduation rate across active cohorts</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-3xl font-semibold">10</p>
                <p className="mt-2 text-sm text-blue-100/76">Programs with live registration support</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-3xl font-semibold">4.3</p>
                <p className="mt-2 text-sm text-blue-100/76">Average course experience rating</p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-blue-100/76">
              <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">Role-based portals</span>
              <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">AI guidance where it helps</span>
              <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">Policy-aware workflows</span>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_56px_-40px_rgba(15,23,42,0.28)] xl:p-7">
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Choose a portal</p>
              <h2 className="mt-2 text-3xl text-slate-950">Sign in to your workspace</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Each role gets a tailored operational view, not a one-size-fits-all dashboard.</p>
            </div>

            <div className="space-y-4">
              {portals.map((portal) => {
                const Icon = portal.icon;

                return (
                  <Link key={portal.title} to={portal.to} className="group block">
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_20px_50px_-34px_rgba(15,23,42,0.22)]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-xl text-slate-950">{portal.title}</h3>
                            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{portal.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{portal.meta}</span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                              <LogIn className="h-4 w-4" />
                              Continue
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.16)]">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Student flow</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">Registration blockers, graduation progress, and AI recommendations are visible in one view.</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.16)]">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Faculty flow</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">Course load, rosters, low-enrollment alerts, and waitlist activity feel operational instead of decorative.</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.16)]">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Registrar flow</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">Applications, complaints, phase control, and policy actions are framed as an oversight console.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
