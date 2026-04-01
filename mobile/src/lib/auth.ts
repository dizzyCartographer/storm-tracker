import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./api";

const TOKEN_KEY = "storm_tracker_jwt";
const SESSION_COOKIE_KEY = "storm_tracker_session";

/**
 * Sign in with email and password.
 * 1. POST to Better Auth sign-in endpoint to create a session
 * 2. POST to /api/auth/token to get a JWT for mobile API access
 * 3. Store the JWT in SecureStore
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Step 1: Sign in to get a session
    const signInRes = await fetch(`${API_BASE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: API_BASE_URL,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!signInRes.ok) {
      const data = await signInRes.json().catch(() => null);
      return {
        success: false,
        error: data?.message ?? "Invalid email or password",
      };
    }

    // Extract session token from the sign-in response body
    const signInData = await signInRes.json();
    const sessionToken = signInData?.token ?? signInData?.session?.token;

    if (!sessionToken) {
      return { success: false, error: "No session token received" };
    }

    // Step 2: Get a JWT token — pass session token as a cookie
    const tokenRes = await fetch(`${API_BASE_URL}/api/auth/token`, {
      method: "GET",
      headers: {
        Cookie: `better-auth.session_token=${sessionToken}`,
        Origin: API_BASE_URL,
      },
    });

    if (!tokenRes.ok) {
      return {
        success: false,
        error: "Signed in but failed to get access token",
      };
    }

    const tokenData = await tokenRes.json();
    const jwt = tokenData?.token;

    if (!jwt) {
      return { success: false, error: "No JWT token in response" };
    }

    // Step 3: Store the JWT
    await SecureStore.setItemAsync(TOKEN_KEY, jwt);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Get the stored JWT token.
 */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Sign out — delete stored tokens.
 */
export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(SESSION_COOKIE_KEY);
}

/**
 * Check if user has a stored token.
 * Does NOT validate expiration — the API will return 401 if expired.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}
