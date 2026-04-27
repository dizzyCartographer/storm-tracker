---
id: ST-077
title: ProjectProvider silent failure leaves dashboard, history, log, entry detail empty until app restart
type: bug
status: open
urgency: high
phase: A
components:
  - mobile
  - auth
  - dashboard
  - history
  - log
source: testing-feedback-2026-04-27
created: 2026-04-27
related: ST-064, ST-065
---

# ST-077: ProjectProvider silent failure strands every dependent screen

## Symptom

After signing into the mobile app:

- Dashboard shows **"No projects yet."**
- History shows no entries.
- Log screen has no project to write to.
- Entry detail can't load.
- The **Projects tab does load all expected projects** correctly.

There is no error message anywhere. Pull-to-refresh on the dashboard does not recover. The only way to unstick the app is **sign out + sign back in**, or **force-quit and relaunch** — and even that only recovers if the race lands the other way the second time.

## Root cause

`mobile/src/lib/project-context.tsx` is the single point of failure for every screen that reads `useProject()` (Dashboard, History, Log, Entry detail). It runs **one** fetch, **once**, on mount:

```ts
useEffect(() => { load() }, []);

async function load() {
  try {
    setLoading(true);
    const [t, user] = await Promise.all([getTenants(), getCurrentUserInfo()]);
    setTenants(t);
    // ...
  } catch (e) {
    console.error("Failed to load projects:", e);
  } finally {
    setLoading(false);
  }
}
```

If `getJwt()` ([mobile/src/lib/auth.ts:95](mobile/src/lib/auth.ts:95)) hasn't yet resolved when this effect fires (cookie not hydrated from SecureStore, `/api/auth/token` round-trip not yet complete), `neonFetch` throws. The catch block `console.error`s and leaves `tenants = []`, `selectedTenant = null`, `loading = false`. Every dependent screen then renders its empty state.

`(tabs)/projects.tsx` does its **own** identical fetch on tab mount ([projects.tsx:40](mobile/src/app/(tabs)/projects.tsx:40)). By the time the user navigates there, auth is warm and the fetch succeeds — which is why projects appear there but nowhere else. The two fetches return different data only because they fire at different times.

## Why it isn't already covered

- **[ST-064](docs/issues/ST-064-fix-premature-no-data-messages.md)** is a UX-polish ticket about not showing "no data" before fetch completes. It assumes the fetch eventually succeeds and ST-043 caching will help. It does not cover the case where the initial fetch fails silently and never retries.
- **[ST-065](docs/issues/ST-065-behavior-checklist-not-displaying.md)** has the same root pattern (JWKS cold-cache → silent swallow → user sees empty content) but is scoped to the log screen's framework fetch. Its fix was a retry banner local to that screen. ProjectProvider is one level higher in the tree and affects four screens.

This is the same family of bug as ST-065, but on a higher-impact code path. Worth its own ticket.

## Fix shape

Two pieces, both small:

1. **Wait for auth before the first fetch.** `AuthProvider` should expose a `ready` flag (true after `authClient.getSession()` resolves and the cookie is available). `ProjectProvider`'s effect runs `load()` only when `ready === true`.

2. **Retry the load on failure with user-visible recovery.** Track an `error` state. On error, show a small banner on the dashboard (and any other screen that needs a project context) with a Retry button — same pattern ST-065 used for the framework fetch. Optionally: auto-retry once with a short backoff before surfacing the banner, since most JWKS misses resolve on the second try.

`neonFetch` already has retry logic for `400 "jwk not found"` responses, but it doesn't cover the case where `getJwt()` returns null because the token endpoint round-trip hasn't completed. That gap is what ST-077 needs to close.

## Acceptance criteria

- Cold-launch the app on a stable network: dashboard renders entries on first paint, no "No projects yet" flash, no need to sign out / restart.
- Cold-launch on a flaky network where the first auth/token request fails: user sees a Retry banner on the dashboard, not a permanently empty state.
- Tapping Retry recovers the project context in place — no app restart required.
- Same recovery applies to History, Log, and Entry detail screens (whatever pattern is chosen, it lives in the shared context, not duplicated per screen).

## Out of scope

- Offline mode and read cache (covered by [ST-043](docs/issues/ST-043-offline-mode-with-read-cache.md)) — orthogonal; helps mask cold-start failures but doesn't fix this race.
- Better Auth token round-trip latency itself.
- The polish work in ST-064 — different scope, leave that ticket as-is.

## Discovery

Found 2026-04-27 during ST-071 staging verification. User reported "the mobile app cannot see any projects… none of the same data that i see on web staging" while testing the staging branch deploy. Diagnosis traced to ProjectProvider after confirming Projects tab fetched fine while Dashboard didn't. Cross-origin cleanup (Apr 16) is unrelated — mobile dev still hits production, race has always been there.
