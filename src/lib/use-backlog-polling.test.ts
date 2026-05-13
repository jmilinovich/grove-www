// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, act } from "@testing-library/react";

const refreshSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshSpy }),
}));

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  vi.useFakeTimers();
  setVisibility("visible");
  refreshSpy.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setVisibility("visible");
});

describe("useBacklogPolling", () => {
  async function load() {
    return (await import("./use-backlog-polling")).useBacklogPolling;
  }

  it("calls router.refresh() at the configured interval while visible", async () => {
    const useBacklogPolling = await load();
    renderHook(() => useBacklogPolling({ intervalMs: 1000 }));

    expect(refreshSpy).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(refreshSpy).toHaveBeenCalledTimes(2);
  });

  it("issues zero refreshes within 100ms of visibilitychange → hidden", async () => {
    const useBacklogPolling = await load();
    renderHook(() => useBacklogPolling({ intervalMs: 1000 }));

    // Run one interval to confirm wiring is live, then hide.
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      setVisibility("hidden");
    });
    refreshSpy.mockClear();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(refreshSpy).not.toHaveBeenCalled();

    // Even after multiple intervals while hidden, no calls.
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it("resumes polling within 100ms of visibility regain", async () => {
    const useBacklogPolling = await load();
    renderHook(() => useBacklogPolling({ intervalMs: 1000 }));

    await act(async () => {
      setVisibility("hidden");
    });
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    refreshSpy.mockClear();

    await act(async () => {
      setVisibility("visible");
    });

    // Within 100ms of visibility regain, no refresh has fired yet
    // (the interval restarts; refresh fires on the next tick).
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(refreshSpy).not.toHaveBeenCalled();

    // After the configured interval, a refresh fires.
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("clears the interval on unmount", async () => {
    const useBacklogPolling = await load();
    const { unmount } = renderHook(() =>
      useBacklogPolling({ intervalMs: 1000 }),
    );

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    unmount();
    refreshSpy.mockClear();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it("defaults to 15000ms when no interval is provided", async () => {
    const useBacklogPolling = await load();
    renderHook(() => useBacklogPolling());

    await act(async () => {
      vi.advanceTimersByTime(14_999);
    });
    expect(refreshSpy).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});
