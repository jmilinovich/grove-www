const GITHUB_URL = "https://github.com/jmilinovich/grove";
const WAITLIST_URL = "#waitlist";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <Nav />
      <main className="w-full">
        <Hero />
        <TheLoop />
        <TheGraph />
        <Groves />
        <Discovery />
        <Deploy />
        <TheKarpathyMoment />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ─── Nav ─── */

function Nav() {
  return (
    <nav className="w-full max-w-5xl mx-auto flex items-center justify-between px-6 py-6 text-sm">
      <span className="text-foreground font-bold tracking-tight text-base">
        grove<span className="text-accent">.</span>md
      </span>
      <div className="flex items-center gap-6 text-muted">
        <a href={GITHUB_URL} className="hover:text-foreground transition-colors">
          GitHub
        </a>
        <a
          href={WAITLIST_URL}
          className="text-accent hover:text-green-300 transition-colors font-medium"
        >
          Early access
        </a>
      </div>
    </nav>
  );
}

/* ─── Hero ─── */

function Hero() {
  return (
    <section className="pt-28 pb-20 sm:pt-40 sm:pb-28 px-6 max-w-5xl mx-auto">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight max-w-3xl fade-up">
        You talk.
        <br />
        A knowledge graph
        <br />
        grows around you.
      </h1>

      <p className="mt-8 text-lg text-muted max-w-xl leading-relaxed fade-up delay-1">
        Grove turns your conversations into a living, connected knowledge base.
        No filing. No organizing. Just talk to your AI &mdash; from any device &mdash;
        and the graph builds itself.
      </p>

      <div className="mt-10 flex flex-wrap gap-4 fade-up delay-2">
        <a
          href={WAITLIST_URL}
          className="inline-flex items-center bg-accent text-background px-7 py-3.5 text-sm font-bold hover:bg-green-300 transition-colors"
        >
          Get early access
        </a>
        <a
          href={GITHUB_URL}
          className="inline-flex items-center border border-surface-border px-7 py-3.5 text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
        >
          Self-host &rarr;
        </a>
      </div>
    </section>
  );
}

/* ─── The Loop ─── */

function TheLoop() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-12">
        How it works
      </p>

      <div className="max-w-2xl space-y-16">
        {/* Step 1: Talk */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-accent text-xs font-bold">01</span>
            <span className="text-lg font-medium">You talk to your AI</span>
          </div>
          <div className="border-l border-surface-border pl-5 space-y-3">
            <p className="text-sm text-muted">
              Voice memo on your phone. A quick thought in Claude. A long
              conversation in Cursor. It doesn&apos;t matter where.
            </p>
            <div className="bg-surface border border-surface-border p-4 text-sm">
              <p className="text-foreground">
                &quot;I just realized the pattern &mdash; every design system is
                really a parametric space. The tokens are dimensions, the
                constraints are the manifold...&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Harvest */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-accent text-xs font-bold">02</span>
            <span className="text-lg font-medium">Grove harvests the knowledge</span>
          </div>
          <div className="border-l border-surface-border pl-5 space-y-3">
            <p className="text-sm text-muted">
              Concepts extracted. People identified. Ideas linked to existing
              notes. Everything validated, committed to git, and indexed &mdash;
              automatically.
            </p>
            <div className="bg-surface border border-surface-border p-4 text-xs text-muted font-mono space-y-1">
              <p>
                <span className="text-accent">+</span> Concepts/Parametric Design Spaces.md{" "}
                <span className="text-muted/50">&larr; new concept</span>
              </p>
              <p>
                <span className="text-accent">~</span> Concepts/Design Systems.md{" "}
                <span className="text-muted/50">&larr; linked</span>
              </p>
              <p>
                <span className="text-accent">~</span> Concepts/Design Tokens.md{" "}
                <span className="text-muted/50">&larr; linked</span>
              </p>
              <p>
                <span className="text-muted/40">git commit: grove (claude-ai): harvest from conversation</span>
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Remember */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-accent text-xs font-bold">03</span>
            <span className="text-lg font-medium">Every surface remembers</span>
          </div>
          <div className="border-l border-surface-border pl-5 space-y-3">
            <p className="text-sm text-muted">
              Next conversation &mdash; phone, laptop, web, any MCP client &mdash;
              your AI already knows. The concept exists. The connections are wired.
              You never repeat yourself.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-16 text-sm text-muted max-w-xl">
        The more you talk, the richer the graph gets. Not because you&apos;re
        maintaining it &mdash; because you&apos;re living your life and the
        knowledge accumulates behind you.
      </p>
    </section>
  );
}

