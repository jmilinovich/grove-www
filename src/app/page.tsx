const GITHUB_URL = "https://github.com/jmilinovich/grove";

const tools = [
  {
    name: "query",
    desc: "Hybrid search across your vault. BM25 + vector fusion, ~30ms. Returns ranked snippets with context.",
    icon: "?",
  },
  {
    name: "get",
    desc: "Read a note by path. Returns full markdown with frontmatter, backlinks, and outlinks.",
    icon: ">",
  },
  {
    name: "multi_get",
    desc: "Batch read up to 10 notes. Follow a thread of linked ideas in one call.",
    icon: ">>",
  },
  {
    name: "write_note",
    desc: "Create or update notes with validation, frontmatter enforcement, and automatic git commit.",
    icon: "+",
  },
  {
    name: "vault_status",
    desc: "Lifecycle overview: note counts by type, recent changes, growth patterns, stale areas.",
    icon: "#",
  },
  {
    name: "list_notes",
    desc: "Browse vault structure. Filter by type, path prefix, or modification date.",
    icon: "/",
  },
];

const comparisons = [
  {
    label: "Works from phone",
    grove: true,
    others: false,
    detail: "Remote API vs local filesystem",
  },
  {
    label: "Write-back",
    grove: true,
    others: "Some",
    detail: "Validated writes + git commit",
  },
  {
    label: "Hybrid search",
    grove: true,
    others: false,
    detail: "BM25 + vector, not just file glob",
  },
  {
    label: "Graph analysis",
    grove: true,
    others: false,
    detail: "Centrality, clusters, lifecycle",
  },
  {
    label: "Self-hosted embeddings",
    grove: true,
    others: false,
    detail: "Your data never leaves your server",
  },
  {
    label: "Works with any MCP client",
    grove: true,
    others: "Some",
    detail: "Claude, ChatGPT, Cursor, etc.",
  },
];

