import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useProject } from "../lib/project-context";
import { getCurrentUserInfo, setDefaultTenant } from "../lib/api";

export default function Projects() {
  const { tenants, selectedTenant, loading, refresh } = useProject();
  const [defaultTenantId, setDefaultTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserInfo().then((u) => {
      if (u) {
        setDefaultTenantId(u.defaultTenantId);
        setUserId(u.id);
      }
    });
  }, []);

  async function handleSetDefault(tenantId: string) {
    if (!userId) return;
    await setDefaultTenant(userId, tenantId);
    setDefaultTenantId(tenantId);
  }

  if (loading) {
    return <p className="text-[#475569] py-8 text-center">Loading...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#0F172A]">Projects</h1>
        <Link
          to="/projects/create"
          className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F766E] transition-colors"
        >
          New project
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#475569]">No projects yet.</p>
          <Link
            to="/projects/create"
            className="mt-2 inline-block text-sm font-medium text-[#0D9488] hover:underline"
          >
            Create your first tracking project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl shadow-sm border border-[#E2F0ED] p-4 flex items-center justify-between"
            >
              <Link
                to={`/projects/${t.id}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                {t.teenFavoriteColor && (
                  <span
                    className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.teenFavoriteColor }}
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-[#0F172A] truncate">{t.name}</p>
                  <p className="text-xs text-[#94A3B8]">
                    {t.role.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                {defaultTenantId === t.id ? (
                  <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-medium text-[#059669]">
                    Default
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(t.id)}
                    className="text-xs text-[#94A3B8] hover:text-[#0D9488] transition-colors"
                  >
                    Set default
                  </button>
                )}
                <Link to={`/projects/${t.id}`} className="text-[#94A3B8] text-sm">
                  &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
