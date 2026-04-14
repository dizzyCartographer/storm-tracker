import { Link, Navigate } from "react-router";
import { useAuth } from "../lib/auth-context";
import { Logo } from "../components/Logo";
import { DisclaimerFooter } from "../components/DisclaimerFooter";

export default function Landing() {
  const { isLoading, isSignedIn } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EDF5F4] flex items-center justify-center">
        <p className="text-[#475569]">Loading...</p>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#EDF5F4] flex flex-col">
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="flex items-center gap-3 mb-4">
          <Logo size={40} />
          <h1 className="text-4xl font-bold tracking-tight text-[#0F172A]">
            Storm Tracker
          </h1>
        </div>
        <p className="mt-2 text-lg text-[#475569]">
          Structured behavioral observation for caregivers
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            to="/sign-in"
            className="rounded-lg bg-[#0D9488] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0F766E] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/sign-in"
            className="rounded-lg border border-[#D1E8E4] bg-white px-6 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#F0FDFA] transition-colors"
          >
            Create account
          </Link>
        </div>
      </main>
      <DisclaimerFooter />
    </div>
  );
}
