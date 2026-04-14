---
id: ST-058
title: Document attachments on mobile entries
type: enhancement
status: open
priority: medium
urgency: low
components:
  - mobile
  - documents
source: web-parity
created: 2026-04-11
completed:
---

Add file attachment support to the mobile log form. Web app supports PDF and image uploads (up to 10MB) via Vercel Blob on log entries. Mobile needs the same capability — likely using `expo-image-picker` for camera/gallery and `expo-document-picker` for PDFs.
