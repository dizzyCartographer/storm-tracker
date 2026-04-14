---
id: ST-061
title: Invite link acceptance on mobile
type: enhancement
status: open
priority: high
urgency: soon
components:
  - mobile
  - projects
  - auth
source: web-parity
created: 2026-04-11
completed:
---

Allow caregivers to accept project invite links from the mobile app. Currently invite links only work on the web app. Mobile needs deep link handling (`stormtracker://` scheme) to intercept invite URLs and present an accept/decline flow. Requires Expo Router deep link configuration and an invite acceptance screen.
