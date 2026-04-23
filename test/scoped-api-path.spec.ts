import { describe, it, expect } from "vitest";
import { scopedApiPath } from "@/lib/vault-context";

describe("scopedApiPath", () => {
  it("prefixes /v/<slug> when a slug is provided", () => {
    expect(scopedApiPath("test-vault", "/v1/list")).toBe("/v/test-vault/v1/list");
    expect(scopedApiPath("personal", "/v1/notes/foo.md")).toBe("/v/personal/v1/notes/foo.md");
  });

  it("falls back to the legacy path when slug is undefined", () => {
    // Backend still accepts /v1/* and routes to the token's bound vault
    // with a Sunset header — useful for user-scoped pages like /home that
    // don't yet know their vault at request time.
    expect(scopedApiPath(undefined, "/v1/list")).toBe("/v1/list");
    expect(scopedApiPath("", "/v1/list")).toBe("/v1/list");
  });

  it("auto-adds a leading slash to the endpoint when missing", () => {
    // Keeps call sites forgiving — string concat doesn't silently lose a
    // `/` and route into an unrelated path on the backend.
    expect(scopedApiPath("test-vault", "v1/stats")).toBe("/v/test-vault/v1/stats");
    expect(scopedApiPath(undefined, "v1/stats")).toBe("/v1/stats");
  });
});
