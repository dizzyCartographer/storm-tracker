import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import {
  getTenants,
  getCurrentUserInfo,
  TenantSummary,
} from "./api";
import { useAuth } from "./auth-context";

// One automatic retry after a short backoff before surfacing the error banner —
// most JWKS/token cold-start misses resolve on the second attempt (ST-077).
const AUTO_RETRY_BACKOFF_MS = 1500;

interface ProjectState {
  tenants: TenantSummary[];
  selectedTenant: TenantSummary | null;
  setSelectedTenantId: (id: string) => void;
  userId: string | null;
  loading: boolean;
  /** Non-null when the initial project load failed and dependent screens should
   *  show a retry banner instead of their empty states (ST-077). */
  error: string | null;
  refresh: () => Promise<void>;
}

const ProjectContext = createContext<ProjectState>({
  tenants: [],
  selectedTenant: null,
  setSelectedTenantId: () => {},
  userId: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { ready, isSignedIn } = useAuth();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantSummary | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ST-077: never fetch before the auth session has hydrated. Firing on mount
  // raced the token round-trip; a null JWT made the one-shot load fail silently
  // and every dependent screen rendered "No projects yet" until app restart.
  // Depending on [ready, isSignedIn] also re-runs the load after sign-in.
  useEffect(() => {
    if (!ready) return;
    if (!isSignedIn) {
      setTenants([]);
      setSelectedTenant(null);
      setUserId(null);
      setError(null);
      setLoading(false);
      return;
    }
    load();
  }, [ready, isSignedIn]);

  async function loadOnce() {
    const [t, user] = await Promise.all([getTenants(), getCurrentUserInfo()]);
    setTenants(t);
    if (user) setUserId(user.id);
    if (t.length > 0) {
      const defaultId = user?.defaultTenantId;
      const hasDefault = defaultId && t.some((tenant) => tenant.id === defaultId);
      setSelectedTenant(hasDefault ? t.find((tenant) => tenant.id === defaultId)! : t[0]);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      await loadOnce();
    } catch (firstError) {
      console.error("Failed to load projects (will auto-retry once):", firstError);
      try {
        await new Promise((resolve) => setTimeout(resolve, AUTO_RETRY_BACKOFF_MS));
        await loadOnce();
      } catch (e) {
        console.error("Failed to load projects:", e);
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  }

  function setSelectedTenantId(id: string) {
    const t = tenants.find((tenant) => tenant.id === id);
    if (t) setSelectedTenant(t);
  }

  const refresh = useCallback(async () => {
    await load();
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        tenants,
        selectedTenant,
        setSelectedTenantId,
        userId,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
