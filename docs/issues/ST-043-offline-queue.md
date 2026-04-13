---
id: ST-043
title: Offline mode with read cache and write queue
type: enhancement
status: open
priority: high
urgency: soon
components:
  - mobile
source: ios-plan
created: 2026-04-10
completed:
dev-plan-ref: Phase E
---

Full offline mode for the mobile app, not just a write queue. Two parts:

1. **Read cache.** Cache API responses locally so the app can display data immediately on launch without waiting for network. Eliminates the "no data" flash on screens that haven't loaded yet (related: ST-064). Cache should be populated on every successful fetch and served as stale-while-revalidate on next launch.

2. **Write queue.** Queue entry saves and edits locally when offline. Sync to the server when connection returns. Must handle conflict resolution if the same entry was edited on another device while offline.

This is critical for daily logging reliability — caregivers often log at night when connectivity may be poor.
