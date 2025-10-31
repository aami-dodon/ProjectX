import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStatus } from "../use-auth-status";

describe("useAuthStatus", () => {
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  it("returns authentication status changes when px:user-updated is dispatched", async () => {
    const { result } = renderHook(() => useAuthStatus());

    expect(result.current).toBe(false);

    act(() => {
      window.localStorage.setItem("accessToken", "access-token");
      window.dispatchEvent(new Event("px:user-updated"));
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    act(() => {
      window.localStorage.removeItem("accessToken");
      window.dispatchEvent(new Event("px:user-updated"));
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
