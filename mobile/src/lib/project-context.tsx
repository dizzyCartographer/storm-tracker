import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import {
  getTenants,
  getCurrentUserInfo,
  TenantSummary,
} from "./api";

interface ProjectState {
  tenants: TenantSummary[];
  selectedTenant: TenantSummary | null;
  setSelectedTenantId: (id: string) => void;
  userId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProjectContext = createContext<ProjectState>({
  tenants: [],
  selectedTenant: null,
  setSelectedTenantId: () => {},
  userId: null,
  loading: true,
  refresh: async () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantSummary | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const [t, user] = await Promise.all([getTenants(), getCurrentUserInfo()]);
      setTenants(t);
      if (user) setUserId(user.id);
      if (t.length > 0) {
        const defaultId = user?.defaultTenantId;
        const hasDefault = defaultId && t.some((tenant) => tenant.id === defaultId);
        setSelectedTenant(hasDefault ? t.find((tenant) => tenant.id === defaultId)! : t[0]);
      }
    } catch (e) {
      console.error("Failed to load projects:", e);
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
