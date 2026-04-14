// In dev, auth requests go through the Vite proxy (same-origin).
// In production, they go directly to the deployed URL.
export const API_BASE_URL = import.meta.env.DEV
  ? ""
  : "https://storm-tracker-murex.vercel.app";

// Neon Data API — PostgREST auto-generated REST with JWT/RLS
export const NEON_DATA_API_URL =
  "https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1";
