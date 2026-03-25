"use client";

import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { acceptDisclaimer } from "@/lib/actions/user-actions";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function DisclaimerModal({ onAccept, onCancel }: { onAccept: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Before you continue</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Storm Tracker is a data collection and observation tool designed to help caregivers
            organize behavioral observations for discussion with qualified healthcare professionals.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            The analysis, classifications, and patterns identified by this tool <strong>do not
            constitute a medical diagnosis, clinical assessment, or professional medical advice.</strong>{" "}
            All diagnostic decisions should be made by a licensed clinician with the training and
            expertise to evaluate your teen&apos;s unique presentation.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            By creating an account, you acknowledge that this tool is intended to support — not
            replace — professional clinical judgment.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go back
          </button>
          <button
            onClick={onAccept}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            I understand — create my account
          </button>
        </div>
      </div>
    </div>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShowDisclaimer(true);
  }

  async function handleAccept() {
    setShowDisclaimer(false);
    setLoading(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    if (error) {
      setLoading(false);
      setError(error.message ?? "Sign up failed");
      return;
    }
    // Record disclaimer acceptance
    try {
      await acceptDisclaimer();
    } catch {
      // Non-fatal — account was created successfully
    }
    router.push(redirect ?? "/dashboard");
  }

  return (
    <>
      {showDisclaimer && (
        <DisclaimerModal onAccept={handleAccept} onCancel={() => setShowDisclaimer(false)} />
      )}
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-gray-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense>
        <SignUpForm />
      </Suspense>
    </main>
  );
}
