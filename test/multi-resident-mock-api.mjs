#!/usr/bin/env node
// Stateful mock of api.grove.md for the multi-resident e2e Playwright test.
// Tracks a single "owner" user whose handle can be rotated mid-run to
// exercise the handle-history redirect path. A `/__test/*` control plane
// lets the spec mutate state without going through the auth surface.

import http from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 3850);
const iso = () => new Date().toISOString();

const state = {
  currentHandle: "jm",
  releasedHandles: new Set(),
  // Capture the last outgoing invite email so the spec can assert its
  // subject/body contains the resident handle.
  lastInvite: null,
};

const TRAIL = {
  id: "t-research",
  slug: "weekly-reads",
  name: "Weekly Reads",
  description: "A rotating pick of the week's best reading.",
  note_count: 7,
  created_at: iso(),
  enabled: true,
};

const SHARE_CONTENT = "# Shared note\n\nContent from the share viewer.";

function sendJson(res, status, obj, extra = {}) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    ...extra,
  });
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  return await new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (chunk) => { buf += chunk; });
    req.on("end", () => resolve(buf));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const p = u.pathname;

  // ── Control plane for tests ──
  if (p === "/__test/state" && req.method === "GET") {
    return sendJson(res, 200, {
      currentHandle: state.currentHandle,
      releasedHandles: [...state.releasedHandles],
      lastInvite: state.lastInvite,
    });
  }
  if (p === "/__test/reset" && req.method === "POST") {
    state.currentHandle = "jm";
    state.releasedHandles = new Set();
    state.lastInvite = null;
    return sendJson(res, 200, { ok: true });
  }

  // ── Public resident lookup ──
  const residentMatch = p.match(/^\/v1\/residents\/([^/]+)$/);
  if (residentMatch && req.method === "GET") {
    const handle = decodeURIComponent(residentMatch[1]);
    if (handle === state.currentHandle) {
      return sendJson(res, 200, {
        handle,
        display_name: "John M",
        bio: "Builds calm systems.",
        public_trail_slugs: ["weekly-reads"],
        note_count: 42,
      });
    }
    return sendJson(res, 404, { error: "resident not found" });
  }

  // ── Share resolution (owner_handle always reflects current handle) ──
  const shareMatch = p.match(/^\/v1\/share\/([^/]+)$/);
  if (shareMatch && req.method === "GET") {
    const id = decodeURIComponent(shareMatch[1]);
    if (id !== "abc123") {
      return sendJson(res, 404, { error: "share not found" });
    }
    return sendJson(res, 200, {
      id,
      owner_handle: state.currentHandle,
      note_path: "Resources/Concepts/Shared.md",
      title: "Shared note",
      content: SHARE_CONTENT,
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      view_count: 0,
      max_views: 100,
    });
  }

  // ── Trail info (used by /home and scoped trail viewer) ──
  if (p === `/v1/trails/${TRAIL.id}/info` && req.method === "GET") {
    return sendJson(res, 200, {
      name: TRAIL.name,
      description: TRAIL.description,
      note_count: TRAIL.note_count,
      created_at: TRAIL.created_at,
    });
  }
  if (p === `/v1/trails/${TRAIL.slug}/info` && req.method === "GET") {
    return sendJson(res, 200, {
      name: TRAIL.name,
      description: TRAIL.description,
      note_count: TRAIL.note_count,
      created_at: TRAIL.created_at,
    });
  }

  // ── Auth surface (magic link → exchange → key → whoami) ──
  if (p === "/auth/magic-link" && req.method === "POST") {
    const body = await readBody(req);
    const parsed = body ? JSON.parse(body) : {};
    state.lastInvite = {
      email: parsed.email ?? null,
      subject: `@${state.currentHandle} invited you to Grove`,
      body: `${parsed.email ?? "you"} — @${state.currentHandle} shared '${TRAIL.name}' with you.`,
      redirect: parsed.redirect ?? null,
    };
    return sendJson(res, 200, { ok: true });
  }
  if (p === "/auth/exchange" && req.method === "GET") {
    return sendJson(
      res,
      200,
      {
        session_token: "sess-xyz",
        user: { id: "u-trail", email: "member@example.com" },
      },
      { "set-cookie": "grove_session=e2ee2ee2ee2e; Path=/; HttpOnly" },
    );
  }
  if (p === "/keys" && req.method === "POST") {
    const body = await readBody(req);
    const parsed = body ? JSON.parse(body) : {};
    const isTrailKey = typeof parsed.trail_id === "string" && parsed.trail_id.length > 0;
    return sendJson(res, 200, {
      token: isTrailKey ? "grove_live_trail_key" : "grove_live_owner_key",
    });
  }
  if (p === "/v1/whoami" && req.method === "GET") {
    const auth = req.headers.authorization ?? "";
    const isTrail = auth.includes("grove_live_trail_key");
    return sendJson(res, 200, {
      key_id: isTrail ? "k-trail" : "k-owner",
      key_name: isTrail ? "grove-www-trail" : "grove-www-owner",
      scopes: ["read"],
      vault_id: "v1",
      trail: isTrail ? { id: TRAIL.id, name: TRAIL.name } : null,
      role: isTrail ? "member" : "owner",
    });
  }

  // ── Current user profile / handle change ──
  if (p === "/v1/me" && req.method === "GET") {
    return sendJson(res, 200, {
      id: "u-owner",
      username: state.currentHandle,
      handle: state.currentHandle,
      email: "owner@example.com",
      role: "owner",
      display_name: "John M",
      bio: "Builds calm systems.",
      trails: [
        { id: TRAIL.id, name: TRAIL.name, description: TRAIL.description },
      ],
      keys: [],
      sessions: [],
    });
  }
  if (p === "/v1/me" && req.method === "PATCH") {
    const body = await readBody(req);
    const parsed = body ? JSON.parse(body) : {};
    if (typeof parsed.handle === "string" && parsed.handle !== state.currentHandle) {
      state.releasedHandles.add(state.currentHandle);
      state.currentHandle = parsed.handle;
    }
    return sendJson(res, 200, {
      id: "u-owner",
      username: state.currentHandle,
      handle: state.currentHandle,
    });
  }

  // ── Recent notes list (empty is fine for /home render) ──
  if (p === "/v1/list" && req.method === "GET") {
    return sendJson(res, 200, { entries: [] });
  }

  // ── Default: empty but valid ──
  sendJson(res, 200, {});
});

server.listen(PORT, () => {
  console.log(`[multi-resident-mock-api] listening on :${PORT}`);
});
