"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    >
      Sign out
    </button>
  );
}
