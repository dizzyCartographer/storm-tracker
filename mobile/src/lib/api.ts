import { authClient, getJwt, signOut } from "./auth";
import { API_BASE_URL, NEON_DATA_API_URL } from "./config";

// ── Authenticated fetch for custom API endpoints ──

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookies = await authClient.getCookie();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (cookies) {
    headers["Cookie"] = cookies;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "omit",
  });

  if (res.status === 401) {
    await signOut();
  }

  return res;
}

// ── Authenticated fetch for Neon Data API (JWT + RLS) ──

export async function neonFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const jwt = await getJwt();

  if (!jwt) {
    await signOut();
    throw new Error("No JWT available");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
    ...(options.headers as Record<string, string>),
  };

  const url = `${NEON_DATA_API_URL}${path}`;

  // Neon Data API intermittently returns "jwk not found" (400) due to
  // JWKS cache misses across their infrastructure. Retry up to 2 times.
  let res: Response = null!;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, { ...options, headers });
    if (res.status !== 400) break;
    const body = await res.clone().text();
    if (!body.includes("jwk not found")) break;
  }

  if (res.status === 401) {
    await signOut();
  }

  return res;
}

// ── Custom endpoint helpers (write-time computation) ──

export async function saveEntry(data: {
  tenantId: string;
  mood: string;
  dayQuality: string;
  behaviorKeys?: string[];
  customItemIds?: string[];
  strategyIds?: string[];
  missedMedIds?: string[];
  impairments?: Record<string, string>;
  notes?: string;
  menstrualSeverity?: string | null;
  date?: string;
}) {
  const res = await apiFetch("/api/mobile/entries", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Neon Data API read helpers ──

/** Get tenants the current user belongs to (via tenant_members join). */
export async function getTenants(): Promise<TenantSummary[]> {
  // Get memberships first, then fetch tenant details
  const membersRes = await neonFetch(
    `/tenant_members?select="tenantId",role`
  );
  if (!membersRes.ok) throw new Error("Failed to fetch memberships");
  const members: { tenantId: string; role: string }[] =
    await membersRes.json();

  if (members.length === 0) return [];

  const tenantIds = members.map((m) => m.tenantId);
  const inClause = tenantIds.map((id) => `"${id}"`).join(",");

  const tenantsRes = await neonFetch(
    `/tenants?id=in.(${inClause})&select=id,name,"teenFavoriteColor","teenPhotoUrl","teenNickname"`
  );
  if (!tenantsRes.ok) throw new Error("Failed to fetch tenants");
  const tenants: Array<{
    id: string;
    name: string;
    teenFavoriteColor: string | null;
    teenPhotoUrl: string | null;
    teenNickname: string | null;
  }> = await tenantsRes.json();

  // Merge role onto tenant
  const roleMap = new Map(members.map((m) => [m.tenantId, m.role]));
  return tenants.map((t) => ({
    ...t,
    role: roleMap.get(t.id) ?? "CAREGIVER",
  }));
}

/** Get recent entries for a tenant, newest first. */
export async function getRecentEntries(
  tenantId: string,
  limit = 14
): Promise<EntryRow[]> {
  const res = await neonFetch(
    `/entries?` +
      `"tenantId"=eq.${tenantId}` +
      `&order=date.desc` +
      `&limit=${limit}` +
      `&select=id,date,mood,"dayQuality",notes,"behaviorKeys","missedMedIds",impairments,"computedMood","computedScore","userId"`
  );
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}

/** Get episodes for a tenant. */
export async function getEpisodes(tenantId: string): Promise<EpisodeRow[]> {
  const res = await neonFetch(
    `/episodes?"tenantId"=eq.${tenantId}&order="startDate".desc&limit=10`
  );
  if (!res.ok) throw new Error("Failed to fetch episodes");
  return res.json();
}

/** Get active prodrome signals for a tenant. */
export async function getSignals(tenantId: string): Promise<SignalRow[]> {
  const res = await neonFetch(
    `/prodrome_signals?"tenantId"=eq.${tenantId}&order="createdAt".desc&limit=20`
  );
  if (!res.ok) throw new Error("Failed to fetch signals");
  return res.json();
}

/** Get predictions for a tenant. */
export async function getPredictions(
  tenantId: string
): Promise<PredictionRow[]> {
  const res = await neonFetch(
    `/predictions?"tenantId"=eq.${tenantId}&order="createdAt".desc&limit=10`
  );
  if (!res.ok) throw new Error("Failed to fetch predictions");
  return res.json();
}

/** Get suggestions for a tenant. */
export async function getSuggestions(
  tenantId: string
): Promise<SuggestionRow[]> {
  const res = await neonFetch(
    `/suggestions?"tenantId"=eq.${tenantId}&order=priority.asc&limit=20`
  );
  if (!res.ok) throw new Error("Failed to fetch suggestions");
  return res.json();
}

// ── Neon Data API read helpers: Log form data ──

/** Get the active framework ID for a tenant. */
export async function getFrameworkId(tenantId: string): Promise<string | null> {
  const res = await neonFetch(
    `/tenant_frameworks?"tenantId"=eq.${tenantId}&select="frameworkId"&limit=1`
  );
  if (!res.ok) throw new Error("Failed to fetch tenant framework");
  const rows: { frameworkId: string }[] = await res.json();
  return rows.length > 0 ? rows[0].frameworkId : null;
}

/** Get behavior categories for a framework, sorted. */
export async function getBehaviorCategories(
  frameworkId: string
): Promise<BehaviorCategoryRow[]> {
  const res = await neonFetch(
    `/framework_behavior_categories?"frameworkId"=eq.${frameworkId}&select=id,slug,name,"sortOrder"&order="sortOrder"`
  );
  if (!res.ok) throw new Error("Failed to fetch behavior categories");
  return res.json();
}

/** Get behavior definitions for given category IDs, sorted. */
export async function getBehaviorDefinitions(
  categoryIds: string[]
): Promise<BehaviorDefinitionRow[]> {
  const inClause = categoryIds.map((id) => `"${id}"`).join(",");
  const res = await neonFetch(
    `/behavior_definitions?"categoryId"=in.(${inClause})&select=id,"itemKey",label,description,"recognitionExamples","isSafetyConcern","sortOrder","categoryId"&order="sortOrder"`
  );
  if (!res.ok) throw new Error("Failed to fetch behavior definitions");
  return res.json();
}

/** Get custom checklist items for a tenant. */
export async function getCustomItems(
  tenantId: string
): Promise<CustomItemRow[]> {
  const res = await neonFetch(
    `/custom_checklist_items?"tenantId"=eq.${tenantId}&select=id,label`
  );
  if (!res.ok) throw new Error("Failed to fetch custom items");
  return res.json();
}

/** Get active medications for a tenant. */
export async function getActiveMedications(
  tenantId: string
): Promise<MedicationRow[]> {
  const res = await neonFetch(
    `/medications?"tenantId"=eq.${tenantId}&"isActive"=eq.true&select=id,name,dosage`
  );
  if (!res.ok) throw new Error("Failed to fetch medications");
  return res.json();
}

/** Get strategies for a tenant. */
export async function getStrategies(
  tenantId: string
): Promise<StrategyRow[]> {
  const res = await neonFetch(
    `/strategies?"tenantId"=eq.${tenantId}&select=id,name,category`
  );
  if (!res.ok) throw new Error("Failed to fetch strategies");
  return res.json();
}

/** Get an existing entry for a tenant on a specific date. */
export async function getEntryByDate(
  tenantId: string,
  date: string
): Promise<EntryRow | null> {
  const res = await neonFetch(
    `/entries?"tenantId"=eq.${tenantId}&date=eq.${date}&select=id,date,mood,"dayQuality",notes,"behaviorKeys","customItemIds","strategyIds","missedMedIds",impairments,"menstrualSeverity","computedMood","computedScore","userId"&limit=1`
  );
  if (!res.ok) throw new Error("Failed to fetch entry");
  const rows: EntryRow[] = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

// ── Types ──

export interface TenantSummary {
  id: string;
  name: string;
  teenFavoriteColor: string | null;
  teenPhotoUrl: string | null;
  teenNickname: string | null;
  role: string;
}

export interface EntryRow {
  id: string;
  date: string;
  mood: string;
  dayQuality: string;
  notes: string | null;
  behaviorKeys: string[];
  customItemIds?: string[];
  strategyIds?: string[];
  missedMedIds: string[];
  impairments: Record<string, string>;
  menstrualSeverity?: string | null;
  computedMood: string | null;
  computedScore: number | null;
  userId: string;
}

export interface BehaviorCategoryRow {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface BehaviorDefinitionRow {
  id: string;
  itemKey: string;
  label: string;
  description: string;
  recognitionExamples: string | null;
  isSafetyConcern: boolean;
  sortOrder: number;
  categoryId: string;
}

export interface CustomItemRow {
  id: string;
  label: string;
}

export interface MedicationRow {
  id: string;
  name: string;
  dosage: string | null;
}

export interface StrategyRow {
  id: string;
  name: string;
  category: string | null;
}

export interface EpisodeRow {
  id: string;
  tenantId: string;
  type: string;
  confidence: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  peakSeverity: string;
  hasSafetyConcern: boolean;
  criteriaNote: string | null;
}

export interface SignalRow {
  id: string;
  signalId: string;
  level: string;
  title: string;
  description: string;
  relatedDates: string[];
}

export interface PredictionRow {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: string;
}

export interface SuggestionRow {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
}
