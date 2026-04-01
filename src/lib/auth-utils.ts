import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function requireUser() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    // Corrupt or invalid session — redirect to sign-in
  }
  if (session) return session.user;
  redirect("/sign-in");
}
