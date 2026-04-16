---
id: ST-074
title: Switch from Prisma to dbmate for database migrations
type: tech-debt
status: open
urgency: low
phase: A
components:
  - infrastructure
depends_on:
  - [[ST-071-delete-old-nextjs-src|ST-071]]
blocks:
  - [[ST-004-database-grants-not-in-migration|ST-004]]
created: 2026-04-16
---

# ST-074: Switch from Prisma to dbmate for database migrations

## Context

Prisma is currently used for two things: ORM queries (being removed in [[ST-071-delete-old-nextjs-src|ST-071]]) and schema migrations. Once [[ST-071-delete-old-nextjs-src|ST-071]] removes `@prisma/client`, Prisma's only remaining role is running SQL files in order. dbmate does the same thing with zero runtime dependencies.

## Why dbmate

- Single Go binary, no Node.js or JVM required
- Migrations are plain SQL files (which ours already are)
- Tracks full migration history in a `schema_migrations` table
- Single file per migration with `-- migrate:up` / `-- migrate:down` sections
- 6.8k GitHub stars, actively maintained

## Switching cost

- **Data affected:** None. The tool only manages a tracking table. Schema and data are untouched.
- **Systems that depend on it:** One — the build/deploy step that runs migrations.
- **Switching cost:** Hours. Seed dbmate's tracking table with existing Prisma migration history.

## Plan

### Phase 1: Install and configure dbmate

1. Install dbmate locally (`brew install dbmate`)
2. Create `database.yml` or set `DATABASE_URL` env var (already exists as `STRM_TRKR_DATABASE_URL`)
3. Configure migrations directory (default: `db/migrations/`)
4. Configure `schema_migrations` table name if needed

### Phase 2: Migrate history from Prisma

1. Read Prisma's `_prisma_migrations` table to get the list of applied migrations
2. Seed dbmate's `schema_migrations` table with the same migration names/timestamps
3. Verify `dbmate status` shows all existing migrations as applied

### Phase 3: Convert migration file format

1. Copy existing SQL files from `prisma/migrations/*/migration.sql` into dbmate's directory
2. Add `-- migrate:up` header to each file
3. Add `-- migrate:down` section where feasible (some migrations may be up-only)
4. Verify file naming matches dbmate conventions (timestamp prefix)

### Phase 4: Write [[ST-004-database-grants-not-in-migration|ST-004]] as the first new dbmate migration

1. Write the GRANTs migration for Neon Data API roles (`authenticated`, `neon_auth`, `anonymous`, `authenticator`)
2. Run via `dbmate up`
3. Verify on staging

### Phase 5: Update build/deploy step

1. Replace `prisma migrate deploy` with `dbmate up` in the Vercel build command
2. Verify deployment works on staging

### Phase 6: Remove Prisma migration artifacts

1. Delete `prisma/` directory (schema, migrations, config)
2. Remove `prisma` CLI from `package.json` devDependencies
3. Verify clean build

## Depends on

- **[[ST-071-delete-old-nextjs-src|ST-071]]** — Prisma ORM removal must land first so we're not removing Prisma while it's still in use

## Blocks

- **[[ST-004-database-grants-not-in-migration|ST-004]]** — GRANTs migration will be the first migration written with dbmate
- Ephemeral Neon feature branches (each new branch needs GRANTs applied via migration)
