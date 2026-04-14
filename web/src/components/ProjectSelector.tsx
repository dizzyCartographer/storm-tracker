import { useProject } from "../lib/project-context";

export default function ProjectSelector() {
  const { tenants, selectedTenant, setSelectedTenantId, loading } = useProject();

  if (loading || tenants.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#F0FDFA] border-b border-[#E2F0ED] overflow-x-auto">
      {tenants.map((t) => {
        const isActive = selectedTenant?.id === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setSelectedTenantId(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-white text-[#0D9488] shadow-sm border border-[#0D9488]"
                : "text-[#475569] hover:bg-white hover:shadow-sm border border-transparent"
            }`}
          >
            {t.teenFavoriteColor && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: t.teenFavoriteColor }}
              />
            )}
            {t.teenNickname || t.name}
          </button>
        );
      })}
    </div>
  );
}
