---
id: ST-075
title: Add JWT audience claim for environment isolation hardening
type: tech-debt
status: open
priority: medium
urgency: soon
components:
  - auth
  - infrastructure
source: staging-setup-session
created: 2026-04-16
depends-on: ST-004
---

## Problem

JWTs issued by Better Auth do not include an `aud` (audience) claim. While staging and production use separate JWKS signing keys (providing environment isolation), adding audience would provide defense-in-depth — a token intended for staging would be rejected by production even if keys were somehow shared.

## What to do

1. Add `audience` to the Better Auth JWT plugin config in `web/api/auth.ts`, scoped per environment (e.g., `storm-tracker-production`, `storm-tracker-staging`).
2. Confirm whether Neon Data API (PostgREST) enforces `aud` checking. If it does, configure the expected audience in Neon console for each branch.
3. Test that JWTs with the audience claim still work for both auth and Neon Data API access.

## Why

HIPAA defense-in-depth. Separate JWKS keys are the primary security boundary between environments. Audience is a second layer that prevents cross-environment token reuse even if keys were compromised or accidentally shared.

## Blocked by

Staging database setup (ST-004) must be complete first so we have a working staging environment to test against.
