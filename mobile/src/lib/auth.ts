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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!signInRes.ok) {
      const data = await signInRes.json().catch(() => null);
      return {
        success: false,
        error: data?.message ?? "Invalid email or password",
      };
    }

    // Extract session cookie/token from the sign-in response
    const signInData = await signInRes.json();
    const sessionToken = signInData?.token ?? signInData?.session?.token;

    if (!sessionToken) {
      // Try extracting from set-cookie header
      const setCookie = signInRes.headers.get("set-cookie");
      if (!setCookie) {
        return { success: false, error: "No session token received" };
      }
      // Store the cookie for the token request
      await SecureStore.setItemAsync(SESSION_COOKIE_KEY, setCookie);
    }

    // Step 2: Get a JWT token
    const tokenHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Attach session auth — either via cookie or authorization header
    if (sessionToken) {
      tokenHeaders["Authorization"] = `Bearer ${sessionToken}`;
    } else {
      const storedCookie = await SecureStore.getItemAsync(SESSION_COOKIE_KEY);
      if (storedCookie) {
        tokenHeaders["Cookie"] = storedCookie;
      }
    }

    const tokenRes = await fetch(`${API_BASE_URL}/api/auth/token`, {
      method: "GET",
      headers: tokenHeaders,
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
