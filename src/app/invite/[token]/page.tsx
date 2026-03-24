import { getInviteDetails, acceptInvite } from "@/lib/actions/invite-actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteDetails(token);

  if (!invite) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold">Invalid Invite</h1>
          <p className="mt-2 text-sm text-gray-500">
            This invite link is invalid, expired, or has already been used.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-gray-900 underline"
          >
            Go home
          </Link>
        </div>
      </main>
    );
  }

  // Check if user is logged in
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold">
            Join {invite.tenantName}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            You&apos;ve been invited as a{" "}
            <span className="font-medium">
              {invite.role === "CAREGIVER" ? "caregiver" : "teen (self-observation)"}
            </span>
            .
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Sign in or create an account to accept this invite.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={`/sign-in?redirect=/invite/${token}`}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Sign in
            </Link>
            <Link
              href={`/sign-up?redirect=/invite/${token}`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // User is logged in — show accept button
  async function handleAccept() {
    "use server";
    await acceptInvite(token);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-bold">
          Join {invite.tenantName}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          You&apos;ve been invited as a{" "}
          <span className="font-medium">
            {invite.role === "CAREGIVER" ? "caregiver" : "teen (self-observation)"}
          </span>
          .
        </p>
        <form action={handleAccept} className="mt-4">
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Accept invite
          </button>
        </form>
      </div>
    </main>
  );
}
