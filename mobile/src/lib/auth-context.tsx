import React, { createContext, useContext, useEffect, useState } from "react";
import {
  isAuthenticated,
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
} from "./auth";

interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isLoading: true,
  isSignedIn: false,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const authenticated = await isAuthenticated();
    setIsSignedIn(authenticated);
    setIsLoading(false);
  }

  async function handleSignIn(email: string, password: string) {
    const result = await authSignIn(email, password);
    if (result.success) {
      setIsSignedIn(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  async function handleSignUp(email: string, password: string, name: string) {
    const result = await authSignUp(email, password, name);
    if (result.success) {
      setIsSignedIn(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  async function handleSignOut() {
    await authSignOut();
    setIsSignedIn(false);
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isSignedIn,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
