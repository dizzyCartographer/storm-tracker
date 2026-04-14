"use client";

import { useState } from "react";
import {
  createMedication,
  updateMedication,
  deleteMedication,
  discontinueMedication,
} from "@/lib/actions/medication-actions";
import { useRouter } from "next/navigation";

interface Med {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
}

export function MedicationManager({
  tenantId,
  medications,
  isOwner,
}: {
  tenantId: string;
  medications: Med[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Add form state
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [instructions, setInstructions] = useState("");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setName("");
    setDosage("");
    setFrequency("");
    setInstructions("");
    setStartDate("");
    setError("");
    setShowAdd(false);
    setEditId(null);
  }

  function startEdit(med: Med) {
    setEditId(med.id);
    setName(med.name);
    setDosage(med.dosage ?? "");
    setFrequency(med.frequency ?? "");
    setInstructions(med.instructions ?? "");
    setStartDate(med.startDate ? new Date(med.startDate).toISOString().split("T")[0] : "");
    setShowAdd(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await createMedication(tenantId, {
      name,
      dosage: dosage || undefined,
      frequency: frequency || undefined,
      instructions: instructions || undefined,
      startDate: startDate || undefined,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      resetForm();
      router.refresh();
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setBusy(true);
    setError("");
    const result = await updateMedication(editId, {
      name,
      dosage,
      frequency,
      instructions,
      startDate,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      resetForm();
      router.refresh();
    }
  }

  async function handleDiscontinue(id: string) {
    setBusy(true);
    await discontinueMedication(id);
    setBusy(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this medication record?")) return;
    setBusy(true);
    await deleteMedication(id);
    setBusy(false);
    router.refresh();
  }

  function formatDate(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const active = medications.filter((m) => m.isActive);
  const inactive = medications.filter((m) => !m.isActive);

  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

  const formContent = (
    <form onSubmit={editId ? handleUpdate : handleAdd} className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Medication name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Lamotrigine" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Dosage</label>
          <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} className={inputClass} placeholder="e.g. 50mg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Frequency</label>
          <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass} placeholder="e.g. twice daily" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Special instructions</label>
          <textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputClass} placeholder="Take with food, avoid grapefruit..." />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !name.trim()} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {busy ? "Saving..." : editId ? "Update" : "Add medication"}
        </button>
        <button type="button" onClick={resetForm} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Medications</h2>
        {isOwner && !showAdd && !editId && (
          <button onClick={() => setShowAdd(true)} className="text-sm text-gray-500 hover:text-gray-900">
            + Add
          </button>
        )}
      </div>

      {(showAdd || editId) && <div className="mt-3">{formContent}</div>}

      {active.length > 0 && (
        <div className="mt-3 space-y-2">
          {active.map((med) => (
            <div key={med.id} className="rounded-md border border-gray-200 px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{med.name}</span>
                    {med.dosage && <span className="text-xs text-gray-500">{med.dosage}</span>}
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                  </div>
                  {med.frequency && <p className="mt-0.5 text-xs text-gray-500">{med.frequency}</p>}
                  {med.instructions && <p className="mt-1 text-xs text-gray-500">{med.instructions}</p>}
                  {med.startDate && <p className="mt-1 text-xs text-gray-400">Started {formatDate(med.startDate)}</p>}
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(med)} className="text-xs text-gray-400 hover:text-gray-700">Edit</button>
                    <button onClick={() => handleDiscontinue(med.id)} disabled={busy} className="text-xs text-amber-500 hover:text-amber-700">Stop</button>
                    <button onClick={() => handleDelete(med.id)} disabled={busy} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
            {inactive.length} discontinued medication{inactive.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-2">
            {inactive.map((med) => (
              <div key={med.id} className="rounded-md border border-gray-100 bg-gray-50 px-4 py-2 opacity-60">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{med.name}</span>
                  {med.dosage && <span className="text-xs text-gray-400">{med.dosage}</span>}
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(med.startDate)} — {formatDate(med.endDate)}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {active.length === 0 && inactive.length === 0 && !showAdd && (
        <p className="mt-2 text-sm text-gray-400">No medications tracked yet.</p>
      )}
    </section>
  );
}
