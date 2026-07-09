import React from "react";
import { Pressable, Text } from "react-native";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";

// MOB-1..MOB-3 (TEST_CASES §10) — ST-077: ProjectProvider must wait for auth,
// surface load failures, and recover in place via retry.

const mockGetTenants = jest.fn();
const mockGetCurrentUserInfo = jest.fn();
jest.mock("./api", () => ({
  getTenants: (...args: unknown[]) => mockGetTenants(...args),
  getCurrentUserInfo: (...args: unknown[]) => mockGetCurrentUserInfo(...args),
}));

const mockUseAuth = jest.fn();
jest.mock("./auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

import { ProjectProvider, useProject } from "./project-context";

function Probe() {
  const { tenants, loading, error, refresh } = useProject();
  return (
    <>
      <Text testID="state">
        {loading ? "loading" : error ? `error:${error}` : `tenants:${tenants.length}`}
      </Text>
      <Pressable testID="retry" onPress={() => refresh()}>
        <Text>retry</Text>
      </Pressable>
    </>
  );
}

function renderProvider() {
  return render(
    <ProjectProvider>
      <Probe />
    </ProjectProvider>
  );
}

const TENANT = { id: "t1", name: "Test Teen", role: "OWNER" };

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCurrentUserInfo.mockResolvedValue({ id: "u1", defaultTenantId: "t1" });
});

test("MOB-1: no fetch fires before auth is ready; load runs once ready", async () => {
  mockUseAuth.mockReturnValue({ ready: false, isSignedIn: false });
  mockGetTenants.mockResolvedValue([TENANT]);

  const view = await renderProvider();
  await waitFor(() => expect(screen.getByTestId("state")).toBeTruthy());
  expect(mockGetTenants).not.toHaveBeenCalled();

  mockUseAuth.mockReturnValue({ ready: true, isSignedIn: true });
  await view.rerender(
    <ProjectProvider>
      <Probe />
    </ProjectProvider>
  );

  await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent(/tenants:1/));
  expect(mockGetTenants).toHaveBeenCalledTimes(1);
});

test("MOB-1b: signed-out users get an empty, non-loading state with no fetch", async () => {
  mockUseAuth.mockReturnValue({ ready: true, isSignedIn: false });

  renderProvider();
  await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent(/tenants:0/));
  expect(mockGetTenants).not.toHaveBeenCalled();
});

test("MOB-2: a failing load auto-retries once, then surfaces an error state (never a silent empty)", async () => {
  mockUseAuth.mockReturnValue({ ready: true, isSignedIn: true });
  mockGetTenants.mockRejectedValue(new Error("No JWT available"));

  renderProvider();

  await waitFor(
    () => expect(screen.getByTestId("state")).toHaveTextContent(/error:No JWT available/),
    { timeout: 8000 } // covers the 1.5s auto-retry backoff
  );
  // Initial attempt + exactly one automatic retry:
  expect(mockGetTenants).toHaveBeenCalledTimes(2);
}, 15000);

test("MOB-3: retry recovers the context in place — no restart, no re-auth", async () => {
  mockUseAuth.mockReturnValue({ ready: true, isSignedIn: true });
  mockGetTenants.mockRejectedValue(new Error("jwk not found"));

  renderProvider();
  await waitFor(
    () => expect(screen.getByTestId("state")).toHaveTextContent(/error:/),
    { timeout: 8000 }
  );

  mockGetTenants.mockResolvedValue([TENANT]);
  fireEvent.press(screen.getByTestId("retry"));

  await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent(/tenants:1/));
}, 15000);
