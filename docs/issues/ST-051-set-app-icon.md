---
id: ST-051
title: Set app icon from brand SVG
type: enhancement
status: done
priority: high
urgency: soon
components:
  - mobile
  - theming
source: user-request
created: 2026-04-10
completed:
dev-plan-ref:
---

Convert `docs/branding/storm-tracker-icon-v23.svg` (teal gradient rounded square with cloud + lightning bolt) to the required PNG sizes and set as the app icon for iOS and Android.

Current `mobile/assets/images/icon.png` is the Expo default. Replace it and the Android adaptive icon variants (`android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`).
