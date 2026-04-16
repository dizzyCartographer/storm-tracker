---
id: ST-059
title: PDF report generation on mobile
type: enhancement
status: open
urgency: low
phase: B
components:
  - mobile
  - reports
source: web-parity
created: 2026-04-11
completed:
---

Add PDF report generation to the mobile app. Web app generates clinician-ready PDF exports with wave graph, behavior frequency chart, patient info, and caregiver notes. Mobile needs equivalent functionality — likely via `react-native-print` or `expo-print` with HTML-to-PDF rendering, or `victory-native` for charts.
