import { useState } from "react";
import { useNavigate } from "react-router";
import { useProject } from "../lib/project-context";
import { createTenant, getTenantById, type TenantDetail } from "../lib/api";

export default function ProjectCreate() {
  const navigate = useNavigate();
  const { tenants, refresh } = useProject();
  const [name, setName] = useState("");
  const [copyFromId, setCopyFromId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required");
      return;
    }

    setBusy(true);
    setError("");

    try {
      let profileData: Partial<TenantDetail> = {};

      if (copyFromId) {
        const source = await getTenantById(copyFromId);
        if (source) {
          profileData = {
            description: source.description,
            purpose: source.purpose,
            teenFullName: source.teenFullName,
            teenNickname: source.teenNickname,
            teenBirthday: source.teenBirthday,
            teenFavoriteColor: source.teenFavoriteColor,
            teenInterests: source.teenInterests,
            teenSchool: source.teenSchool,
            teenFavoriteSubject: source.teenFavoriteSubject,
            teenHasIep: source.teenHasIep,
            teenDiagnosis: source.teenDiagnosis,
            teenOtherHealth: source.teenOtherHealth,
            onsetDate: source.onsetDate,
            familyHistory: source.familyHistory,
          };
        }
      }

      const tenantId = await createTenant({
        name: trimmedName,
        description: profileData.description ?? undefined,
        purpose: profileData.purpose ?? "ONGOING_TRACKING",
        teenFullName: profileData.teenFullName ?? undefined,
        teenNickname: profileData.teenNickname ?? undefined,
        teenBirthday: profileData.teenBirthday ?? undefined,
        teenFavoriteColor: profileData.teenFavoriteColor ?? undefined,
        teenInterests: profileData.teenInterests ?? undefined,
        teenSchool: profileData.teenSchool ?? undefined,
        teenFavoriteSubject: profileData.teenFavoriteSubject ?? undefined,
        teenHasIep: profileData.teenHasIep ?? false,
        teenDiagnosis: profileData.teenDiagnosis ?? undefined,
        teenOtherHealth: profileData.teenOtherHealth ?? undefined,
        onsetDate: profileData.onsetDate ?? undefined,
        familyHistory: profileData.familyHistory ?? undefined,
      });

      await refresh();
      navigate(`/projects/${tenantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-[#0F172A]">Create a Tracking Project</h1>
      <p className="mt-2 text-sm text-[#475569]">
        A project tracks one teen. You can invite other caregivers later.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#0F172A]">
            Teen's name or nickname
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            className="mt-1 block w-full rounded-lg border border-[#D1E8E4] px-3 py-2 text-sm bg-white focus:border-[#0D9488] focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
          />
        </div>

        {tenants.length > 0 && (
          <div>
            <label htmlFor="copyFrom" className="block text-sm font-medium text-[#0F172A]">
              Copy profile from existing project
            </label>
            <select
              id="copyFrom"
              value={copyFromId}
              onChange={(e) => setCopyFromId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[#D1E8E4] px-3 py-2 text-sm bg-white focus:border-[#0D9488] focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
            >
              <option value="">Start fresh</option>
              {tenants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Copies teen info, background, and description from the selected project.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-[#DC2626]">{error}</p>}

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="w-full rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
        >
          {busy ? "Creating..." : "Create project"}
        </button>
      </form>
    </div>
  );
}
