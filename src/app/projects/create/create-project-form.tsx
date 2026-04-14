"use client";

import { useState } from "react";
import { createTenantWithProfile } from "@/lib/actions/tenant-actions";
import { useRouter } from "next/navigation";

export function CreateProjectForm({
  existingProjects,
}: {
  existingProjects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [copyFromId, setCopyFromId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required");
      setBusy(false);
      return;
    }

    const result = await createTenantWithProfile({
      name: trimmedName,
      copyFromTenantId: copyFromId || undefined,
    });

    if (result.error) {
      setError(result.error);
      setBusy(false);
    } else {
      router.push(`/projects/${result.tenantId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Teen&apos;s name or nickname
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {existingProjects.length > 0 && (
        <div>
          <label htmlFor="copyFrom" className="block text-sm font-medium">
            Copy profile from existing project
          </label>
          <select
            id="copyFrom"
            value={copyFromId}
            onChange={(e) => setCopyFromId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Start fresh</option>
            {existingProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Copies teen info, background, and description from the selected project.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {busy ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}
