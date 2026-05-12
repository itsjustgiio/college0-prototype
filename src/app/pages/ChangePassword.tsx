import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { KeyRound } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

export function ChangePassword() {
  const navigate = useNavigate();
  const { user, changePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.mustChangePassword) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const nextUser = changePassword(password);
    navigate(`/${nextUser.role}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] px-5 py-8 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center">
        <section className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_56px_-40px_rgba(15,23,42,0.28)] md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <KeyRound className="h-7 w-7 text-blue-700" />
          </div>
          <h1 className="mt-6 text-3xl text-slate-950">Create a new password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your temporary password worked. Before entering the workspace, choose a new password.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">New password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Confirm password</span>
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800">
              Save password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
