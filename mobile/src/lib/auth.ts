import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./api";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: "stormtracker",
      storage: SecureStore,
      storagePrefix: "storm_tracker",
    }),
  ],
});

/**
 * Sign in with email and password via Better Auth.
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const result = await authClient.signIn.email({ email, password });

    if (result.error) {
      return {
        success: false,
        error: result.error.message ?? "Invalid email or password",
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Sign out — clears the Better Auth session.
 */
export async function signOut(): Promise<void> {
  await authClient.signOut();
}

/**
 * Check if user has an active session.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await authClient.getSession();
    return !!session.data?.user;
  } catch {
    return false;
  }
}

/**
 * Get a JWT for Neon Data API requests.
 * The JWT plugin on the server issues these on demand.
 */
export async function getJwt(): Promise<string | null> {
  try {
    const result = await authClient.token();
    return result.data?.token ?? null;
  } catch {
    return null;
  }
}
