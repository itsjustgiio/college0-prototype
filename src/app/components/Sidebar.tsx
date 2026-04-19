import { Link, useLocation } from "react-router";
import { Home, BookOpen, Calendar, Users, MessageSquare, Sparkles, BarChart3, Settings, FileText, GraduationCap } from "lucide-react";

interface SidebarProps {
  role: "student" | "instructor" | "registrar";
}

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const roleTitle = role === "student" ? "Student Experience" : role === "instructor" ? "Faculty Operations" : "Registrar Control";

  const studentLinks = [
    { to: "/student", icon: Home, label: "Dashboard" },
    { to: "/student/registration", icon: Calendar, label: "Registration", badge: "UC-07" },
    { to: "/student/smart-cre", icon: Sparkles, label: "Smart CRE" },
    { to: "/student/ai-assistant", icon: MessageSquare, label: "AI Assistant", badge: "UC-17" },
  ];

  const instructorLinks = [
    { to: "/instructor", icon: Home, label: "Dashboard" },
    { to: "/instructor/courses", icon: BookOpen, label: "My Courses" },
    { to: "/instructor/students", icon: Users, label: "Students" },
    { to: "/instructor/grading", icon: BarChart3, label: "Grading" },
  ];

  const registrarLinks = [
    { to: "/registrar", icon: Home, label: "Dashboard" },
    { to: "/registrar/applications", icon: FileText, label: "Applications" },
    { to: "/registrar/complaints", icon: MessageSquare, label: "Complaints" },
    { to: "/registrar/semester-control", icon: Settings, label: "Semester Control" },
  ];

  const links = role === "student" ? studentLinks : role === "instructor" ? instructorLinks : registrarLinks;

  return (
    <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 lg:flex">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">College0</h1>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{role} portal</p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Workspace</p>
          <p className="mt-2 text-sm font-medium text-white">{roleTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">Operational tools, academic workflows, and live status in one place.</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.label}
              to={link.to}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all ${
                isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/6 hover:text-white"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                isActive ? "bg-slate-100 text-slate-900" : "bg-white/5 text-slate-300 group-hover:bg-white/10"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="flex-1 text-sm font-medium">{link.label}</span>
              {link.badge && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  isActive ? "bg-slate-100 text-slate-600" : "bg-white/8 text-slate-300"
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Release</p>
          <p className="mt-2 text-sm font-medium text-white">Prototype v1.0.0</p>
          <p className="mt-1 text-sm text-slate-300">Refined shell, cleaner hierarchy, and stronger system framing.</p>
        </div>
      </div>
    </aside>
  );
}
