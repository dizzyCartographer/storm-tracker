"use client";

import { useState } from "react";
import { updateTenantProfile, type TenantProfileInput } from "@/lib/actions/tenant-actions";
import { useRouter } from "next/navigation";

type ProfileData = {
  name: string;
  description: string | null;
  purpose: string | null;
  teenFullName: string | null;
  teenNickname: string | null;
  teenBirthday: string | null;
  teenFavoriteColor: string | null;
  teenInterests: string | null;
  teenSchool: string | null;
  teenFavoriteSubject: string | null;
  teenHasIep: boolean | null;
  teenDiagnosis: string | null;
  teenOtherHealth: string | null;
  teenPhotoUrl: string | null;
  onsetDate: string | null;
  familyHistory: string | null;
};

export function ProjectProfileForm({
  tenantId,
  initial,
}: {
  tenantId: string;
  initial: ProfileData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: initial.name,
    description: initial.description ?? "",
    purpose: initial.purpose ?? "",
    teenFullName: initial.teenFullName ?? "",
    teenNickname: initial.teenNickname ?? "",
    teenBirthday: initial.teenBirthday ?? "",
    teenFavoriteColor: initial.teenFavoriteColor ?? "",
    teenInterests: initial.teenInterests ?? "",
    teenSchool: initial.teenSchool ?? "",
    teenFavoriteSubject: initial.teenFavoriteSubject ?? "",
    teenHasIep: initial.teenHasIep ?? false,
    teenDiagnosis: initial.teenDiagnosis ?? "",
    teenOtherHealth: initial.teenOtherHealth ?? "",
    onsetDate: initial.onsetDate ?? "",
    familyHistory: initial.familyHistory ?? "",
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const input: TenantProfileInput = {
      name: form.name,
      description: form.description || null,
      purpose: (form.purpose as TenantProfileInput["purpose"]) || null,
      teenFullName: form.teenFullName || null,
      teenNickname: form.teenNickname || null,
      teenBirthday: form.teenBirthday || null,
      teenFavoriteColor: form.teenFavoriteColor || null,
      teenInterests: form.teenInterests || null,
      teenSchool: form.teenSchool || null,
      teenFavoriteSubject: form.teenFavoriteSubject || null,
      teenHasIep: form.teenHasIep || null,
      teenDiagnosis: form.teenDiagnosis || null,
      teenOtherHealth: form.teenOtherHealth || null,
      onsetDate: form.onsetDate || null,
      familyHistory: form.familyHistory || null,
    };

    const result = await updateTenantProfile(tenantId, input);
    setSaving(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Saved");
      router.refresh();
      setTimeout(() => setMessage(""), 2000);
    }
  }

  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSave} className="mt-6 space-y-8">
      {/* Basic info */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Project info</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Project name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Purpose</label>
            <select
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              className={inputClass}
            >
              <option value="">Not specified</option>
              <option value="ONGOING_TRACKING">Ongoing tracking</option>
              <option value="DIAGNOSTIC_COLLECTION">Diagnostic data collection</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Notes about this project..."
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Teen info */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Teen info</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full name</label>
            <input
              type="text"
              value={form.teenFullName}
              onChange={(e) => set("teenFullName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nickname</label>
            <input
              type="text"
              value={form.teenNickname}
              onChange={(e) => set("teenNickname", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Birthday</label>
            <input
              type="date"
              value={form.teenBirthday}
              onChange={(e) => set("teenBirthday", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Favorite color</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.teenFavoriteColor || "#6b7280"}
                onChange={(e) => set("teenFavoriteColor", e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={form.teenFavoriteColor}
                onChange={(e) => set("teenFavoriteColor", e.target.value)}
                placeholder="#7c3aed"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>School</label>
            <input
              type="text"
              value={form.teenSchool}
              onChange={(e) => set("teenSchool", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Favorite subject</label>
            <input
              type="text"
              value={form.teenFavoriteSubject}
              onChange={(e) => set("teenFavoriteSubject", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Interests</label>
            <input
              type="text"
              value={form.teenInterests}
              onChange={(e) => set("teenInterests", e.target.value)}
              placeholder="Art, music, gaming..."
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="teenHasIep"
              checked={form.teenHasIep}
              onChange={(e) => set("teenHasIep", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="teenHasIep" className="text-sm font-medium text-gray-700">
              Has IEP (Individualized Education Program)
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Psychiatric diagnosis</label>
            <textarea
              rows={2}
              value={form.teenDiagnosis}
              onChange={(e) => set("teenDiagnosis", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Other health issues</label>
            <textarea
              rows={2}
              value={form.teenOtherHealth}
              onChange={(e) => set("teenOtherHealth", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Background */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Background</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Date of onset / first suspected</label>
            <input
              type="date"
              value={form.onsetDate}
              onChange={(e) => set("onsetDate", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Family history of mental illness</label>
            <textarea
              rows={3}
              value={form.familyHistory}
              onChange={(e) => set("familyHistory", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {message && (
          <span className={`text-sm ${message === "Saved" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
