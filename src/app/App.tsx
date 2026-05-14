import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./auth/AuthProvider";
import { runPrototypeCleanup } from "./services/localPrototypeCleanup";

runPrototypeCleanup();

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
