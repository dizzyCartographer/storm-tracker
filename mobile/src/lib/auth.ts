import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { jwtClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./config";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: "stormtracker",
      storage: SecureStore,
      storagePrefix: "storm_tracker",
    }),
    jwtClient(),
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
 * Calls the Better Auth JWT plugin's /token endpoint.
 */
export async function getJwt(): Promise<string | null> {
  try {
    const cookies = await authClient.getCookie();
    if (!cookies) return null;
    const res = await fetch(`${API_BASE_URL}/api/auth/token`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies,
        "expo-origin": "stormtracker://",
        "x-skip-oauth-proxy": "true",
      },
      credentials: "omit",
    });
    if (!res.ok) {
      console.warn("[getJwt] token request failed:", res.status);
      return null;
    }
    const data = await res.json();
    return data.token ?? null;
  } catch (err) {
    console.warn("[getJwt] error:", err);
    return null;
  }
}
