// Auth requests are always same-origin — serverless functions are co-deployed
// with the SPA in every environment (dev, preview, production).
export const API_BASE_URL = "";

// Neon Data API — PostgREST auto-generated REST with JWT/RLS
// Set VITE_NEON_DATA_API_URL in Vercel env vars for every environment.
export const NEON_DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL;
