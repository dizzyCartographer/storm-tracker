import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  getTenantById,
  getTenantMembers,
  getUsersByIds,
  getFullMedications,
  getFullStrategies,
  getCustomItems,
  getInvites,
  getTenantFrameworkDetails,
  getCurrentUserInfo,
  updateTenantProfile,
  deleteTenant,
  setDefaultTenant,
  createMedication,
  updateMedication,
  deleteMedication,
  createStrategy,
  deleteStrategy,
  createCustomItem,
  deleteCustomItem,
  createInvite,
  deleteInvite,
  type TenantDetail,
  type FullMedicationRow,
  type FullStrategyRow,
  type CustomItemRow,
  type InviteRow,
  type FrameworkSummary,
  type UserInfoRow,
} from "../lib/api";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [members, setMembers] = useState<{ userId: string; role: string; name: string; email: string }[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [defaultTenantId, setDefaultTenantIdState] = useState<string | null>(null);
  const [medications, setMedications] = useState<FullMedicationRow[]>([]);
  const [strategies, setStrategies] = useState<FullStrategyRow[]>([]);
  const [customItems, setCustomItems] = useState<CustomItemRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [frameworks, setFrameworks] = useState<FrameworkSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = userRole === "OWNER";

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [t, user] = await Promise.all([
        getTenantById(id),
        getCurrentUserInfo(),
      ]);
      if (!t) {
        navigate("/projects");
        return;
      }
      setTenant(t);
      setUserId(user?.id ?? null);
      setDefaultTenantIdState(user?.defaultTenantId ?? null);

      const memberRows = await getTenantMembers(id);
      const currentMember = memberRows.find((m: { userId: string }) => m.userId === user?.id);
      setUserRole(currentMember?.role ?? null);

      const userIds = memberRows.map((m: { userId: string }) => m.userId);
      const users = userIds.length > 0 ? await getUsersByIds(userIds) : [];
      const userMap = new Map(users.map((u: UserInfoRow) => [u.id, u]));

      setMembers(
        memberRows.map((m: { userId: string; role: string }) => ({
          userId: m.userId,
          role: m.role,
          name: userMap.get(m.userId)?.name ?? "",
          email: userMap.get(m.userId)?.email ?? "",
        }))
      );

      const isOwnerRole = currentMember?.role === "OWNER";

      const [meds, strats, items, inv, fw] = await Promise.all([
        getFullMedications(id),
        getFullStrategies(id),
        getCustomItems(id),
        isOwnerRole ? getInvites(id) : Promise.resolve([]),
        getTenantFrameworkDetails(id),
      ]);
      setMedications(meds);
      setStrategies(strats);
      setCustomItems(items);
      setInvites(inv);
      setFrameworks(fw);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-[#475569] py-8 text-center">Loading...</p>;
  }

  if (!tenant) {
    return <p className="text-[#475569] py-8 text-center">Project not found.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/projects" className="text-sm text-[#94A3B8] hover:text-[#0D9488]">
        &larr; All projects
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0F172A]">{tenant.name}</h1>
        {defaultTenantId === id && (
          <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-medium text-[#059669]">
            Default
          </span>
        )}
      </div>

      {/* Profile form (owner) or read-only summary */}
      {isOwner ? (
        <ProfileForm tenant={tenant} tenantId={id!} onSaved={(t) => setTenant(t)} />
      ) : (
        <div className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-[#E2F0ED]">
          {tenant.description && <p className="text-sm text-[#475569]">{tenant.description}</p>}
          {tenant.teenFullName && <p className="mt-2 text-sm text-[#94A3B8]">Teen: {tenant.teenFullName}</p>}
        </div>
      )}

      {/* Medications */}
      <MedicationsSection
        tenantId={id!}
        medications={medications}
        isOwner={isOwner}
        onUpdate={setMedications}
      />

      {/* Strategies */}
      <StrategiesSection
        tenantId={id!}
        strategies={strategies}
        isOwner={isOwner}
        onUpdate={setStrategies}
      />

      {/* Custom items */}
      <CustomItemsSection
        tenantId={id!}
        items={customItems}
        isOwner={isOwner}
        onUpdate={setCustomItems}
      />

      {/* Frameworks */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">
          Diagnostic Frameworks
        </h2>
        {frameworks.length === 0 ? (
          <p className="mt-2 text-sm text-[#94A3B8]">No frameworks linked.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {frameworks.map((fw) => (
              <li key={fw.id} className="text-sm text-[#475569]">{fw.name}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Invites (owner only) */}
      {isOwner && (
        <InvitesSection tenantId={id!} invites={invites} onUpdate={setInvites} />
      )}

      {/* Members */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">Members</h2>
        <ul className="mt-2 space-y-2">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between text-sm">
              <span className="text-[#0F172A]">{m.name || m.email}</span>
              <span className="text-[#94A3B8]">{m.role.toLowerCase().replace("_", " ")}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-[#E2F0ED] space-y-3">
        {defaultTenantId !== id && userId && (
          <button
            onClick={async () => {
              await setDefaultTenant(userId, id!);
              setDefaultTenantIdState(id!);
            }}
            className="text-sm text-[#0D9488] hover:underline"
          >
            Set as default project
          </button>
        )}
        {isOwner && (
          <button
            onClick={async () => {
              if (!confirm("Delete this project and all its data? This cannot be undone.")) return;
              await deleteTenant(id!);
              navigate("/projects");
            }}
            className="block text-sm text-[#DC2626] hover:underline"
          >
            Delete project
          </button>
        )}
      </div>
    </div>
  );
}

// ── Profile Form ──

function ProfileForm({
  tenant,
  tenantId,
  onSaved,
}: {
  tenant: TenantDetail;
  tenantId: string;
  onSaved: (t: TenantDetail) => void;
}) {
  const [form, setForm] = useState({ ...tenant });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function update(field: string, value: string | boolean | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await updateTenantProfile(tenantId, {
        name: form.name,
        description: form.description,
        purpose: form.purpose,
        teenFullName: form.teenFullName,
        teenNickname: form.teenNickname,
        teenBirthday: form.teenBirthday,
        teenFavoriteColor: form.teenFavoriteColor,
        teenInterests: form.teenInterests,
        teenSchool: form.teenSchool,
        teenFavoriteSubject: form.teenFavoriteSubject,
        teenHasIep: form.teenHasIep,
        teenDiagnosis: form.teenDiagnosis,
        teenOtherHealth: form.teenOtherHealth,
        onsetDate: form.onsetDate,
        familyHistory: form.familyHistory,
      });
      onSaved(form);
      setMsg("Saved");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-[#D1E8E4] px-3 py-2 text-sm bg-white focus:border-[#0D9488] focus:outline-none focus:ring-1 focus:ring-[#0D9488]";
  const labelClass = "block text-sm font-medium text-[#0F172A]";

  return (
    <form onSubmit={handleSave} className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-[#E2F0ED] space-y-4">
      <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">Project Profile</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Project name</label>
          <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Purpose</label>
          <select className={inputClass} value={form.purpose ?? "ONGOING_TRACKING"} onChange={(e) => update("purpose", e.target.value)}>
            <option value="ONGOING_TRACKING">Ongoing tracking</option>
            <option value="DIAGNOSTIC_COLLECTION">Diagnostic collection</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea className={inputClass} rows={2} value={form.description ?? ""} onChange={(e) => update("description", e.target.value || null)} />
      </div>

      <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide pt-2">Teen Info</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full name</label>
          <input className={inputClass} value={form.teenFullName ?? ""} onChange={(e) => update("teenFullName", e.target.value || null)} />
        </div>
        <div>
          <label className={labelClass}>Nickname</label>
          <input className={inputClass} value={form.teenNickname ?? ""} onChange={(e) => update("teenNickname", e.target.value || null)} />
        </div>
        <div>
          <label className={labelClass}>Birthday</label>
          <input type="date" className={inputClass} value={form.teenBirthday?.slice(0, 10) ?? ""} onChange={(e) => update("teenBirthday", e.target.value || null)} />
        </div>
        <div>
          <label className={labelClass}>Favorite color</label>
          <input type="color" className="mt-1 h-9 w-full rounded-lg border border-[#D1E8E4] bg-white cursor-pointer" value={form.teenFavoriteColor ?? "#0D9488"} onChange={(e) => update("teenFavoriteColor", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>School</label>
          <input className={inputClass} value={form.teenSchool ?? ""} onChange={(e) => update("teenSchool", e.target.value || null)} />
        </div>
        <div>
          <label className={labelClass}>Favorite subject</label>
          <input className={inputClass} value={form.teenFavoriteSubject ?? ""} onChange={(e) => update("teenFavoriteSubject", e.target.value || null)} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Interests</label>
        <input className={inputClass} value={form.teenInterests ?? ""} onChange={(e) => update("teenInterests", e.target.value || null)} />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="iep" checked={form.teenHasIep ?? false} onChange={(e) => update("teenHasIep", e.target.checked)} className="rounded border-[#D1E8E4] text-[#0D9488] focus:ring-[#0D9488]" />
        <label htmlFor="iep" className="text-sm text-[#0F172A]">Has IEP</label>
      </div>

      <div>
        <label className={labelClass}>Diagnosis</label>
        <input className={inputClass} value={form.teenDiagnosis ?? ""} onChange={(e) => update("teenDiagnosis", e.target.value || null)} />
      </div>
      <div>
        <label className={labelClass}>Other health info</label>
        <textarea className={inputClass} rows={2} value={form.teenOtherHealth ?? ""} onChange={(e) => update("teenOtherHealth", e.target.value || null)} />
      </div>

      <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide pt-2">Background</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Onset date</label>
          <input type="date" className={inputClass} value={form.onsetDate?.slice(0, 10) ?? ""} onChange={(e) => update("onsetDate", e.target.value || null)} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Family history</label>
        <textarea className={inputClass} rows={2} value={form.familyHistory ?? ""} onChange={(e) => update("familyHistory", e.target.value || null)} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
        {msg && <span className="text-sm text-[#059669]">{msg}</span>}
      </div>
    </form>
  );
}

// ── Medications Section ──

function MedicationsSection({
  tenantId,
  medications,
  isOwner,
  onUpdate,
}: {
  tenantId: string;
  medications: FullMedicationRow[];
  isOwner: boolean;
  onUpdate: (m: FullMedicationRow[]) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [busy, setBusy] = useState(false);

  const active = medications.filter((m) => m.isActive);
  const discontinued = medications.filter((m) => !m.isActive);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const med = await createMedication({
        tenantId,
        name: name.trim(),
        dosage: dosage.trim() || null,
        frequency: frequency.trim() || null,
      });
      onUpdate([...medications, med]);
      setName("");
      setDosage("");
      setFrequency("");
      setShowAdd(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDiscontinue(id: string) {
    await updateMedication(id, { isActive: false, endDate: new Date().toISOString() });
    onUpdate(medications.map((m) => (m.id === id ? { ...m, isActive: false } : m)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this medication?")) return;
    await deleteMedication(id);
    onUpdate(medications.filter((m) => m.id !== id));
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">Medications</h2>
        {isOwner && (
          <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-[#0D9488] hover:underline">
            {showAdd ? "Cancel" : "+ Add"}
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mt-2 bg-[#F0FDFA] rounded-lg p-3 space-y-2">
          <input
            placeholder="Medication name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-lg border border-[#D1E8E4] px-3 py-1.5 text-sm bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} className="rounded-lg border border-[#D1E8E4] px-3 py-1.5 text-sm bg-white" />
            <input placeholder="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} className="rounded-lg border border-[#D1E8E4] px-3 py-1.5 text-sm bg-white" />
          </div>
          <button type="submit" disabled={busy || !name.trim()} className="rounded-lg bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0F766E] disabled:opacity-50">
            {busy ? "Adding..." : "Add medication"}
          </button>
        </form>
      )}

      {active.length === 0 && discontinued.length === 0 ? (
        <p className="mt-2 text-sm text-[#94A3B8]">No medications tracked.</p>
      ) : (
        <>
          <ul className="mt-2 space-y-2">
            {active.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-[#E2F0ED]">
                <div>
                  <span className="font-medium text-[#0F172A]">{m.name}</span>
                  {m.dosage && <span className="text-[#94A3B8] ml-2">{m.dosage}</span>}
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669]">active</span>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={() => handleDiscontinue(m.id)} className="text-xs text-[#D97706] hover:underline">Stop</button>
                    <button onClick={() => handleDelete(m.id)} className="text-xs text-[#DC2626] hover:underline">Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {discontinued.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-[#94A3B8] cursor-pointer hover:text-[#475569]">
                {discontinued.length} discontinued
              </summary>
              <ul className="mt-1 space-y-1">
                {discontinued.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-sm text-[#94A3B8] px-3 py-1">
                    <span>{m.name} {m.dosage && `(${m.dosage})`}</span>
                    {isOwner && <button onClick={() => handleDelete(m.id)} className="text-xs text-[#DC2626] hover:underline">Delete</button>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

// ── Strategies Section ──

function StrategiesSection({
  tenantId,
  strategies,
  isOwner,
  onUpdate,
}: {
  tenantId: string;
  strategies: FullStrategyRow[];
  isOwner: boolean;
  onUpdate: (s: FullStrategyRow[]) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const grouped = strategies.reduce((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, FullStrategyRow[]>);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const s = await createStrategy({
        tenantId,
        name: name.trim(),
        category: category.trim() || null,
      });
      onUpdate([...strategies, s]);
      setName("");
      setCategory("");
      setShowAdd(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this strategy?")) return;
    await deleteStrategy(id);
    onUpdate(strategies.filter((s) => s.id !== id));
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">Strategies</h2>
        {isOwner && (
          <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-[#0D9488] hover:underline">
            {showAdd ? "Cancel" : "+ Add"}
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mt-2 bg-[#F0FDFA] rounded-lg p-3 space-y-2">
          <input placeholder="Strategy name" value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-lg border border-[#D1E8E4] px-3 py-1.5 text-sm bg-white" />
          <input placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} className="block w-full rounded-lg border border-[#D1E8E4] px-3 py-1.5 text-sm bg-white" />
          <button type="submit" disabled={busy || !name.trim()} className="rounded-lg bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0F766E] disabled:opacity-50">
            {busy ? "Adding..." : "Add strategy"}
          </button>
        </form>
      )}

      {strategies.length === 0 ? (
        <p className="mt-2 text-sm text-[#94A3B8]">No strategies tracked.</p>
      ) : (
        <div className="mt-2 space-y-3">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-xs font-medium text-[#475569] mb-1">{cat}</h3>
              <ul className="space-y-1">
                {items.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-[#E2F0ED]">
                    <span className="text-[#0F172A]">{s.name}</span>
                    {isOwner && <button onClick={() => handleDelete(s.id)} className="text-xs text-[#DC2626] hover:underline">Delete</button>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Custom Items Section ──

function CustomItemsSection({
  tenantId,
  items,
  isOwner,
  onUpdate,
}: {
  tenantId: string;
  items: CustomItemRow[];
  isOwner: boolean;
  onUpdate: (i: CustomItemRow[]) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setBusy(true);
    try {
      const item = await createCustomItem({ tenantId, label: label.trim() });
      onUpdate([...items, item]);
      setLabel("");
      setShowAdd(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteCustomItem(id);
    onUpdate(items.filter((i) => i.id !== id));
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">Custom Behavior Items</h2>
        {isOwner && (
          <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-[#0D9488] hover:underline">
            {showAdd ? "Cancel" : "+ Add"}
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mt-2 bg-[#F0FDFA] rounded-lg p-3 flex gap-2">
          <input placeholder="Custom item label" value={label} onChange={(e) => setLabel(e.target.value)} className="flex-1 rounded-lg border border-[#D1E8E4] px-3 py-1.5 text-sm bg-white" />
          <button type="submit" disabled={busy || !label.trim()} className="rounded-lg bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0F766E] disabled:opacity-50">
            Add
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[#94A3B8]">No custom items.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-[#E2F0ED]">
              <span className="text-[#0F172A]">{item.label}</span>
              {isOwner && <button onClick={() => handleDelete(item.id)} className="text-xs text-[#DC2626] hover:underline">Delete</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Invites Section ──

function InvitesSection({
  tenantId,
  invites,
  onUpdate,
}: {
  tenantId: string;
  invites: InviteRow[];
  onUpdate: (i: InviteRow[]) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [role, setRole] = useState("CAREGIVER");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const pending = invites.filter((i) => i.status === "PENDING" && new Date(i.expiresAt) > new Date());

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const inv = await createInvite({ tenantId, role });
      onUpdate([inv, ...invites]);
      setShowAdd(false);
      const link = `${window.location.origin}/invite/${inv.token}`;
      await navigator.clipboard.writeText(link);
      setCopied(inv.id);
      setTimeout(() => setCopied(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    await deleteInvite(id);
    onUpdate(invites.filter((i) => i.id !== id));
  }

  async function copyLink(inv: InviteRow) {
    const link = `${window.location.origin}/invite/${inv.token}`;
    await navigator.clipboard.writeText(link);
    setCopied(inv.id);
    setTimeout(() => setCopied(null), 3000);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">Invites</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-[#0D9488] hover:underline">
          {showAdd ? "Cancel" : "+ Create invite"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="mt-2 bg-[#F0FDFA] rounded-lg p-3 flex items-center gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-[#D1E8E4] px-3 py-1.5 text-sm bg-white">
            <option value="CAREGIVER">Caregiver</option>
            <option value="TEEN_SELF">Teen (self-observation)</option>
          </select>
          <button type="submit" disabled={busy} className="rounded-lg bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0F766E] disabled:opacity-50">
            {busy ? "Creating..." : "Create & copy link"}
          </button>
        </form>
      )}

      {pending.length === 0 ? (
        <p className="mt-2 text-sm text-[#94A3B8]">No pending invites.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {pending.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-[#E2F0ED]">
              <div>
                <span className="text-[#0F172A]">{inv.role.toLowerCase().replace("_", " ")}</span>
                <span className="text-[#94A3B8] ml-2 text-xs">
                  expires {new Date(inv.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyLink(inv)} className="text-xs text-[#0D9488] hover:underline">
                  {copied === inv.id ? "Copied!" : "Copy link"}
                </button>
                <button onClick={() => handleRevoke(inv.id)} className="text-xs text-[#DC2626] hover:underline">
                  Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
