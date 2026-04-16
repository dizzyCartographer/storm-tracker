import { authClient, getJwt, signOut } from "./auth";
import { API_BASE_URL, NEON_DATA_API_URL } from "./config";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

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

// ── Entry write via Neon Data API (triggers handle scoring + analysis) ──

export async function saveEntry(data: {
  tenantId: string;
  userId: string;
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
  id?: string;
}) {
  const now = new Date().toISOString();
  const entry: Record<string, unknown> = {
    id: data.id || generateUUID(),
    date: data.date || new Date().toISOString().split("T")[0],
    mood: data.mood,
    dayQuality: data.dayQuality,
    behaviorKeys: data.behaviorKeys ?? [],
    customItemIds: data.customItemIds ?? [],
    strategyIds: data.strategyIds ?? [],
    missedMedIds: data.missedMedIds ?? [],
    impairments: data.impairments ?? {},
    notes: data.notes ?? null,
    menstrualSeverity: data.menstrualSeverity ?? null,
    userId: data.userId,
    tenantId: data.tenantId,
    createdAt: now,
    updatedAt: now,
  };

  const res = await neonFetch("/entries?on_conflict=userId,tenantId,date", {
    method: "POST",
    headers: {
      Prefer: "return=representation, resolution=merge-duplicates",
    },
    body: JSON.stringify(entry),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Save failed: ${res.status}`);
  }

  const rows = await res.json();
  return rows[0];
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

/** Get entries for a tenant within a date range. */
export async function getEntriesByRange(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<EntryRow[]> {
  const res = await neonFetch(
    `/entries?"tenantId"=eq.${tenantId}` +
      `&date=gte.${startDate}&date=lte.${endDate}` +
      `&order=date.desc` +
      `&select=id,date,mood,"dayQuality",notes,"behaviorKeys","customItemIds","strategyIds","missedMedIds",impairments,"menstrualSeverity","computedMood","computedScore","userId"`
  );
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}

/** Get a single entry by ID. */
export async function getEntryById(id: string): Promise<EntryRow | null> {
  const res = await neonFetch(
    `/entries?id=eq.${id}&select=id,date,mood,"dayQuality",notes,"behaviorKeys","customItemIds","strategyIds","missedMedIds",impairments,"menstrualSeverity","computedMood","computedScore","userId","tenantId"&limit=1`
  );
  if (!res.ok) throw new Error("Failed to fetch entry");
  const rows: (EntryRow & { tenantId?: string })[] = await res.json();
  return rows.length > 0 ? rows[0] : null;
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

// ── Neon Data API read helpers: Project detail ──

/** Get full details for a single tenant. */
export async function getTenantById(
  tenantId: string
): Promise<TenantDetail | null> {
  const res = await neonFetch(
    `/tenants?id=eq.${tenantId}` +
      `&select=id,name,description,purpose,"teenFullName","teenNickname","teenBirthday","teenFavoriteColor","teenInterests","teenSchool","teenFavoriteSubject","teenHasIep","teenDiagnosis","teenOtherHealth","teenPhotoUrl","onsetDate","familyHistory"` +
      `&limit=1`
  );
  if (!res.ok) throw new Error("Failed to fetch tenant");
  const rows: TenantDetail[] = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

/** Get all members of a tenant. */
export async function getTenantMembers(
  tenantId: string
): Promise<MemberRow[]> {
  const res = await neonFetch(
    `/tenant_members?"tenantId"=eq.${tenantId}&select=id,"userId",role,"joinedAt"`
  );
  if (!res.ok) throw new Error("Failed to fetch members");
  return res.json();
}

/** Get user display info for a list of user IDs. */
export async function getUsersByIds(ids: string[]): Promise<UserInfoRow[]> {
  if (ids.length === 0) return [];
  const inClause = ids.map((id) => `"${id}"`).join(",");
  const res = await neonFetch(
    `/users?id=in.(${inClause})&select=id,name,email`
  );
  if (!res.ok) return []; // RLS may restrict reading other users — degrade gracefully
  return res.json();
}

/** Get diagnostic frameworks linked to a tenant. */
export async function getTenantFrameworkDetails(
  tenantId: string
): Promise<FrameworkSummary[]> {
  const res = await neonFetch(
    `/tenant_frameworks?"tenantId"=eq.${tenantId}&select="frameworkId"`
  );
  if (!res.ok) throw new Error("Failed to fetch tenant frameworks");
  const rows: { frameworkId: string }[] = await res.json();
  if (rows.length === 0) return [];

  const inClause = rows.map((r) => `"${r.frameworkId}"`).join(",");
  const fwRes = await neonFetch(
    `/diagnostic_frameworks?id=in.(${inClause})&select=id,name,slug`
  );
  if (!fwRes.ok) throw new Error("Failed to fetch frameworks");
  return fwRes.json();
}

/** Get active medications with full details (dosage, frequency, instructions). */
export async function getFullMedications(
  tenantId: string
): Promise<FullMedicationRow[]> {
  const res = await neonFetch(
    `/medications?"tenantId"=eq.${tenantId}&"isActive"=eq.true` +
      `&select=id,name,dosage,frequency,instructions,"startDate","isActive"` +
      `&order="createdAt".asc`
  );
  if (!res.ok) throw new Error("Failed to fetch medications");
  return res.json();
}

/** Get strategies with description and category. */
export async function getFullStrategies(
  tenantId: string
): Promise<FullStrategyRow[]> {
  const res = await neonFetch(
    `/strategies?"tenantId"=eq.${tenantId}&select=id,name,description,category&order="createdAt".asc`
  );
  if (!res.ok) throw new Error("Failed to fetch strategies");
  return res.json();
}

/** Get current user info including defaultTenantId from the database. */
export async function getCurrentUserInfo(): Promise<CurrentUser | null> {
  // Get session for base user info
  const session = await authClient.getSession();
  if (!session.data?.user) return null;
  const userId = session.data.user.id;

  // Fetch defaultTenantId from Neon Data API (custom field not always in session)
  const res = await neonFetch(
    `/users?id=eq.${userId}&select=id,name,email,"defaultTenantId"&limit=1`
  );
  if (!res.ok) {
    return {
      id: userId,
      name: session.data.user.name ?? null,
      email: session.data.user.email,
      defaultTenantId: null,
    };
  }
  const rows: CurrentUser[] = await res.json();
  if (rows.length === 0) {
    return {
      id: userId,
      name: session.data.user.name ?? null,
      email: session.data.user.email,
      defaultTenantId: null,
    };
  }
  return rows[0];
}

/** Set the default tenant for the current user. */
export async function setDefaultTenant(
  userId: string,
  tenantId: string
): Promise<void> {
  const res = await neonFetch(`/users?id=eq.${userId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ defaultTenantId: tenantId }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to set default tenant: ${res.status} ${body}`);
  }
}

/** Update a tenant's profile fields via Neon Data API. */
export async function updateTenantProfile(
  tenantId: string,
  data: Partial<Omit<TenantDetail, "id">>
): Promise<void> {
  const res = await neonFetch(`/tenants?id=eq.${tenantId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to update project: ${res.status} ${body}`);
  }
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

export interface TenantDetail {
  id: string;
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
}

export interface MemberRow {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
}

export interface UserInfoRow {
  id: string;
  name: string | null;
  email: string;
}

export interface FrameworkSummary {
  id: string;
  name: string;
  slug: string;
}

export interface FullMedicationRow {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  startDate: string | null;
  isActive: boolean;
}

export interface FullStrategyRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string;
  defaultTenantId: string | null;
}
