// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";

const usePathnameMock = vi.fn<() => string>();
const useParamsMock = vi.fn<() => { atHandle?: string; vaultSlug?: string }>();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useParams: () => useParamsMock(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("a", { href, ...rest }, children),
}));

beforeEach(() => {
  useParamsMock.mockReturnValue({ atHandle: "jm", vaultSlug: "personal" });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DashboardNav (P20-A3)", () => {
  async function load() {
    const mod = await import("@/components/dashboard-nav");
    return mod.default;
  }

  it("renders exactly 2 rail links: Home, Access", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard");
    const DashboardNav = await load();
    render(<DashboardNav />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Home", "Access"]);
  });

  it("Home link points to scoped /dashboard; Access to /dashboard/access", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard");
    const DashboardNav = await load();
    render(<DashboardNav />);
    expect(screen.getByText("Home").getAttribute("href")).toBe(
      "/@jm/personal/dashboard",
    );
    expect(screen.getByText("Access").getAttribute("href")).toBe(
      "/@jm/personal/dashboard/access",
    );
  });

  it("marks Home active on exact /dashboard path", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard");
    const DashboardNav = await load();
    render(<DashboardNav />);
    expect(screen.getByText("Home").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Access").getAttribute("aria-current")).toBeNull();
  });

  it("marks Access active on /dashboard/access", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard/access");
    const DashboardNav = await load();
    render(<DashboardNav />);
    expect(screen.getByText("Access").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Home").getAttribute("aria-current")).toBeNull();
  });

  it("keeps Access active on nested /dashboard/access/keys", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard/access/keys");
    const DashboardNav = await load();
    render(<DashboardNav />);
    expect(screen.getByText("Access").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Home").getAttribute("aria-current")).toBeNull();
  });

  it("neither link is active outside /dashboard/*", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/images");
    const DashboardNav = await load();
    render(<DashboardNav />);
    expect(screen.getByText("Home").getAttribute("aria-current")).toBeNull();
    expect(screen.getByText("Access").getAttribute("aria-current")).toBeNull();
  });
});
