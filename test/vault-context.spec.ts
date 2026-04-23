import { describe, expect, it } from "vitest";
import {
  activeScopeFromMe,
  resolveActiveVault,
  scopedPath,
  userScopedPath,
  type VaultEntry,
} from "@/lib/vault-context";

function vault(partial: Partial<VaultEntry> & Pick<VaultEntry, "slug">): VaultEntry {
  return {
    id: partial.id ?? partial.slug,
    slug: partial.slug,
    name: partial.name ?? partial.slug,
    role: partial.role ?? "owner",
    owner_handle: partial.owner_handle ?? "jm",
    joined_at: partial.joined_at,
    last_active_at: partial.last_active_at,
  };
}

describe("resolveActiveVault (P8-B3 MRU fallback)", () => {
  it("returns null on empty list", () => {
    expect(resolveActiveVault([])).toBeNull();
  });

  it("picks the vault with the most recent last_active_at", () => {
    const v = resolveActiveVault([
      vault({ slug: "old", last_active_at: "2026-02-01T00:00:00Z" }),
      vault({ slug: "new", last_active_at: "2026-04-10T00:00:00Z" }),
    ]);
    expect(v?.slug).toBe("new");
  });

  it("ignores nulls when others have last_active_at", () => {
    const v = resolveActiveVault([
      vault({ slug: "dormant", last_active_at: null, joined_at: "2025-01-01T00:00:00Z" }),
      vault({ slug: "recent", last_active_at: "2026-04-01T00:00:00Z" }),
    ]);
    expect(v?.slug).toBe("recent");
  });

  it("falls back to earliest joined_at when last_active_at is null everywhere", () => {
    const v = resolveActiveVault([
      vault({ slug: "later", joined_at: "2026-03-01T00:00:00Z" }),
      vault({ slug: "first", joined_at: "2026-01-01T00:00:00Z" }),
      vault({ slug: "middle", joined_at: "2026-02-01T00:00:00Z" }),
    ]);
    expect(v?.slug).toBe("first");
  });

  it("handles malformed last_active_at by treating it as null", () => {
    const v = resolveActiveVault([
      vault({ slug: "a", last_active_at: "not a date", joined_at: "2026-03-01T00:00:00Z" }),
      vault({ slug: "b", last_active_at: null, joined_at: "2026-01-01T00:00:00Z" }),
    ]);
    // "not a date" parses to NaN → both fall through to the joined_at tier.
    expect(v?.slug).toBe("b");
  });

  it("falls through to vaults[0] when no timestamps exist", () => {
    const v = resolveActiveVault([
      vault({ slug: "alpha" }),
      vault({ slug: "beta" }),
    ]);
    expect(v?.slug).toBe("alpha");
  });
});

describe("activeScopeFromMe", () => {
  it("returns null when /v1/me is missing or has no vaults", () => {
    expect(activeScopeFromMe(null)).toBeNull();
    expect(activeScopeFromMe({ vaults: [] })).toBeNull();
  });

  it("prefers the /v1/me handle over owner_handle", () => {
    const scope = activeScopeFromMe({
      handle: "viewer",
      vaults: [vault({ slug: "personal", owner_handle: "alice" })],
    });
    expect(scope).toEqual({ handle: "viewer", slug: "personal" });
  });

  it("falls back to username when handle is absent", () => {
    const scope = activeScopeFromMe({
      username: "legacy",
      vaults: [vault({ slug: "personal", owner_handle: "legacy" })],
    });
    expect(scope?.handle).toBe("legacy");
  });

  it("falls back to the vault's owner_handle when me has neither", () => {
    const scope = activeScopeFromMe({
      vaults: [vault({ slug: "personal", owner_handle: "owner" })],
    });
    expect(scope?.handle).toBe("owner");
  });
});

describe("scopedPath", () => {
  it("joins handle + slug + subPath", () => {
    expect(scopedPath("jm", "personal", "/dashboard")).toBe(
      "/@jm/personal/dashboard",
    );
  });

  it("inserts a slash when subPath is missing a leading one", () => {
    expect(scopedPath("jm", "personal", "profile")).toBe(
      "/@jm/personal/profile",
    );
  });

  it("handles the empty subPath case", () => {
    expect(scopedPath("jm", "personal", "")).toBe("/@jm/personal");
    expect(scopedPath("jm", "personal")).toBe("/@jm/personal");
  });

  it("strips a leading @ on handle so [atHandle] route params don't double-encode", () => {
    // Next.js captures the `[atHandle]` route segment as `"@jm"`, and callers
    // (e.g. useScopedLink) pass that straight through. Without stripping,
    // scopedPath would return `/@@jm/personal/...` which URL-encodes to
    // `/@%40jm/personal/...`.
    expect(scopedPath("@jm", "personal", "/dashboard")).toBe(
      "/@jm/personal/dashboard",
    );
    expect(scopedPath("@jm", "personal")).toBe("/@jm/personal");
  });

  it("normalizes a URL-encoded handle (%40jm) — Next.js 16 useParams returns this form", () => {
    // Next 16 keeps route params URL-encoded: `useParams()` returns
    // `"%40jm"` for `/@jm/...`, not `"@jm"`. Without decoding, scopedPath
    // would pass `%40jm` through unchanged and produce `/@%40jm/...` —
    // still visibly broken.
    expect(scopedPath("%40jm", "personal", "/dashboard")).toBe(
      "/@jm/personal/dashboard",
    );
  });

  it("tolerates doubly-broken input from a round-trip through a buggy caller", () => {
    // Defense in depth: even if upstream already generated `/@%40jm/...`
    // and Next captured `"@%40jm"`, normalize to `/@jm/...`.
    expect(scopedPath("@%40jm", "personal", "/profile")).toBe(
      "/@jm/personal/profile",
    );
  });
});

describe("userScopedPath (P8-B6)", () => {
  it("joins handle + subPath under /@<handle>/...", () => {
    expect(userScopedPath("jm", "/profile")).toBe("/@jm/profile");
    expect(userScopedPath("jm", "/settings/vaults")).toBe(
      "/@jm/settings/vaults",
    );
  });

  it("inserts a slash when subPath is missing a leading one", () => {
    expect(userScopedPath("jm", "profile")).toBe("/@jm/profile");
  });

  it("returns the bare handle for an empty subPath", () => {
    expect(userScopedPath("jm", "")).toBe("/@jm");
    expect(userScopedPath("jm")).toBe("/@jm");
  });

  it("shares normalization with scopedPath — @-prefixed handles are stripped", () => {
    expect(userScopedPath("@jm", "/profile")).toBe("/@jm/profile");
  });

  it("shares normalization with scopedPath — %40-encoded handles decode", () => {
    // Next 16's useParams returns `"%40jm"` for `/@jm/...`. Both helpers
    // must route through the same `normalizeHandle` so there is one source
    // of truth for handle sanitation.
    expect(userScopedPath("%40jm", "/profile")).toBe("/@jm/profile");
  });

  it("matches the handle prefix produced by scopedPath", () => {
    // Handle-normalization round-trip: `userScopedPath(h, "/x")` should
    // share the `/@<bare-handle>` prefix with `scopedPath(h, slug, "/x")`.
    const user = userScopedPath("@jm", "/profile");
    const vault = scopedPath("@jm", "personal", "/profile");
    expect(vault.startsWith(user.replace("/profile", ""))).toBe(true);
  });
});
