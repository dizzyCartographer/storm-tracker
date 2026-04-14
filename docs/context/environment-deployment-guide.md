# Environment & Deployment Guide

---

## Three Environments

| Environment | Git Branch | Neon DB Branch | Neon Endpoint | URL |
|-------------|-----------|----------------|---------------|-----|
| Production | `main` | `main` | `ep-shy-breeze-ami5dzoi` | `storm-tracker-murex.vercel.app` |
| Staging | `staging` | `staging` | `ep-round-shape-amx2h82v` | Auto-generated Vercel preview URL |
| Local | any | `main` (via .env) | same as prod | `localhost:3000` (web), `localhost:8081` (Expo) |

**Mobile app always points to production backend.** Staging preview URLs change every deployment and can't be hardcoded in the mobile config.

---

## Deployment Workflow

### Staging-First Rule

All changes go to `staging` first. Never push directly to `main`.

```
1. Develop on staging branch (or feature branch → staging)
2. Claude tests locally (simulator, web dev server)
3. Push to staging → Vercel preview deployment
4. Claude tests on live staging preview
5. User tests on live staging preview
6. User approves → merge staging → main
7. Production deployment happens automatically
```

**Exception:** Doc-only changes can go to both staging and main immediately without the full review cycle.

### Git Branching

- `main` — production. All work lands here eventually.
- `staging` — preview/testing. All changes go here first.
- `feat/<name>` — use only when work spans multiple sessions or needs review before merging to staging.
- No long-lived branches. Merge or delete within the session.

### Vercel Deployments

- Push to `main` → production deployment at `storm-tracker-murex.vercel.app`
- Push to `staging` → preview deployment at auto-generated URL
- Push to any other branch → preview deployment (uses staging env vars)

---

## Local Development

### Web App

```bash
cd /Users/mariayarley/Documents/GitHub/storm-tracker
npm run dev
# → http://localhost:3000
```

### Mobile App (Expo)

```bash
cd mobile
npx expo start
# → Press i for iOS simulator
# → Expo dev server on port 8081
```

### Local Xcode Builds (TestFlight)

```bash
cd mobile

# Generate native iOS project
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo prebuild --platform ios --clean

# Install CocoaPods dependencies
cd ios
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install
cd ..

# Open in Xcode
xed ios/StormTrackRx.xcworkspace

# In Xcode: Product → Archive → Distribute → App Store Connect (TestFlight)
# Automatic signing with team RC99K6SXQX
```

**Note:** The `LANG`/`LC_ALL` env vars fix a UTF-8 encoding error in CocoaPods. The `ios/` directory is gitignored (Expo generates it fresh via prebuild).

### EAS Cloud Builds (alternative)

```bash
cd mobile

# Staging build + auto-submit to TestFlight
eas build --platform ios --profile staging --auto-submit

# Production build
eas build --platform ios --profile production --auto-submit
```

**Free tier:** 15 iOS builds/month, lower-priority queue (1+ hour during US business hours). Late evening/overnight/weekends are faster.

---

## Database Management

### Prisma Migrations

```bash
# Create a new migration
npx prisma migrate dev --name descriptive_name

# Apply migrations to production (via Vercel deployment)
# Migrations run automatically on deploy

# Generate Prisma client after schema changes
npx prisma generate
```

### Neon Branches

Production and staging use separate Neon database branches. The staging branch was created from main and has its own endpoint.

**Important:** Database GRANT permissions for Neon Data API roles (`authenticated`, `neon_auth`, `anonymous`, `authenticator`) were applied manually to production but are NOT in a migration (ST-004). New branches/environments need these grants applied manually.

### Seed Scripts

```bash
# Seed diagnostic frameworks
npx tsx scripts/seed-frameworks.ts

# Migrate old behavior checklist to criterion-level
npx tsx scripts/migrate-checklist-to-criteria.ts
```

---

## Apple Developer

| Item | Value |
|------|-------|
| Apple ID | maria.yarley@gmail.com |
| Team ID | RC99K6SXQX |
| Production bundle | `com.stormtracker.app` |
| Staging bundle | `com.stormtracker.dev` |
| Production ASC App ID | `6761905904` |
| Staging ASC App ID | `6761926912` |
| App name (App Store) | StormTrackRx |
| Staging app name | StormTrackRx Dev |

---

## Neon Data API Configuration

Three things must be configured in Neon Console for the Data API to work:

1. **Data API → Settings → Authentication:** Add JWKS provider URL (`https://storm-tracker-murex.vercel.app/api/auth/jwks`, type "Other")
2. **Data API → Settings → Exposed schemas:** Must include `public`
3. **Database:** GRANT permissions to `authenticated`, `neon_auth`, `anonymous`, `authenticator` roles

The `auth.user_id()` function (from `pg_session_jwt` extension) extracts the `sub` claim from the JWT for RLS policy evaluation.

**Known issue:** Intermittent "jwk not found" errors (~30% of requests). Workaround: retry logic in mobile `neonFetch()` — up to 2 retries. 100% success rate with retries.

---

## Troubleshooting

### Pod install UTF-8 error
```
UnicodeNormalize.normalize: Unicode Normalization not appropriate for ASCII-8BIT
```
Fix: `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install`

### Xcode workspace won't open with `open`
Use `xed StormTrackRx.xcworkspace` instead of `open`.

### Node.js/npx not found
Homebrew installs to `/opt/homebrew/bin/`. Ensure `~/.zprofile` has `eval "$(/opt/homebrew/bin/brew shellenv)"`. Open a new terminal.

### Neon Data API 403 errors
Database grants not applied. Run the GRANT statements for `authenticated`, `neon_auth`, `anonymous`, `authenticator` roles.

### Better Auth sessions broken after plugin change
Plugin ordering matters: `expo()`, `jwt()`, `nextCookies()` — **nextCookies() must be last**.
