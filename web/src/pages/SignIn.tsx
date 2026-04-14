import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { useNavigate } from "react-router";

export default function SignIn() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setLoading(true);

    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, name.trim());

    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error ?? "Something went wrong");
    }
  }

  return (
    <div className="min-h-screen bg-[#EDF5F4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-[#0D9488] text-center mb-8">
          Storm Tracker
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 space-y-4"
        >
          <h2 className="text-xl font-semibold text-[#0F172A] text-center">
            {mode === "signin" ? "Log In" : "Create Account"}
          </h2>

          {error && (
            <div className="bg-[#FEF2F2] text-[#DC2626] text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-[#D1E8E4] rounded-lg px-3 py-2 text-[#0F172A] bg-[#FAFEFE] focus:outline-none focus:border-[#0D9488]"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#D1E8E4] rounded-lg px-3 py-2 text-[#0F172A] bg-[#FAFEFE] focus:outline-none focus:border-[#0D9488]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#D1E8E4] rounded-lg px-3 py-2 text-[#0F172A] bg-[#FAFEFE] focus:outline-none focus:border-[#0D9488]"
              required
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-[#D1E8E4] rounded-lg px-3 py-2 text-[#0F172A] bg-[#FAFEFE] focus:outline-none focus:border-[#0D9488]"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D9488] text-white font-semibold py-2.5 rounded-lg hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
          >
            {loading
              ? "..."
              : mode === "signin"
                ? "Log In"
                : "Create Account"}
          </button>

          <p className="text-center text-sm text-[#475569]">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="text-[#0D9488] font-medium hover:underline"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="text-[#0D9488] font-medium hover:underline"
                >
                  Log In
                </button>
              </>
            )}
          </p>
        </form>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          Storm Tracker is an observation tool, not a diagnostic instrument.
          Always consult a qualified clinician for diagnosis and treatment
          decisions.
        </p>
      </div>
    </div>
  );
}