/* ─── The Graph ─── */

function TheGraph() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-4">
        What grows
      </p>
      <p className="text-xl sm:text-2xl max-w-2xl leading-snug font-medium mb-6">
        Not a folder of notes. A graph of everything you know &mdash;
        people, concepts, projects, decisions &mdash; all connected.
      </p>

      <div className="bg-surface border border-surface-border p-6 sm:p-8 max-w-2xl mb-6">
        <pre className="text-xs sm:text-sm text-muted leading-relaxed code-block overflow-x-auto">
{`Your vault
├── 847 concepts
│   ├── Design Systems ──── 42 connections
│   ├── Risk Tolerance ──── linked to Financial Plan
│   ├── Resilience ───────── links therapy notes to architecture notes
│   └── ...
├── 156 people
│   └── each linked to concepts, projects, conversations
├── 94 journal entries
│   └── harvested daily → entities extracted → graph grows
└── 4,528 connections
    └── the part that makes it alive`}
        </pre>
      </div>

      <p className="text-sm text-muted max-w-xl">
        A concept about resilience links your systems architecture notes to your
        personal growth notes &mdash; because they&apos;re the same idea applied
        in different domains. The graph sees what folders can&apos;t.
      </p>
    </section>
  );
}

/* ─── Groves ─── */

function Groves() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-amber text-xs tracking-[0.2em] uppercase mb-4">
        Coming soon
      </p>
      <p className="text-xl sm:text-2xl max-w-2xl leading-snug font-medium mb-6">
        Share a grove &mdash; a shaped window into your knowledge.
      </p>

      <div className="max-w-xl space-y-4 text-sm text-muted leading-relaxed">
        <p>
          A grove is a topic-scoped, permission-controlled slice of your graph.
          Share your AI research with a colleague. Your recipes with a friend.
          Your architecture decisions with your team.
        </p>
        <p>
          They connect their Claude to your grove. An LLM judge filters every
          response server-side &mdash; they see exactly what you choose to share,
          nothing more. Your journal stays yours. Your health notes stay private.
          The boundaries are enforced by the server, not by trust.
        </p>
        <p className="text-foreground">
          Your knowledge becomes a resource other people&apos;s AIs can draw from.
        </p>
      </div>
    </section>
  );
}

/* ─── Discovery ─── */

function Discovery() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-amber text-xs tracking-[0.2em] uppercase mb-4">
        Coming soon
      </p>
      <p className="text-xl sm:text-2xl max-w-2xl leading-snug font-medium mb-6">
        The graph grows while you sleep.
      </p>

      <div className="max-w-xl space-y-4 text-sm text-muted leading-relaxed">
        <p>
          A background loop watches for new notes, changed notes, saved bookmarks.
          For each one: extract concepts, check if they exist, create if not,
          wire the links, surface surprising connections.
        </p>
        <p>
          You wake up and the garden has tended itself. New concepts
          were planted overnight. Orphan notes found their neighbors. A bookmark
          you saved last week got linked to an idea from three years ago.
        </p>
        <p>
          Every autonomous action is a git commit. Every run has a blast radius
          limit. Rollback to any point. The vault is sacred &mdash; discovery
          is a careful gardener, not an unsupervised lawnmower.
        </p>
      </div>
    </section>
  );
}

/* ─── Deploy ─── */