function Check() {
  return <span className="text-accent">&#10003;</span>;
}
function Cross() {
  return <span className="text-muted">&#10005;</span>;
}
function Partial() {
  return <span className="text-yellow-600">~</span>;
}

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* ─── NAV ─── */}
      <nav className="w-full max-w-5xl flex items-center justify-between px-6 py-6 text-sm text-muted">
        <span className="text-foreground font-bold tracking-tight">
          grove<span className="text-accent">.</span>md
        </span>
        <a
          href={GITHUB_URL}
          className="hover:text-foreground transition-colors"
        >
          GitHub &rarr;
        </a>
      </nav>

      <main className="w-full max-w-5xl px-6">
        {/* ─── HERO ─── */}
        <section className="pt-20 pb-24 sm:pt-32 sm:pb-32">
          <p className="text-accent text-sm mb-6 tracking-widest uppercase">
            MCP server for Obsidian
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] tracking-tight max-w-3xl">
            your knowledge,
            <br />
            everywhere your AI is.
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-muted max-w-2xl leading-relaxed">
            Give your AI a persistent memory that works from every surface
            &mdash; phone, laptop, web, terminal. One vault. Every client.
          </p>
          <div className="mt-10 flex gap-4">
            <a
              href={GITHUB_URL}
              className="inline-flex items-center gap-2 bg-accent text-background px-6 py-3 text-sm font-bold hover:bg-green-300 transition-colors"
            >
              Connect your vault
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-surface-border px-6 py-3 text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
            >
              How it works
            </a>
          </div>
        </section>

        {/* ─── THE PROBLEM ─── */}
        <section className="py-16 border-t border-surface-border">
          <div className="max-w-2xl">
            <p className="text-muted text-sm mb-4 tracking-widest uppercase">
              The problem
            </p>
            <p className="text-xl leading-relaxed">
              You open Claude on your phone and it has no idea who you are.
              Every concept, every connection &mdash; gone. You&apos;re starting
              from zero in every conversation that isn&apos;t on your one
              machine.
            </p>
            <p className="mt-4 text-muted leading-relaxed">
              Your knowledge lives in an Obsidian vault on your laptop. 24
              existing MCP servers can connect it &mdash; but only locally. Move
              to your phone, the web, a different machine? Your AI is amnesiac
              again.
            </p>
          </div>
        </section>

        {/* ─── ARCHITECTURE ─── */}
        <section id="how-it-works" className="py-16 border-t border-surface-border">
          <p className="text-muted text-sm mb-8 tracking-widest uppercase">
            Architecture
          </p>
          <div className="bg-surface border border-surface-border p-6 sm:p-10 overflow-x-auto">
            <pre className="ascii-diagram text-xs sm:text-sm text-muted leading-relaxed">
              {`┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Claude    │     │   ChatGPT   │     │   Cursor    │
│  (phone)    │     │   (web)     │     │  (laptop)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    │  `}
              <span className="text-accent font-bold">grove.md</span>
              {`    │
                    │             │
                    │  MCP server │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
        │  hybrid   │ │  git  │ │   graph   │
        │  search   │ │ sync  │ │  analysis │
        └─────┬─────┘ └───┬───┘ └─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────┴──────┐
                    │  Obsidian   │
                    │   vault     │
                    │  (git repo) │
                    └─────────────┘`}
            </pre>
          </div>
        </section>

        {/* ─── TOOLS ─── */}
        <section className="py-16 border-t border-surface-border">
          <p className="text-muted text-sm mb-2 tracking-widest uppercase">
            6 tools
          </p>
          <p className="text-xl mb-10 max-w-2xl">
            Carefully designed, not kitchen-sink. Each tool does one thing well.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-surface-border">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="bg-surface p-6 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-accent text-lg font-bold w-6 text-center">
                    {tool.icon}
                  </span>
                  <code className="text-sm text-foreground">{tool.name}</code>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── THE GARDEN ─── */}
        <section className="py-16 border-t border-surface-border">
          <p className="text-muted text-sm mb-2 tracking-widest uppercase">
            The lifecycle
          </p>
          <p className="text-xl mb-10 max-w-2xl">
            Knowledge isn&apos;t static. Grove tracks the lifecycle of every
            note &mdash; from raw capture to mature concept.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { verb: "forage", desc: "capture from the wild" },
              { verb: "plant", desc: "create structured notes" },
              { verb: "harvest", desc: "extract entities + links" },
              { verb: "garden", desc: "daily practice" },
              { verb: "tend", desc: "prune + maintain" },
              { verb: "wander", desc: "discover connections" },
            ].map((stage) => (
              <div
                key={stage.verb}
                className="bg-surface border border-surface-border px-4 py-3 flex flex-col"
              >
                <span className="text-accent text-sm font-bold">
                  {stage.verb}
                </span>
                <span className="text-xs text-muted mt-1">{stage.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── COMPARISON ─── */}
        <section className="py-16 border-t border-surface-border">
          <p className="text-muted text-sm mb-2 tracking-widest uppercase">
            Why not the 24 existing ones?
          </p>
          <p className="text-xl mb-10 max-w-lg">
            They&apos;re local-only file readers. Grove is a knowledge API.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-surface-border">
                  <th className="pb-3 pr-8 font-normal">Feature</th>
                  <th className="pb-3 pr-8 font-normal">
                    <span className="text-accent">Grove</span>
                  </th>
                  <th className="pb-3 pr-8 font-normal">Others</th>
                  <th className="pb-3 font-normal hidden sm:table-cell">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-surface-border"
                  >
                    <td className="py-3 pr-8">{row.label}</td>
                    <td className="py-3 pr-8">
                      {row.grove === true ? <Check /> : <Cross />}
                    </td>
                    <td className="py-3 pr-8">
                      {row.others === true ? (
                        <Check />
                      ) : row.others === false ? (
                        <Cross />
                      ) : (
                        <Partial />
                      )}
                    </td>
                    <td className="py-3 text-muted hidden sm:table-cell">
                      {row.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── SELF-HOST ─── */}
        <section className="py-16 border-t border-surface-border">
          <div className="max-w-2xl">
            <p className="text-muted text-sm mb-2 tracking-widest uppercase">
              Self-hosted, open source
            </p>
            <p className="text-xl mb-6">
              Your vault, your server, your embeddings. Nothing leaves your
              infrastructure.
            </p>
            <div className="bg-surface border border-surface-border p-6">
              <pre className="text-sm text-muted">
                <span className="text-accent">$</span> git clone{" "}
                {GITHUB_URL}.git{"\n"}
                <span className="text-accent">$</span> cp .env.example .env
                {"\n"}
                <span className="text-accent">$</span> docker compose up -d
                {"\n"}
                <span className="text-muted/50"># vault synced, search indexed, MCP ready</span>
              </pre>
            </div>
            <p className="mt-6 text-sm text-muted">
              MIT licensed. Runs on any VPS. Self-hosted embeddings via
              sentence-transformers &mdash; your data never touches a third-party
              API.
            </p>
          </div>
        </section>

        {/* ─── SEARCH DEMO ─── */}
        <section className="py-16 border-t border-surface-border">
          <p className="text-muted text-sm mb-8 tracking-widest uppercase">
            Hybrid search in action
          </p>
          <div className="bg-surface border border-surface-border p-6 sm:p-8">
            <pre className="text-xs sm:text-sm text-muted leading-relaxed overflow-x-auto">
              <span className="text-accent">{">"}</span>
              {" query: \"parametric design systems\"\n\n"}
              <span className="text-foreground/60">
                {"  lex:  BM25 over 847 notes      → 12 candidates  (4ms)\n"}
                {"  vec:  cosine similarity          → 15 candidates  (18ms)\n"}
                {"  fuse: reciprocal rank fusion     → 8 results      (1ms)\n"}
              </span>
              {"\n"}
              <span className="text-accent">{"  1."}</span>
              {" Resources/Concepts/Parametric Design.md"}
              <span className="text-muted/50">{" — score: 0.94"}</span>
              {"\n"}
              <span className="text-accent">{"  2."}</span>
              {" Resources/Concepts/Design Systems.md"}
              <span className="text-muted/50">{" — score: 0.87"}</span>
              {"\n"}
              <span className="text-accent">{"  3."}</span>
              {" Journal/2024/2024-01-15.md"}
              <span className="text-muted/50">{" — score: 0.71"}</span>
            </pre>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-24 border-t border-surface-border text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Stop starting from zero.
          </h2>
          <p className="mt-4 text-muted text-lg max-w-lg mx-auto">
            Give your AI the context it&apos;s been missing.
          </p>
          <div className="mt-8">
            <a
              href={GITHUB_URL}
              className="inline-flex items-center gap-2 bg-accent text-background px-8 py-4 text-sm font-bold hover:bg-green-300 transition-colors"
            >
              Get started on GitHub
            </a>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="w-full max-w-5xl px-6 py-8 border-t border-surface-border flex items-center justify-between text-xs text-muted">
        <span>
          grove<span className="text-accent">.</span>md
        </span>
        <div className="flex gap-6">
          <a
            href={GITHUB_URL}
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  );
}
