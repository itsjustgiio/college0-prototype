import { Link } from "react-router";
import { Home } from "lucide-react";
import { Button } from "../components/Button";

export function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-6xl text-blue-600 mb-4">404</h1>
        <h2 className="text-2xl text-slate-900 mb-4">Page Not Found</h2>
        <p className="text-slate-600 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button variant="primary" className="gap-2">
            <Home className="w-4 h-4" />
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
