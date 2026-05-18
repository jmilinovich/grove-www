import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks: vi.mock factories run before the module-under-test
// imports its dependencies. We mock both the v2 grove-api surface (so
// we can assert call args + simulate errors) and next/cache (so we
// can assert the right tag is invalidated).
//
// Cache primitive: skills.ts uses `updateTag` (Next.js 16 Server-Action
// primitive), matching the pattern in `_actions/tasks.test.ts`.
vi.mock("@/lib/grove-api.v2", () => ({
  configureSkill: vi.fn(async (_slug: string, _cadence: string) => {}),
  enableSkill: vi.fn(async (_slug: string) => {}),
  disableSkill: vi.fn(async (_slug: string) => {}),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import * as api from "@/lib/grove-api.v2";
import { updateTag } from "next/cache";
import {
  configureSkill,
  enableSkill,
  disableSkill,
} from "./skills";

const mockedConfigureSkill = vi.mocked(
  api.configureSkill,
) as unknown as ReturnType<
  typeof vi.fn<(slug: string, cadence: string) => Promise<void>>
>;
const mockedEnableSkill = vi.mocked(api.enableSkill) as unknown as ReturnType<
  typeof vi.fn<(slug: string) => Promise<void>>
>;
const mockedDisableSkill = vi.mocked(api.disableSkill) as unknown as ReturnType<
  typeof vi.fn<(slug: string) => Promise<void>>
>;
const mockedUpdateTag = vi.mocked(updateTag);

beforeEach(() => {
  mockedConfigureSkill.mockReset();
  mockedEnableSkill.mockReset();
  mockedDisableSkill.mockReset();
  mockedUpdateTag.mockReset();
  mockedConfigureSkill.mockResolvedValue(undefined);
  mockedEnableSkill.mockResolvedValue(undefined);
  mockedDisableSkill.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("configureSkill Server Action", () => {
  it("calls grove-api.v2.configureSkill with slug + cadence and invalidates the vault backlog tag", async () => {
    await configureSkill("daily-vault-review", "daily", "main");

    expect(mockedConfigureSkill).toHaveBeenCalledTimes(1);
    expect(mockedConfigureSkill).toHaveBeenCalledWith(
      "main",
      "daily-vault-review",
      "daily",
    );
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors from grove-api.v2.configureSkill and does not invalidate on failure", async () => {
    mockedConfigureSkill.mockRejectedValueOnce(new Error("skill not found"));

    await expect(
      configureSkill("nonexistent-skill", "weekly", "main"),
    ).rejects.toThrow("skill not found");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });

  it("threads the cadence value through verbatim", async () => {
    await configureSkill("journal-patterns", "weekly", "main");
    expect(mockedConfigureSkill).toHaveBeenCalledWith(
      "main",
      "journal-patterns",
      "weekly",
    );

    mockedConfigureSkill.mockReset();
    mockedConfigureSkill.mockResolvedValue(undefined);

    await configureSkill("journal-patterns", "on-demand", "main");
    expect(mockedConfigureSkill).toHaveBeenCalledWith(
      "main",
      "journal-patterns",
      "on-demand",
    );
  });
});

describe("enableSkill Server Action", () => {
  it("calls grove-api.v2.enableSkill with slug and invalidates the vault backlog tag", async () => {
    await enableSkill("vault-health", "main");

    expect(mockedEnableSkill).toHaveBeenCalledTimes(1);
    expect(mockedEnableSkill).toHaveBeenCalledWith("main", "vault-health");
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors from grove-api.v2.enableSkill and does not invalidate on failure", async () => {
    mockedEnableSkill.mockRejectedValueOnce(new Error("boom"));

    await expect(enableSkill("vault-health", "main")).rejects.toThrow("boom");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("disableSkill Server Action", () => {
  it("calls grove-api.v2.disableSkill and invalidates the vault backlog tag", async () => {
    await disableSkill("vault-health", "main");

    expect(mockedDisableSkill).toHaveBeenCalledTimes(1);
    expect(mockedDisableSkill).toHaveBeenCalledWith("main", "vault-health");
    expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:main/backlog");
  });

  it("propagates errors from grove-api.v2.disableSkill and does not invalidate on failure", async () => {
    mockedDisableSkill.mockRejectedValueOnce(new Error("nope"));

    await expect(disableSkill("vault-health", "main")).rejects.toThrow("nope");
    expect(mockedUpdateTag).not.toHaveBeenCalled();
  });
});

describe("vault slug threading", () => {
  it("uses the vault slug from the call site in the tag", async () => {
    await configureSkill("daily-vault-review", "daily", "personal");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:personal/backlog");

    mockedUpdateTag.mockReset();

    await enableSkill("vault-health", "work");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:work/backlog");

    mockedUpdateTag.mockReset();

    await disableSkill("vault-health", "side-project");
    expect(mockedUpdateTag).toHaveBeenCalledWith("vault:side-project/backlog");
  });
});
