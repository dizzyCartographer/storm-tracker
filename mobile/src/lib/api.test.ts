// api.ts imports the Better Auth Expo client at module scope; mock the auth
// and config boundaries so pure helpers are testable without native modules.
jest.mock("./auth", () => ({
  authClient: { getCookie: jest.fn() },
  getJwt: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("./config", () => ({
  API_BASE_URL: "https://example.test",
  NEON_DATA_API_URL: "https://example.test/rest/v1",
}));

import { generateUUID, neonFetch } from "./api";
import { getJwt, signOut } from "./auth";

const mockGetJwt = getJwt as jest.Mock;
const mockSignOut = signOut as jest.Mock;

describe("neonFetch token handling (MOB-4 / F18)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ status: 200 } as Response);
  });

  test("MOB-4: a transient null JWT retries and never signs the user out", async () => {
    mockGetJwt
      .mockResolvedValueOnce(null) // cold start — token round-trip not done
      .mockResolvedValueOnce("jwt-token");

    const res = await neonFetch("/entries");

    expect(res.status).toBe(200);
    expect(mockGetJwt).toHaveBeenCalledTimes(2);
    expect(mockSignOut).not.toHaveBeenCalled();
  }, 15000);

  test("MOB-4b: a persistently null JWT throws a visible error — still no sign-out", async () => {
    mockGetJwt.mockResolvedValue(null);

    await expect(neonFetch("/entries")).rejects.toThrow(/authentication token/);
    expect(mockGetJwt).toHaveBeenCalledTimes(3);
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  }, 15000);

  test("MOB-8: 400 'jwk not found' responses are retried", async () => {
    mockGetJwt.mockResolvedValue("jwt-token");
    const bad = {
      status: 400,
      clone: () => ({ text: async () => 'jwk not found' }),
    } as unknown as Response;
    const good = { status: 200 } as Response;
    (global.fetch as jest.Mock).mockResolvedValueOnce(bad).mockResolvedValueOnce(good);

    const res = await neonFetch("/entries");
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("a genuine 401 still signs the user out (invalid session path is preserved)", async () => {
    mockGetJwt.mockResolvedValue("jwt-token");
    (global.fetch as jest.Mock).mockResolvedValue({ status: 401 } as Response);

    const res = await neonFetch("/entries");
    expect(res.status).toBe(401);
    expect(mockSignOut).toHaveBeenCalled();
  });
});

describe("generateUUID (Hermes-safe UUID v4 helper)", () => {
  test("produces RFC-4122 v4 shaped ids", () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  test("does not repeat across many calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(generateUUID());
    }
    expect(seen.size).toBe(1000);
  });
});
