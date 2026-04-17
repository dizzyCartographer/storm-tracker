---
id: ST-067
title: Dynamic app icon per build profile (dev vs production)
type: enhancement
status: on-stage
urgency: low
phase: A
components: [mobile, infrastructure, theming]
created: 2026-04-13
---

# ST-067 — Dynamic app icon per build profile

## Problem

Both dev and production builds use the same app icon, making it hard to tell them apart on the home screen.

## Solution

- Convert dev icon SVG (`docs/branding/storm-tracker-icon-dev-v6.svg`) to PNGs at required sizes
- Update `app.config.js` to swap icon and splash image based on `APP_ENV`
- `APP_ENV=staging` → `icon-dev.png` / `splash-icon-dev.png`
- Default (production) → `icon.png` / `splash-icon.png`

## Changes

- `mobile/assets/images/icon-dev.png` — 1024×1024 dev icon
- `mobile/assets/images/splash-icon-dev.png` — 288×288 dev splash icon
- `mobile/assets/images/favicon-dev.png` — 48×48 dev favicon
- `mobile/app.config.js` — dynamic icon/splash selection based on `APP_ENV`
- Splash screen plugin config moved from `app.json` to `app.config.js` so it can be dynamic

## Verification

```bash
# Production config
npx expo config  # → icon: ./assets/images/icon.png

# Staging config
APP_ENV=staging npx expo config  # → icon: ./assets/images/icon-dev.png
```

## Build commands

```bash
# Staging (dev icon)
APP_ENV=staging LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo prebuild --platform ios --clean

# Production (prod icon)
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo prebuild --platform ios --clean
```
