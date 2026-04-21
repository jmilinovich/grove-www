#!/usr/bin/env node
// Minimal mock of api.grove.md for Playwright mobile tests.
// Returns just enough shape for each grove-www server component to render.

import http from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 3848);
const now = Date.now();
const iso = () => new Date().toISOString();

const NOTE = {
  path: "Resources/Concepts/Example.md",
  content:
    "# Example Concept\n\nThis is a **test note** rendered at 375px. It has `inline code`, a very-long-identifier-like-string-without-spaces-that-could-force-horizontal-scroll-if-not-wrapped, and a code block:\n\n```js\n// a very long line of code that should scroll internally, not push the page sideways on a narrow mobile viewport\nconst answer = 42;\n```\n\n```mermaid\ngraph LR; A-->B; B-->C;\n```\n\nSee [[Another Note]] and [[Missing Note]].",
  frontmatter: { type: "concept", title: "Example Concept", tags: ["test"] },
  links: [],
  backlinks: ["Resources/Concepts/Another Note.md"],
  sha: "deadbeef",
  updated_at: iso(),
};

function body(res, obj, status = 200) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const p = u.pathname;

  // Auth / identity
  if (p === "/v1/whoami") {
    return body(res, {
      key_id: "k-test",
      key_name: "mobile-test",
      scopes: ["read", "write", "admin"],
      vault_id: "v1",
      trail: null,
      role: "owner",
      email: "test@grove.md",
      user: { id: "u-test", email: "test@grove.md", role: "owner" },
    });
  }
  if (p === "/auth/exchange" || p === "/auth/magic-link") return body(res, { ok: true });
  if (p === "/keys") {
    if (req.method === "GET") {
      return body(res, {
        keys: [
          {
            id: "k-test",
            name: "mobile-test",
            created_at: iso(),
            last_used_at: iso(),
            scopes: ["read", "write"],
            masked: "grove_live_••••_test",
          },
        ],
      });
    }
    return body(res, { token: "grove_live_test" });
  }

  // Users / residents / me
  const USERS = [
    { id: "u-test", email: "test@grove.md", username: "test", role: "owner", created_at: iso(), last_login_at: iso(), trails: [], key_count: 1 },
    { id: "u-guest", email: "guest-with-a-rather-long-email-address@grove.md", username: "guest", role: "trail", created_at: iso(), last_login_at: iso(), trails: ["Research"], key_count: 0 },
  ];
  if (p === "/v1/users") return body(res, USERS);
  if (p === "/v1/admin/users") return body(res, { users: USERS });
  if (p === "/v1/me") {
    return body(res, {
      id: "u-test",
      username: "test",
      email: "test@grove.md",
      role: "owner",
      display_name: "Test User",
      trails: [
        { id: "t-1", name: "Research", description: "Curated research notes." },
      ],
      keys: [
        { id: "k-test", name: "mobile-test", scopes: ["read", "write"], created_at: iso(), last_used_at: iso() },
      ],
      sessions: [
        { id: "s-1", user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)", created_at: iso(), last_used_at: iso(), expires_at: iso(), is_current: true },
      ],
    });
  }
  if (p.startsWith("/v1/residents/")) {
    return body(res, { handle: "test", display_name: "Test", created_at: iso() });
  }

  // Trails
  const TRAILS = [
    {
      id: "t-1",
      slug: "research",
      name: "Research",
      description: "Curated research notes with really rather verbose description text that should wrap nicely on mobile viewports.",
      note_count: 12,
      created_at: iso(),
      is_public: false,
      allow_tags: ["research"],
      deny_tags: [],
      allow_paths: ["Resources/"],
      deny_paths: [],
      key_count: 1,
      member_count: 1,
    },
  ];
  if (p === "/v1/trails") return body(res, TRAILS);
  if (p === "/v1/admin/trails") return body(res, { trails: TRAILS });
  if (p.startsWith("/v1/trails/")) {
    return body(res, {
      id: "t-1",
      slug: "research",
      name: "Research",
      description: "Test trail",
      note_count: 12,
      created_at: iso(),
      is_public: false,
      rules: { include: [], exclude: [] },
      rate_limits: { reads_per_min: 60, writes_per_min: 10 },
    });
  }

  // Notes / list
  if (p === "/v1/list") {
    return body(res, {
      entries: [
        {
          path: NOTE.path,
          name: "Example Concept",
          type: "concept",
          tags: ["test"],
          modified_at: iso(),
        },
        {
          path: "Sources/img/example.png",
          name: "Example Image",
          type: "image",
          tags: ["test"],
          modified_at: iso(),
          thumbnail_url: "/favicon.ico",
          image_url: "/favicon.ico",
          dimensions: { width: 320, height: 240 },
        },
      ],
    });
  }
  if (p === "/v1/notes") {
    return body(res, {
      notes: [
        { path: NOTE.path, title: NOTE.frontmatter.title, type: "concept", updated_at: iso() },
      ],
    });
  }
  if (p.startsWith("/v1/notes/")) {
    return body(res, NOTE);
  }
  if (p === "/v1/tags") return body(res, { tags: [{ tag: "test", count: 3 }] });

  // Images
  if (p === "/v1/images") {
    return body(res, {
      images: [
        {
          path: "Sources/img/example.png",
          title: "Example",
          size: 1024,
          width: 320,
          height: 240,
          tags: ["test"],
          updated_at: iso(),
          thumb: "",
        },
      ],
    });
  }

  // Metrics / stats / health
  if (p === "/metrics") {
    return body(res, {
      total_requests: 128,
      error_rate: 0.01,
      uptime_seconds: 86400,
      by_tool: {
        query: { count: 64, errors: 0, error_rate: 0, latency_p50: 42, latency_p95: 120, latency_p99: 300 },
        get: { count: 32, errors: 0, error_rate: 0, latency_p50: 10, latency_p95: 30, latency_p99: 45 },
        write_note: { count: 8, errors: 0, error_rate: 0, latency_p50: 80, latency_p95: 220, latency_p99: 400 },
      },
      search: { queries_1h: 12, avg_latency_ms: 85, zero_result_rate: 0.05 },
    });
  }
  if (p === "/v1/stats") {
    return body(res, {
      note_count: 1000,
      total_size: 1024 * 1024,
      last_sync: iso(),
      last_commit: { sha: "abc1234", author: "test", message: "sync", timestamp: iso() },
      mode_active: "default",
    });
  }
  if (p === "/v1/health") {
    return body(res, {
      status: "ok",
      total_notes: 1000,
      orphan_count: 12,
      orphan_rate: 0.012,
      broken_link_count: 2,
      total_links: 3200,
      embedding_coverage: 0.99,
      stale_embedding_count: 3,
      link_density: 3.2,
      cluster_count: 5,
      largest_cluster_pct: 0.7,
      missing_frontmatter: 4,
      empty_notes: 1,
      duplicate_titles: 0,
    });
  }
  if (p === "/v1/lifecycle") {
    return body(res, {
      buckets: {
        seed: [{ path: "a.md", title: "Seed note", score: 0.3 }],
        sprout: [],
        growing: [],
        mature: [{ path: "b.md", title: "Mature note", score: 0.9 }],
        dormant: [],
        withering: [],
      },
      summary: { total: 1000, active: 300, needs_attention: 12 },
    });
  }

  // Search
  if (p === "/v1/search" || p === "/v1/query") {
    return body(res, { hits: [], total: 0 });
  }

  // Default: empty-but-valid
  body(res, {});
});

server.listen(PORT, () => {
  console.log(`[mobile-mock-api] listening on :${PORT}`);
});
