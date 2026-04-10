# Integration Config

All external services, credentials, and configuration needed for development and testing. **Never commit actual secrets** — this document lists what's needed and where to find values, not the values themselves.

---

## Environment Variables

All documented in `.env.example`. Copy to `.env` for local development.

| Variable | Purpose | Where to get it |
|----------|---------|-----------------|
| `STRM_TRKR_DATABASE_URL` | Neon pooled connection string (runtime) | Neon Console → Connection Details → Pooled |
| `STRM_TRKR_DATABASE_URL_UNPOOLED` | Neon direct connection string (migrations) | Neon Console → Connection Details → Direct |
| `STRM_TRKR_BETTER_AUTH_SECRET` | Better Auth session signing secret | Generate random string |
| `STRM_TRKR_BETTER_AUTH_URL` | Stable production URL | `https://storm-tracker-murex.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Vercel Dashboard → Storage → Blob |
| `ANTHROPIC_API_KEY` | Anthropic API key for journal parsing | Anthropic Console |

### Vercel Environment Scoping

| Variable | Production | Preview (staging) | Development |
|----------|-----------|-------------------|-------------|
| `STRM_TRKR_DATABASE_URL` | main branch pooled | staging branch pooled | main branch pooled (local .env) |
| `STRM_TRKR_DATABASE_URL_UNPOOLED` | main branch direct | staging branch direct | main branch direct (local .env) |
| `STRM_TRKR_BETTER_AUTH_URL` | `https://storm-tracker-murex.vercel.app` | _(omitted — falls back to VERCEL_URL)_ | _(omitted — defaults to localhost)_ |
| `BLOB_READ_WRITE_TOKEN` | Set | Set | Set in .env |
| `ANTHROPIC_API_KEY` | Set | Set | Set in .env |

**Legacy Neon integration vars** (`STRM_TRKR_NEON_PROJECT_ID`, `STRM_TRKR_PGUSER`, etc.) exist in Vercel but are NOT used by app code. Managed by the Neon Vercel integration — do not remove.

---

## Neon Postgres

| Item | Value |
|------|-------|
| Neon Project | `green-silence-82079891` |
| Project Name | `storm-tracker-db` |
| Region | `us-east-1` (AWS) |
| Production branch | `main` |
| Production endpoint | `ep-shy-breeze-ami5dzoi` |
| Staging branch | `staging` |
| Staging endpoint | `ep-round-shape-amx2h82v` |

### Neon Data API

| Item | Value |
|------|-------|
| REST endpoint | `https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1` |
| Auth type | JWT Bearer token |
| JWKS URL | `https://storm-tracker-murex.vercel.app/api/auth/jwks` |
| JWKS provider type | "Other" (configured in Neon Console → Data API → Settings) |
| Exposed schemas | `public` |
| Required DB grants | `authenticated`, `neon_auth`, `anonymous`, `authenticator` roles |

**Known issue:** Intermittent JWKS cache misses cause "jwk not found" 400 errors. Mobile client retries up to 2 times (see `mobile/src/lib/api.ts`).

---

## Better Auth

| Item | Value |
|------|-------|
| Config file | `src/lib/auth.ts` |
| Plugins | `expo()`, `jwt({ jwks: { keyPairConfig: { alg: "RS256" } } })`, `nextCookies()` |
| Plugin order | **nextCookies() must be last** |
| JWKS endpoint | `/api/auth/jwks` (auto-served by Better Auth) |
| JWKS table | `jwks` (stores RS256 key pairs) |
| Auth routes | `/api/auth/[...all]` (catch-all) |
| Trusted origins | Production URL, `stormtracker://`, localhost, Vercel preview URLs (dynamic) |

### Mobile Auth Client

| Item | Value |
|------|-------|
| Config file | `mobile/src/lib/auth.ts` |
| Library | `@better-auth/expo` |
| Plugin | `expoClient({ scheme: "stormtracker", storage: SecureStore })` |
| Base URL | `https://storm-tracker-murex.vercel.app` |
| Session storage | `expo-secure-store` (encrypted on-device) |
| JWT access | `authClient.token()` for Neon Data API requests |

### Test Account

| Item | Value |
|------|-------|
| Email | `claude@stormtracker.dev` |
| Password | `TestPass123!` |
| Purpose | Automated API testing, development |

---

## Apple Developer

| Item | Value |
|------|-------|
| Apple ID | maria.yarley@gmail.com |
| Team ID | RC99K6SXQX |
| Program | Apple Developer Program ($99/year) |

### App Store Connect

| App | Bundle ID | ASC App ID | Name |
|-----|-----------|------------|------|
| Production | `com.stormtracker.app` | `6761905904` | StormTrackRx |
| Staging | `com.stormtracker.dev` | `6761926912` | StormTrackRx Dev |

### EAS Build

| Item | Value |
|------|-------|
| Config file | `mobile/eas.json` |
| Plan | Free tier (15 iOS builds/month, lower-priority queue) |
| Starter plan | $19/month for priority queue |
| Best queue times | Late evening, overnight, weekends (US time) |

---

## Vercel

| Item | Value |
|------|-------|
| Project | storm-tracker |
| Framework | Next.js |
| Production URL | `storm-tracker-murex.vercel.app` |
| Git integration | Connected to GitHub repo |
| Blob storage | Enabled (for file attachments) |

---

## Anthropic API

| Item | Value |
|------|-------|
| SDK | Vercel AI SDK (`ai` package) + `@ai-sdk/anthropic` |
| Function | `generateObject` with Zod schema |
| Used for | Journal import — parsing freeform text into structured entries |
| Endpoint | `POST /api/parse-journal` (server-side, needs API key) |

---

## Mobile Hardcoded URLs

In `mobile/src/lib/config.ts`:

```typescript
API_BASE_URL = "https://storm-tracker-murex.vercel.app"
NEON_DATA_API_URL = "https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1"
```

Both point to production. Mobile app always uses the production backend regardless of build profile.
