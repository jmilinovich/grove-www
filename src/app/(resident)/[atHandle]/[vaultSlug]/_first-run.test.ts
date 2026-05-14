// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";

import {
  __resetFirstRunStore,
  bootstrapFirstRun,
  isFirstRun,
} from "./_first-run";

afterEach(() => {
  __resetFirstRunStore();
});

describe("isFirstRun", () => {
  it("returns true for a never-seen vault", () => {
    expect(isFirstRun("personal")).toBe(true);
  });

  it("returns true for distinct vaults independently", () => {
    expect(isFirstRun("personal")).toBe(true);
    expect(isFirstRun("work")).toBe(true);
  });
});

describe("bootstrapFirstRun", () => {
  it("flips isFirstRun to false for the bootstrapped vault", async () => {
    expect(isFirstRun("personal")).toBe(true);
    await bootstrapFirstRun("personal");
    expect(isFirstRun("personal")).toBe(false);
  });

  it("does not affect other vaults", async () => {
    await bootstrapFirstRun("personal");
    expect(isFirstRun("personal")).toBe(false);
    expect(isFirstRun("work")).toBe(true);
  });

  it("is idempotent — calling twice does not throw and stays done", async () => {
    await bootstrapFirstRun("personal");
    await expect(bootstrapFirstRun("personal")).resolves.toBeUndefined();
    expect(isFirstRun("personal")).toBe(false);
  });

  it("returns a promise (matches the live-impl signature seam)", () => {
    const result = bootstrapFirstRun("personal");
    expect(result).toBeInstanceOf(Promise);
    return result;
  });
});

describe("__resetFirstRunStore", () => {
  it("clears the in-memory done set so isFirstRun goes back to true", async () => {
    await bootstrapFirstRun("personal");
    expect(isFirstRun("personal")).toBe(false);

    __resetFirstRunStore();

    expect(isFirstRun("personal")).toBe(true);
  });
});
