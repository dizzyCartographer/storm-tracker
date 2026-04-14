// Better Auth catch-all handler for /api/auth/*
// Handles sign-in, sign-up, sign-out, sessions, JWKS, token exchange

import type { IncomingMessage, ServerResponse } from "node:http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../_auth-config";

const handler = toNodeHandler(auth);

export default function (req: IncomingMessage, res: ServerResponse) {
  return handler(req, res);
}
