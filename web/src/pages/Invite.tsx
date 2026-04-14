import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useAuth } from "../lib/auth-context";
import { acceptInvite } from "../lib/api";
import { API_BASE_URL } from "../lib/config";

interface InviteDetails {
  valid: boolean;
  tenantName?: string;
  role?: string;
}

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isLoading: authLoading, isSignedIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchInviteDetails();
  }, [token]);

  async function fetchInviteDetails() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/invite-details?token=${token}`);
      if (!res.ok) throw new Error("Failed to fetch invite");
      const data: InviteDetails = await res.json();
      setInvite(data);
    } catch {
      setInvite({ valid: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    setError("");
    try {
      await acceptInvite(token);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  }

  if (loading || authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-[#EDF5F4]">
        <p className="text-[#475569]">Loading...</p>
      </main>
    );
  }

  if (!invite || !invite.valid) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-[#EDF5F4]">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-[#0F172A]">Invalid Invite</h1>
          <p className="mt-2 text-sm text-[#475569]">
            This invite link is invalid, expired, or has already been used.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm font-medium text-[#0D9488] underline"
          >
            Go home
          </Link>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-[#EDF5F4]">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-[#0F172A]">
            Join {invite.tenantName}
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            You&apos;ve been invited as a{" "}
            <span className="font-medium">
              {invite.role === "CAREGIVER" ? "caregiver" : "teen (self-observation)"}
            </span>
            .
          </p>
          <p className="mt-4 text-sm text-[#475569]">
            Sign in or create an account to accept this invite.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to={`/sign-in?redirect=/invite/${token}`}
              className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F766E] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to={`/sign-in?redirect=/invite/${token}`}
              className="rounded-lg border border-[#D1E8E4] px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#F0FDFA] transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-[#EDF5F4]">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-[#0F172A]">
          Join {invite.tenantName}
        </h1>
        <p className="mt-2 text-sm text-[#475569]">
          You&apos;ve been invited as a{" "}
          <span className="font-medium">
            {invite.role === "CAREGIVER" ? "caregiver" : "teen (self-observation)"}
          </span>
          .
        </p>
        {error && <p className="mt-2 text-sm text-[#DC2626]">{error}</p>}
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="mt-4 w-full rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
        >
          {accepting ? "Accepting..." : "Accept invite"}
        </button>
      </div>
    </main>
  );
}
