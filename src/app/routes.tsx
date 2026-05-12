import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Pages
import { Public } from "./pages/Public";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { ChangePassword } from "./pages/ChangePassword";
import { StudentDashboard } from "./pages/StudentDashboard";
import { Registration } from "./pages/Registration";
import { StudentRecords } from "./pages/StudentRecords";
import {
  InstructorDashboard,
  InstructorCoursesPage,
  InstructorStudentsPage,
  InstructorGradingPage,
} from "./pages/InstructorDashboard";
import {
  RegistrarDashboard,
  RegistrarApplicationsPage,
  RegistrarComplaintsPage,
  RegistrarSemesterControlPage,
} from "./pages/RegistrarDashboard";
import { AIAssistant } from "./pages/AIAssistant";
import { SmartCRE } from "./pages/SmartCRE";
import { Flow } from "./pages/Flow";
import { Handoff } from "./pages/Handoff";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Public },
      {
        path: "public",
        Component: PublicLayout,
        children: [
          { index: true, Component: Public },
        ],
      },
      { path: "login", Component: Login },
      { path: "change-password", Component: ChangePassword },
      {
        path: "student",
        Component: () => <ProtectedRoute allowedRole="student" />,
        children: [
          {
            Component: DashboardLayout,
            children: [
              { index: true, Component: StudentDashboard },
              { path: "registration", Component: Registration },
              { path: "records", Component: StudentRecords },
              { path: "smart-cre", Component: SmartCRE },
              { path: "ai-assistant", Component: AIAssistant },
            ],
          },
        ],
      },
      {
        path: "instructor",
        Component: () => <ProtectedRoute allowedRole="instructor" />,
        children: [
          {
            Component: DashboardLayout,
            children: [
              { index: true, Component: InstructorDashboard },
              { path: "courses", Component: InstructorCoursesPage },
              { path: "students", Component: InstructorStudentsPage },
              { path: "grading", Component: InstructorGradingPage },
            ],
          },
        ],
      },
      {
        path: "registrar",
        Component: () => <ProtectedRoute allowedRole="registrar" />,
        children: [
          {
            Component: DashboardLayout,
            children: [
              { index: true, Component: RegistrarDashboard },
              { path: "applications", Component: RegistrarApplicationsPage },
              { path: "complaints", Component: RegistrarComplaintsPage },
              { path: "semester-control", Component: RegistrarSemesterControlPage },
            ],
          },
        ],
      },
      { path: "flow", Component: Flow },
      { path: "handoff", Component: Handoff },
      { path: "*", Component: NotFound },
    ],
  },
]);
