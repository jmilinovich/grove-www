const GITHUB_URL = "https://github.com/jmilinovich/grove";
const WAITLIST_URL = "#waitlist";

/* ─── Page ─── */

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <Nav />
      <main className="w-full">
        <Hero />
        <Pulse />
        <TheShift />
        <WhatItFeelsLike />
        <TheGraph />
        <HowItGrows />
        <Deploy />
        <Groves />
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
    <section className="pt-28 pb-8 sm:pt-40 sm:pb-12 px-6 max-w-5xl mx-auto">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight max-w-3xl fade-up">
        Your AI should know
        <br />
        who you are.
      </h1>

      <p className="mt-8 text-lg text-muted max-w-xl leading-relaxed fade-up delay-1">
        Not just on your laptop. On your phone. On the web. In every conversation,
        with every client. Your knowledge, always there.
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

/* ─── Pulse — the vault is alive ─── */

function Pulse() {
  return (
    <div className="px-6 max-w-5xl mx-auto pt-12 pb-20 fade-up delay-3">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted font-mono">
        <span>
          <span className="text-accent">111</span> seeds
        </span>
        <span>
          <span className="text-foreground">300</span> sprouts
        </span>
        <span>
          <span className="text-foreground">360</span> growing
        </span>
        <span className="text-muted/60">
          1,284 notes &middot; 4,528 connections
        </span>
      </div>
    </div>
  );
}

/* ─── The Shift ─── */

function TheShift() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <div className="max-w-2xl space-y-6 text-muted leading-relaxed">
        <p className="text-foreground text-xl sm:text-2xl leading-snug font-medium">
          You open Claude on your phone and it has
          no idea who you are.
        </p>

        <p>
          You&apos;ve spent years building a knowledge system. Concepts connected to
          people connected to decisions connected to journal entries. A graph
          of everything you think about.
        </p>

        <p>
          Then you switch devices and it&apos;s gone. Every connection, every
          context &mdash; evaporated. You&apos;re explaining yourself from scratch
          to an AI that knew you five minutes ago.
        </p>

        <p className="text-foreground">
          Grove is the bridge. Connect your vault once.
          Your AI remembers &mdash; from every surface, in every conversation.
        </p>
      </div>
    </section>
  );
}

/* ─── What It Feels Like ─── */

function WhatItFeelsLike() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-12">
        What it feels like
      </p>

      <div className="space-y-12 max-w-2xl">
        {/* Conversation 1 */}
        <div>
          <p className="text-xs text-muted mb-3">On your phone, mid-conversation</p>
          <div className="border-l border-surface-border pl-5 space-y-4">
            <p className="text-foreground">
              &quot;What was that idea I was developing about how design preferences
              spread through networks?&quot;
            </p>
            <div className="text-sm text-muted space-y-1">
              <p>
                <span className="text-accent text-xs">found</span>{" "}
                Preference Propagation &mdash; a concept you&apos;ve been developing
                since 2018. It connects to{" "}
                <span className="text-foreground">
                  graph theory, social dynamics, recommendation systems
                </span>
                , and 12 other notes in your vault.
              </p>
            </div>
          </div>
        </div>

        {/* Conversation 2 */}
        <div>
          <p className="text-xs text-muted mb-3">Later, on your laptop</p>
          <div className="border-l border-surface-border pl-5 space-y-4">
            <p className="text-foreground">
              &quot;I&apos;m working through a big career decision.
              What context do I have on this?&quot;
            </p>
            <div className="text-sm text-muted space-y-1">
              <p>
                Your vault has a financial plan, three journal entries
                about what matters to you, a note on risk tolerance, and
                a concept note about what &quot;meaningful work&quot; means &mdash;
                all linked together.
              </p>
              <p className="text-muted/70 text-xs mt-2">
                Claude holds the full picture &mdash; the numbers and the
                values &mdash; because the graph connects them.
              </p>
            </div>
          </div>
        </div>

        {/* Conversation 3 */}
        <div>
          <p className="text-xs text-muted mb-3">
            From any surface, any time
          </p>
          <div className="border-l border-surface-border pl-5 space-y-4">
            <p className="text-foreground">
              &quot;This idea about context engineering is
              important. Save it.&quot;
            </p>
            <div className="text-sm text-muted space-y-1">
              <p>
                <span className="text-accent text-xs">planted</span>{" "}
                Concepts/Context Engineering.md &mdash; validated,
                committed, indexed. Next conversation, any device, it&apos;s there.
                The knowledge compounds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── The Graph ─── */

