// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";

const usePathnameMock = vi.fn<() => string>();
const useParamsMock = vi.fn<() => { atHandle?: string; vaultSlug?: string }>();
const useSearchParamsMock = vi.fn<() => URLSearchParams>(() => new URLSearchParams());
const useRouterMock = vi.fn<() => { replace: (s: string) => void }>(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useParams: () => useParamsMock(),
  useSearchParams: () => useSearchParamsMock(),
  useRouter: () => useRouterMock(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("a", { href, ...rest }, children),
}));

beforeEach(() => {
  useParamsMock.mockReturnValue({ atHandle: "jm", vaultSlug: "personal" });
  useSearchParamsMock.mockReturnValue(new URLSearchParams());
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AccessTabs", () => {
  async function load() {
    const mod = await import("@/components/access-tabs");
    return mod.default;
  }

  it("renders 4 tabs in trust-radius order: Keys, Scoped Keys, Shares, Members", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard/access/keys");
    const AccessTabs = await load();
    render(<AccessTabs />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual([
      "Keys",
      "Scoped Keys",
      "Shares",
      "Members",
    ]);
  });

  it("marks Keys active when pathname is /dashboard/access/keys", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard/access/keys");
    const AccessTabs = await load();
    render(<AccessTabs />);
    const active = screen.getAllByRole("link").filter(
      (el) => el.getAttribute("aria-current") === "page",
    );
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe("Keys");
  });

  it("keeps Keys active on nested path /dashboard/access/keys/new", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard/access/keys/new");
    const AccessTabs = await load();
    render(<AccessTabs />);
    const active = screen.getAllByRole("link").filter(
      (el) => el.getAttribute("aria-current") === "page",
    );
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe("Keys");
  });

  it("marks Members active when pathname is /dashboard/access/members", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard/access/members");
    const AccessTabs = await load();
    render(<AccessTabs />);
    const active = screen.getAllByRole("link").filter(
      (el) => el.getAttribute("aria-current") === "page",
    );
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe("Members");
  });

  it("marks no tab active when pathname is outside /access/*", async () => {
    usePathnameMock.mockReturnValue("/@jm/personal/dashboard");
    const AccessTabs = await load();
    render(<AccessTabs />);
    const active = screen.getAllByRole("link").filter(
      (el) => el.getAttribute("aria-current") === "page",
    );
    expect(active).toHaveLength(0);
  });
});

describe("MembersView ?member=<id> drawer wiring", () => {
  async function load() {
    const mod = await import("@/components/members-view");
    return mod.default;
  }

  const users = [
    {
      id: "u_abc",
      username: "alice",
      email: "alice@example.com",
      role: "member",
      created_at: "2026-01-01T00:00:00Z",
      last_login_at: null,
      key_count: 0,
      trails: [],
    },
  ];

  it("renders drawer when ?member=<id> is present", async () => {
    // Mock fetch for MemberDrawer's /api/admin/users call
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ users }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    useSearchParamsMock.mockReturnValue(new URLSearchParams("member=u_abc"));
    const MembersView = await load();
    render(<MembersView initialUsers={users} trails={[]} />);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe(
      "Member details",
    );
  });

  it("does not render drawer when ?member is absent", async () => {
    vi.stubGlobal("fetch", vi.fn());
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    const MembersView = await load();
    render(<MembersView initialUsers={users} trails={[]} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("row click calls router.replace with ?member=<id>", async () => {
    const replace = vi.fn();
    useRouterMock.mockReturnValue({ replace });
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    const MembersView = await load();
    render(<MembersView initialUsers={users} trails={[]} />);
    const row = screen.getByText("alice@example.com").closest("tr")!;
    row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(replace).toHaveBeenCalledWith("?member=u_abc");
  });
});
