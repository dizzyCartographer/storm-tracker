// Auth requests are always same-origin — serverless functions are co-deployed
// with the SPA in every environment (dev, preview, production).
export const API_BASE_URL = "";

// Neon Data API — PostgREST auto-generated REST with JWT/RLS
// Set VITE_NEON_DATA_API_URL in Vercel env vars per environment:
//   Production: https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1
//   Preview:    https://ep-round-shape-amx2h82v.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1
export const NEON_DATA_API_URL =
  import.meta.env.VITE_NEON_DATA_API_URL ||
  "https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1";
