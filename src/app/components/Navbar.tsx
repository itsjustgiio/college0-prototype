import { Bell, Search, User } from "lucide-react";

interface NavbarProps {
  role: "student" | "instructor" | "registrar";
}

export function Navbar({ role }: NavbarProps) {
  const userName = role === "student" ? "John Doe" : role === "instructor" ? "Dr. Sarah Johnson" : "Admin User";
  const userEmail = role === "student" ? "john.doe@college0.edu" : role === "instructor" ? "sarah.johnson@college0.edu" : "admin@college0.edu";
  const roleLabel = role === "student" ? "Student Workspace" : role === "instructor" ? "Instructor Workspace" : "Registrar Workspace";

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
      <div className="flex items-center gap-4">
        <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-slate-500 md:block">
          {roleLabel}
        </div>
        <div className="min-w-0 flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses, students, or documents..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition-colors hover:bg-slate-50">
          <Bell className="h-5 w-5" />
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500">{userEmail}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
            <User className="h-5 w-5 text-blue-700" />
          </div>
        </div>
      </div>
    </header>
  );
}
