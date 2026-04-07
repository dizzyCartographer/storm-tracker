import { authClient, getJwt, signOut } from "./auth";

export const API_BASE_URL = "https://storm-tracker-murex.vercel.app";

/**
 * Authenticated fetch for custom API endpoints.
 * Uses Better Auth session cookies (managed by expoClient).
 */
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

/**
 * Authenticated fetch for Neon Data API.
 * Uses JWT Bearer token (issued by Better Auth JWT plugin).
 */
export async function neonFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const jwt = await getJwt();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    await signOut();
  }

  return res;
}

// ── Custom endpoint helpers ──

/**
 * Save a daily log entry (with server-side scoring).
 */
export async function saveEntry(data: {
  tenantId: string;
  mood: string;
  dayQuality: string;
  behaviorKeys?: string[];
  customItemIds?: string[];
  strategyIds?: string[];
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

/**
 * Get analysis dashboard data for a tenant.
 */
export async function getAnalysis(tenantId: string, days = 30) {
  const res = await apiFetch(
    `/api/mobile/analysis/${tenantId}?days=${days}`
  );
  return res.json();
}

/**
 * Get diagnostic framework data for a tenant.
 */
export async function getFrameworks(tenantId: string) {
  const res = await apiFetch(`/api/mobile/frameworks/${tenantId}`);
  return res.json();
}
