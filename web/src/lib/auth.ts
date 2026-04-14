import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";
import { API_BASE_URL } from "./config";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [jwtClient()],
});

export async function signIn(
  email: string,
  password: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });
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

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const result = await authClient.signUp.email({ email, password, name });
    if (result.error) {
      return {
        success: false,
        error: result.error.message ?? "Sign up failed",
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

export async function signOut(): Promise<void> {
  await authClient.signOut();
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await authClient.getSession();
    return !!session.data?.user;
  } catch {
    return false;
  }
}
