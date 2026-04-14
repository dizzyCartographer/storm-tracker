"use client";

import { useState, useTransition } from "react";
import { linkFramework, unlinkFramework } from "@/lib/actions/framework-actions";
import { useRouter } from "next/navigation";

interface Framework {
  id: string;
  slug: string;
  name: string;
  version: string;
}

export function FrameworkManager({
  tenantId,
  available,
  linked,
  isOwner,
}: {
  tenantId: string;
  available: Framework[];
  linked: string[]; // frameworkIds currently linked
  isOwner: boolean;
}) {
  const router = useRouter();
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set(linked));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function toggle(frameworkId: string, checked: boolean) {
    setError("");
    const optimistic = new Set(linkedIds);
    if (checked) optimistic.add(frameworkId);
    else optimistic.delete(frameworkId);
    setLinkedIds(optimistic);

    startTransition(async () => {
      const result = checked
        ? await linkFramework(tenantId, frameworkId)
        : await unlinkFramework(tenantId, frameworkId);

      if (result.error) {
        // Revert optimistic update
        setLinkedIds(new Set(linked));
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Diagnostic Frameworks
      </h2>
      <p className="mt-1 text-xs text-gray-400">
        Controls which behavior checklists appear on the log page.
      </p>

      {available.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">No diagnostic frameworks available.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {available.map((fw) => {
            const isLinked = linkedIds.has(fw.id);
            return (
              <li
                key={fw.id}
                className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-gray-800">{fw.name}</span>
                  <span className="ml-2 text-xs text-gray-400">v{fw.version}</span>
                  {isLinked && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Active
                    </span>
                  )}
                </div>
                {isOwner && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={isLinked}
                      disabled={pending}
                      onChange={(e) => toggle(fw.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900"
                    />
                    {isLinked ? "Enabled" : "Disabled"}
                  </label>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
