// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { MeResponse } from "@/lib/vault-context";

const useParamsMock = vi.fn<() => { atHandle?: string; vaultSlug?: string }>();
const useMeMock = vi.fn<() => { me: MeResponse | null; loading: boolean }>();

vi.mock("next/navigation", () => ({
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

vi.mock("@/contexts/me-context", () => ({
  useMe: () => useMeMock(),
}));

beforeEach(() => {
  useParamsMock.mockReturnValue({ atHandle: "jm", vaultSlug: "personal" });
  useMeMock.mockReturnValue({
    me: { handle: "jm", username: "jm", email: "jm@example.com", vaults: [] },
    loading: false,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AvatarMenu (P20-A4)", () => {
  async function load() {
    const mod = await import("@/components/avatar-menu");
    return mod.default;
  }

  it("does not render when /v1/me is null (unauthenticated)", async () => {
    useMeMock.mockReturnValue({ me: null, loading: false });
    const AvatarMenu = await load();
    const { container } = render(<AvatarMenu />);
    expect(container.firstChild).toBeNull();
  });

  it("renders button with initials and aria-haspopup='menu'", async () => {
    const AvatarMenu = await load();
    render(<AvatarMenu />);
    const btn = screen.getByRole("button", { name: "Account menu" });
    expect(btn.getAttribute("aria-haspopup")).toBe("menu");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    // "jm@example.com" → "JM"
    expect(btn.textContent).toBe("JM");
  });

  it("menu is closed by default; opens on click", async () => {
    const AvatarMenu = await load();
    render(<AvatarMenu />);
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Account menu" }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("shows 'Signed in as <email>' when email is present", async () => {
    const AvatarMenu = await load();
    render(<AvatarMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByText("jm@example.com")).toBeTruthy();
    expect(screen.getByText(/Signed in as/)).toBeTruthy();
  });

  it("hides 'Signed in as' when email is missing; falls back to handle initials", async () => {
    useMeMock.mockReturnValue({
      me: { handle: "alice", username: "alice", email: null, vaults: [] },
      loading: false,
    });
    const AvatarMenu = await load();
    render(<AvatarMenu />);
    expect(screen.getByRole("button", { name: "Account menu" }).textContent).toBe(
      "AL",
    );
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.queryByText(/Signed in as/)).toBeNull();
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("Profile link points to /@<handle>/profile (user-scoped, no vault)", async () => {
    const AvatarMenu = await load();
    render(<AvatarMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("menuitem", { name: "Profile" }).getAttribute("href"))
      .toBe("/@jm/profile");
  });

  it("Account settings link points to /@<handle>/settings/vaults", async () => {
    const AvatarMenu = await load();
    render(<AvatarMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(
      screen.getByRole("menuitem", { name: "Account settings" }).getAttribute("href"),
    ).toBe("/@jm/settings/vaults");
  });

  it("Sign out menuitem present", async () => {
    const AvatarMenu = await load();
    render(<AvatarMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeTruthy();
  });

  it("closes on Escape", async () => {
    const AvatarMenu = await load();
    render(<AvatarMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes on outside click", async () => {
    const AvatarMenu = await load();
    render(
      <div>
        <AvatarMenu />
        <div data-testid="outside">outside</div>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes on link click (Profile)", async () => {
    const AvatarMenu = await load();
    render(<AvatarMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Profile" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