function Deploy() {
  return (
    <section id="deploy" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-4">
        Your vault, your choice
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        <div className="deploy-card border border-accent/40 bg-accent-dim/10 p-6 flex flex-col gap-3">
          <p className="text-xs text-accent font-bold uppercase tracking-wider">
            Hosted
          </p>
          <p className="text-sm text-muted flex-1">
            Connect your GitHub repo. Get an MCP endpoint. We handle search,
            embeddings, and infrastructure.
          </p>
          <a
            href={WAITLIST_URL}
            className="text-sm text-accent hover:text-green-300 transition-colors font-medium"
          >
            Get early access &rarr;
          </a>
        </div>

        <div className="deploy-card border border-surface-border p-6 flex flex-col gap-3">
          <p className="text-xs text-foreground font-bold uppercase tracking-wider">
            Self-hosted
          </p>
          <p className="text-sm text-muted flex-1">
            Your server, your data. MIT licensed. Self-hosted embeddings &mdash;
            nothing leaves your infrastructure.
          </p>
          <a
            href={GITHUB_URL}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            View on GitHub &rarr;
          </a>
        </div>

        <div className="deploy-card border border-surface-border p-6 flex flex-col gap-3">
          <p className="text-xs text-foreground font-bold uppercase tracking-wider">
            Enterprise
          </p>
          <p className="text-sm text-muted flex-1">
            On-prem or private cloud. SSO, SLA, dedicated support.
          </p>
          <a
            href="mailto:hello@grove.md"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Contact us &rarr;
          </a>
        </div>
      </div>

      <p className="text-xs text-muted mt-6 max-w-xl">
        Same API, same MCP protocol, same privacy guarantees across all deployment modes.
        Works with Claude, ChatGPT, Cursor, and any MCP-compatible client.
      </p>
    </section>
  );
}

/* ─── The Karpathy Moment ─── */

function TheKarpathyMoment() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <div className="max-w-2xl">
        <blockquote className="border-l-2 border-muted pl-5 text-muted leading-relaxed">
          <p className="text-lg">
            &quot;I think there is room here for an incredible new product
            instead of a hacky collection of scripts.&quot;
          </p>
          <footer className="mt-3 text-sm">
            &mdash; Andrej Karpathy, April 2026
          </footer>
        </blockquote>

        <div className="mt-8 text-sm text-muted leading-relaxed space-y-3">
          <p>
            Karpathy described a workflow where LLMs compile raw documents into
            structured wikis. That works for research collections.
          </p>
          <p>
            But most people don&apos;t start with a pile of papers. They start with
            years of notes, journal entries, and ideas scattered across conversations.
            They need something that meets them where they are &mdash; not a compiler,
            but a living system that grows with them.
          </p>
          <p className="text-foreground">
            24 Obsidian MCP servers tried to bridge this gap. All local-only.
            All read-only. All treat your vault as flat files.
          </p>
          <p>
            Grove is remote, bidirectional, and graph-aware. It doesn&apos;t just
            search your notes &mdash; it understands how they connect, writes back
            with validation, and works from every device you own.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Bottom CTA ─── */

function BottomCTA() {
  return (
    <section
      id="waitlist"
      className="py-28 px-6 max-w-5xl mx-auto border-t border-surface-border"
    >
      <div className="max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Stop explaining yourself from scratch.
        </h2>
        <p className="mt-3 text-muted">
          You talk. The graph grows. Every conversation makes the next one better.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={WAITLIST_URL}
            className="inline-flex items-center bg-accent text-background px-7 py-3.5 text-sm font-bold hover:bg-green-300 transition-colors"
          >
            Get early access
          </a>
          <a
            href={GITHUB_URL}
            className="inline-flex items-center border border-surface-border px-7 py-3.5 text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
          >
            Self-host now &rarr;
          </a>
        </div>

        <p className="mt-6 text-xs text-muted">
          Open source &middot; MIT licensed &middot; Privacy-first &middot; Git-native
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ─── */

function Footer() {
  return (
    <footer className="w-full max-w-5xl mx-auto px-6 py-8 border-t border-surface-border flex items-center justify-between text-xs text-muted">
      <span>
        grove<span className="text-accent">.</span>md
      </span>
      <div className="flex gap-6">
        <a href={GITHUB_URL} className="hover:text-foreground transition-colors">
          GitHub
        </a>
        <span>MIT</span>
      </div>
    </footer>
  );
}
