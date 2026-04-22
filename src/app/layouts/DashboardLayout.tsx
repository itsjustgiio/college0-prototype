import { Outlet, useLocation } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";

export function DashboardLayout() {
  const location = useLocation();

  const role = location.pathname.startsWith("/student")
    ? "student"
    : location.pathname.startsWith("/instructor")
      ? "instructor"
      : location.pathname.startsWith("/registrar")
        ? "registrar"
        : "student";

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar role={role} />
        <main className="relative flex-1 overflow-y-auto px-5 pb-8 pt-6 md:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/65 to-transparent" />
          <div className="relative mx-auto max-w-[1480px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
