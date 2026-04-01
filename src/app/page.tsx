import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold tracking-tight">Storm Tracker</h1>
      <p className="mt-4 text-lg text-gray-600">
        Parental Bipolar Prodrome Tracker
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
