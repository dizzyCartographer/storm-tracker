// Better Auth catch-all handler for /api/auth/*
// Handles sign-in, sign-up, sign-out, sessions, JWKS, token exchange

import { auth } from "../_auth-config";

// Vercel + Vite uses Web API format (Request/Response), not Node.js format
export const GET = (request: Request) => auth.handler(request);
export const POST = (request: Request) => auth.handler(request);
