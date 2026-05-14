// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, renderHook, act } from "@testing-library/react";
import { usePageVisibility } from "./use-page-visibility";

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

afterEach(() => {
  cleanup();
  setVisibility("visible");
});

describe("usePageVisibility", () => {
  it("returns true initially when document is visible", () => {
    setVisibility("visible");
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);
  });

  it("flips to false on visibilitychange → hidden", () => {
    setVisibility("visible");
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);

    act(() => {
      setVisibility("hidden");
    });
    expect(result.current).toBe(false);
  });

  it("returns to true when visibility is regained", () => {
    setVisibility("visible");
    const { result } = renderHook(() => usePageVisibility());

    act(() => {
      setVisibility("hidden");
    });
    expect(result.current).toBe(false);

    act(() => {
      setVisibility("visible");
    });
    expect(result.current).toBe(true);
  });

  it("removes the visibilitychange listener on unmount", () => {
    setVisibility("visible");
    let added = 0;
    let removed = 0;
    const origAdd = document.addEventListener.bind(document);
    const origRemove = document.removeEventListener.bind(document);
    document.addEventListener = ((type: string, ...rest: unknown[]) => {
      if (type === "visibilitychange") added++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return origAdd(type as any, ...(rest as [any]));
    }) as typeof document.addEventListener;
    document.removeEventListener = ((type: string, ...rest: unknown[]) => {
      if (type === "visibilitychange") removed++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return origRemove(type as any, ...(rest as [any]));
    }) as typeof document.removeEventListener;

    const { unmount } = renderHook(() => usePageVisibility());
    expect(added).toBeGreaterThan(0);

    unmount();
    expect(removed).toBe(added);

    document.addEventListener = origAdd;
    document.removeEventListener = origRemove;
  });
});
