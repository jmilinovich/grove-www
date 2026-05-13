// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";

// Stub `next/link` for the same reason as the BacklogList tests: the
// Next.js context isn't loaded in the unit environment.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & Record<string, unknown>) =>
    React.createElement("a", { href, ...rest }, children),
}));

// `notFound` is a server-only Next.js helper that throws. We stub it
// so the detail page test can render the not-found branch without
// pulling in the Next.js request runtime.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn() }),
}));

// `next/cache` cacheTag() throws outside Next.js's request runtime
// unless cacheComponents is wired up via next.config — which vitest
// doesn't load. Same stub pattern as page.test.tsx for the homepage.
vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
}));

// SkillsListClient is `'use client'` and binds the global keyboard
// shortcuts. We stub it down to a simple test-id renderer so the page
// test focuses on the server-rendered composition (header + tab strip
// + skill list pass-through). Keymap behavior is covered by the
// keyboard-shortcut hook's own tests.
vi.mock("./skills-list-client", () => ({
  SkillsListClient: ({
    skills,
    vaultSlug,
    atHandle,
  }: {
    skills: Array<{ slug: string; name: string }>;
    vaultSlug: string;
    atHandle: string;
  }) => (
    <div
      data-testid="skills-list-client"
      data-vault-slug={vaultSlug}
      data-at-handle={atHandle}
    >
      {skills.map((s) => (
        <span key={s.slug} data-testid="skill-name">
          {s.name}
        </span>
      ))}
    </div>
  ),
  SkillDetailClient: ({
    skill,
  }: {
    skill: { slug: string; name: string };
  }) => (
    <div data-testid="skill-detail-client" data-slug={skill.slug}>
      {skill.name}
    </div>
  ),
}));

beforeEach(() => {
  delete process.env.GROVE_API_MODE;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SkillsPage (W3-SKILLS Installed tab)", () => {
  it("renders without error against mock fetchSkills payload", async () => {
    const { default: SkillsPage } = await import("./page");
    const element = await SkillsPage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    expect(() => render(element)).not.toThrow();
  });

  it("renders the page header and the lowercase 'skills' title", async () => {
    const { default: SkillsPage } = await import("./page");
    const element = await SkillsPage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent?.toLowerCase()).toContain("skills");
  });

  it("renders the three-tab strip with Installed active and Browse/New as placeholders", async () => {
    const { default: SkillsPage } = await import("./page");
    const element = await SkillsPage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);

    const strip = screen.getByTestId("skills-tab-strip");
    expect(strip).toBeTruthy();

    const installed = screen.getByTestId("tab-installed");
    expect(installed.getAttribute("data-active")).toBe("true");

    const browse = screen.getByTestId("tab-browse");
    expect(browse.getAttribute("data-active")).toBe("false");
    expect(browse.textContent?.toLowerCase()).toContain("coming in v3");

    const newTab = screen.getByTestId("tab-new");
    expect(newTab.getAttribute("data-active")).toBe("false");
    expect(newTab.textContent?.toLowerCase()).toContain("coming in v3");
  });

  it("passes vaultSlug + atHandle into the client island", async () => {
    const { default: SkillsPage } = await import("./page");
    const element = await SkillsPage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    const island = screen.getByTestId("skills-list-client");
    expect(island.getAttribute("data-vault-slug")).toBe("personal");
    expect(island.getAttribute("data-at-handle")).toBe("jm");
  });

  it("renders all 7 mock-fixture skill names", async () => {
    // The mock fixture seeds 7 builtin skills (SPEC §14.8). The test
    // proves the data round-trip from fetchSkills → page → client
    // island actually pipes the full set into the rendered tree.
    const { default: SkillsPage } = await import("./page");
    const element = await SkillsPage({
      params: Promise.resolve({ atHandle: "jm", vaultSlug: "personal" }),
    });
    render(element);
    const names = screen
      .getAllByTestId("skill-name")
      .map((n) => n.textContent ?? "");
    expect(names.length).toBe(7);
    expect(names).toContain("Daily Vault Review");
    expect(names).toContain("Concept Graph Cleanup");
  });
});

describe("SkillDetailPage (W3-SKILLS detail)", () => {
  it("renders the skill name, description, sample tasks, and configure section", async () => {
    const { default: SkillDetailPage } = await import("./[slug]/page");
    const element = await SkillDetailPage({
      params: Promise.resolve({
        atHandle: "jm",
        vaultSlug: "personal",
        slug: "daily-vault-review",
      }),
    });
    render(element);

    // Header includes the skill name.
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Daily Vault Review");

    // Description from the mock fixture flows through.
    expect(
      screen.getByText(/surfaces today's noteworthy patterns/i),
    ).toBeTruthy();

    // Sample tasks list renders each entry from the fixture.
    const sampleSection = screen.getByTestId("sample-tasks");
    expect(sampleSection.textContent).toContain("today's patterns from your journal");
    expect(sampleSection.textContent).toContain(
      "concepts that haven't been touched in 30 days",
    );

    // Configure section mounts the client island with the right skill.
    const detail = screen.getByTestId("skill-detail-client");
    expect(detail.getAttribute("data-slug")).toBe("daily-vault-review");
  });

  it("links back to the skills index with the vault-scoped path", async () => {
    const { default: SkillDetailPage } = await import("./[slug]/page");
    const element = await SkillDetailPage({
      params: Promise.resolve({
        atHandle: "jm",
        vaultSlug: "personal",
        slug: "vault-health",
      }),
    });
    render(element);
    const back = screen.getByRole("link", { name: /all skills/i });
    expect(back.getAttribute("href")).toBe("/jm/personal/skills");
  });

  it("calls notFound() when the slug doesn't match any installed skill", async () => {
    const { default: SkillDetailPage } = await import("./[slug]/page");
    await expect(
      SkillDetailPage({
        params: Promise.resolve({
          atHandle: "jm",
          vaultSlug: "personal",
          slug: "this-skill-does-not-exist",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("matches each of the 7 fixture skill slugs", async () => {
    const slugs = [
      "daily-vault-review",
      "concept-graph-cleanup",
      "relationship-surface",
      "dormant-thread-surface",
      "journal-patterns",
      "perishable-audit",
      "vault-health",
    ];
    const { default: SkillDetailPage } = await import("./[slug]/page");
    for (const slug of slugs) {
      const element = await SkillDetailPage({
        params: Promise.resolve({
          atHandle: "jm",
          vaultSlug: "personal",
          slug,
        }),
      });
      render(element);
      const detail = screen.getByTestId("skill-detail-client");
      expect(detail.getAttribute("data-slug")).toBe(slug);
      cleanup();
    }
  });
});