function TheGraph() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-4">
        Not files. A graph.
      </p>
      <p className="text-xl sm:text-2xl max-w-2xl leading-snug font-medium mb-12">
        Your notes aren&apos;t a folder of documents.
        They&apos;re a web of everything you know.
      </p>

      <div className="bg-surface border border-surface-border p-6 sm:p-8 max-w-2xl">
        <pre className="text-xs sm:text-sm text-muted leading-relaxed code-block overflow-x-auto">
{`Distributed Systems
├── [[Event Sourcing]]             42 connections
├── [[CQRS]]
├── [[Martin Fowler]]
├── [[Resilience Patterns]]        31 connections
│   ├── [[Circuit Breakers]]
│   ├── [[Bulkhead Isolation]]
│   └── [[Backpressure]]
├── [[Previous Startup]]           67 connections
│   └── [[Post-Mortem: The Outage]]
└── [[Current Architecture]]
    └── [[Migration Plan]]         18 connections`}
        </pre>
      </div>

      <p className="text-sm text-muted mt-6 max-w-xl">
        One concept, linked to people, projects, and ideas
        spanning years. Walk the connections and reconstruct how
        the thinking evolved. That&apos;s what your AI has access to.
      </p>
    </section>
  );
}

/* ─── How It Grows ─── */

function HowItGrows() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-4">
        A grove, not a database
      </p>
      <p className="text-xl sm:text-2xl max-w-2xl leading-snug font-medium mb-12">
        Knowledge isn&apos;t stored. It&apos;s cultivated.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-surface-border max-w-xl">
        {[
          { stage: "forage", desc: "Capture from the wild" },
          { stage: "plant", desc: "Create structured notes" },
          { stage: "harvest", desc: "Extract entities, wire links" },
          { stage: "tend", desc: "Prune, repair, maintain" },
          { stage: "grow", desc: "Ideas deepen over time" },
          { stage: "wander", desc: "Discover surprising connections" },
        ].map((s) => (
          <div key={s.stage} className="bg-surface p-5">
            <p className="text-accent text-sm font-bold">{s.stage}</p>
            <p className="text-xs text-muted mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-xl text-sm text-muted leading-relaxed space-y-3">
        <p>
          Every write is a git commit. Every note has frontmatter that&apos;s validated
          before it touches your vault. Agents can&apos;t corrupt what you&apos;ve built.
        </p>
        <p>
          Search runs in under 30ms &mdash; BM25 keyword matching fused with
          vector embeddings, all self-hosted. Your data never leaves your
          infrastructure.
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
        Choose your path
      </p>
      <p className="text-xl max-w-lg mb-12">
        Same API. Same tools. Same privacy. Your vault, your choice.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        {/* Hosted */}
        <div className="deploy-card border border-accent/40 bg-accent-dim/10 p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs text-accent font-bold uppercase tracking-wider mb-1">
              Hosted
            </p>
            <p className="text-sm text-muted">
              Connect your GitHub repo. We handle the rest.
            </p>
          </div>
          <a
            href={WAITLIST_URL}
            className="mt-auto text-sm text-accent hover:text-green-300 transition-colors font-medium"
          >
            Get early access &rarr;
          </a>
        </div>

        {/* Self-hosted */}
        <div className="deploy-card border border-surface-border p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs text-foreground font-bold uppercase tracking-wider mb-1">
              Self-hosted
            </p>
            <p className="text-sm text-muted">
              Your server, your data. MIT licensed, runs on any VPS.
            </p>
          </div>
          <a
            href={GITHUB_URL}
            className="mt-auto text-sm text-muted hover:text-foreground transition-colors"
          >
            View on GitHub &rarr;
          </a>
        </div>

        {/* Enterprise */}
        <div className="deploy-card border border-surface-border p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs text-foreground font-bold uppercase tracking-wider mb-1">
              Enterprise
            </p>
            <p className="text-sm text-muted">
              On-prem or private cloud. SSO, SLA, dedicated support.
            </p>
          </div>
          <a
            href="mailto:hello@grove.md"
            className="mt-auto text-sm text-muted hover:text-foreground transition-colors"
          >
            Contact us &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Groves ─── */

function Groves() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <div className="max-w-xl">
        <p className="text-amber text-xs tracking-[0.2em] uppercase mb-4">
          Coming soon
        </p>
        <p className="text-xl font-medium mb-4">
          Share a grove.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          A grove is a scoped window into your knowledge. Share your AI research
          with a colleague. Your recipes with a friend. Topic-controlled,
          permission-gated, filtered server-side. They connect their Claude to your
          grove and get exactly what you choose to share &mdash; nothing more.
        </p>
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
          Stop starting from zero.
        </h2>
        <p className="mt-3 text-muted">
          Your AI should know who you are. Give it a grove.
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
          Open source &middot; MIT licensed &middot; Works with Claude, ChatGPT, Cursor, any MCP client
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
