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

import { generateUUID } from "./api";

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
