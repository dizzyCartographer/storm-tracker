"use client";

import { useState } from "react";
import {
  createStrategy,
  deleteStrategy,
  seedDefaultStrategies,
} from "@/lib/actions/strategy-actions";
import { useRouter } from "next/navigation";

interface StrategyData {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isDefault: boolean;
}

export function StrategyManager({
  tenantId,
  strategies,
  isOwner,
}: {
  tenantId: string;
  strategies: StrategyData[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  async function handleSeed() {
    setBusy(true);
    await seedDefaultStrategies(tenantId);
    setBusy(false);
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await createStrategy(tenantId, {
      name,
      description: description || undefined,
      category: category || undefined,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      setName("");
      setDescription("");
      setCategory("");
      setShowAdd(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this strategy?")) return;
    setBusy(true);
    await deleteStrategy(id);
    setBusy(false);
    router.refresh();
  }

  // Group by category
  const grouped = new Map<string, StrategyData[]>();
  for (const s of strategies) {
    const cat = s.category ?? "Other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(s);
  }

  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Strategies</h2>
        {isOwner && (
          <div className="flex gap-2">
            {strategies.length === 0 && (
              <button onClick={handleSeed} disabled={busy} className="text-xs text-blue-500 hover:text-blue-700">
                Load defaults
              </button>
            )}
            {!showAdd && (
              <button onClick={() => setShowAdd(true)} className="text-sm text-gray-500 hover:text-gray-900">
                + Add
              </button>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mt-3 space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Strategy name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Bedtime routine" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="e.g. Sleep, Communication" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !name.trim()} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
              {busy ? "Adding..." : "Add strategy"}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setError(""); }} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {strategies.length === 0 && !showAdd ? (
        <p className="mt-2 text-sm text-gray-400">No strategies yet. {isOwner && "Click \"Load defaults\" to add starter strategies."}</p>
      ) : (
        <div className="mt-3 space-y-4">
          {Array.from(grouped.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{cat}</h3>
                <div className="mt-1 space-y-1">
                  {items.map((s) => (
                    <div key={s.id} className="flex items-start justify-between rounded-md border border-gray-100 px-3 py-2">
                      <div>
                        <span className="text-sm font-medium">{s.name}</span>
                        {s.isDefault && (
                          <span className="ml-1.5 text-xs text-gray-400">(default)</span>
                        )}
                        {s.description && (
                          <p className="mt-0.5 text-xs text-gray-500">{s.description}</p>
                        )}
                      </div>
                      {isOwner && (
                        <button onClick={() => handleDelete(s.id)} disabled={busy} className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
