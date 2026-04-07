const GITHUB_URL = "https://github.com/jmilinovich/grove";
const WAITLIST_URL = "#waitlist";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <Nav />
      <main className="w-full">
        <Hero />
        <TheProblem />
        <HowItWorks />
        <WhatGrows />
        <Groves />
        <Discovery />
        <Deploy />
        <WhyNow />
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
        Your notes and your AI,
        <br />
        finally connected.
      </h1>

      <p className="mt-8 text-lg text-muted max-w-xl leading-relaxed fade-up delay-1">
        You take notes. You journal. You save ideas. Then you talk to your AI
        and it knows none of it. Grove connects them &mdash; your AI reads your
        notes, writes back, and the knowledge grows together.
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

/* ─── The Problem ─── */

function TheProblem() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <div className="max-w-2xl space-y-6">
        <p className="text-muted text-xs tracking-[0.2em] uppercase mb-2">The problem</p>

        <p className="text-xl sm:text-2xl leading-snug font-medium">
          Your notes live in one world. Your AI lives in another.
        </p>

        <p className="text-muted leading-relaxed">
          You have an Obsidian vault, a folder of markdown, years of journal entries.
          Ideas, people, projects &mdash; all written down, some of it connected.
          That&apos;s one world.
        </p>

        <p className="text-muted leading-relaxed">
          Then you open Claude on your phone. Or ChatGPT on the web. Or Cursor
          in your editor. It has no idea what you&apos;ve been thinking about. Every
          conversation starts from zero. That&apos;s the other world.
        </p>

        <p className="text-foreground leading-relaxed">
          They should be the same world.
        </p>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */

function HowItWorks() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-12">
        How it works
      </p>

      <div className="max-w-2xl space-y-16">
        {/* Connect */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-accent text-xs font-bold">01</span>
            <span className="text-lg font-medium">Connect your vault</span>
          </div>
          <div className="border-l border-surface-border pl-5">
            <p className="text-sm text-muted leading-relaxed">
              Point Grove at your Obsidian vault, markdown folder, or git repo.
              It indexes everything &mdash; your notes, your frontmatter, your
              wikilinks &mdash; and gives you an MCP endpoint. Add that URL to
              Claude, ChatGPT, Cursor, or any MCP client.
            </p>
          </div>
        </div>

        {/* Read */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-accent text-xs font-bold">02</span>
            <span className="text-lg font-medium">Your AI reads your notes</span>
          </div>
          <div className="border-l border-surface-border pl-5 space-y-4">
            <p className="text-sm text-muted leading-relaxed">
              Ask a question and your AI searches your vault &mdash; keyword
              and semantic search fused together in under 30ms. It finds
              the right notes, follows the links between them, and answers
              with your own context.
            </p>
            <div className="bg-surface border border-surface-border p-4 text-sm">
              <p className="text-foreground">
                &quot;What do I know about design systems?&quot;
              </p>
              <p className="text-muted mt-2 text-xs">
                <span className="text-accent">found</span>{" "}
                3 concept notes, 2 journal entries, linked to 14 other
                ideas in your vault &mdash; 23ms
              </p>
            </div>
          </div>
        </div>

        {/* Write back */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-accent text-xs font-bold">03</span>
            <span className="text-lg font-medium">Your AI writes back</span>
          </div>
          <div className="border-l border-surface-border pl-5 space-y-4">
            <p className="text-sm text-muted leading-relaxed">
              When you discover something new in a conversation, your AI can
              save it directly to your vault. New concepts, updated notes,
              extracted entities. Every write is validated against your vault&apos;s
              structure and committed to git.
            </p>
            <div className="bg-surface border border-surface-border p-4 text-xs text-muted font-mono space-y-1">
              <p>
                <span className="text-accent">+</span> Concepts/Context Engineering.md
              </p>
              <p>
                <span className="text-accent">~</span> Concepts/Design Systems.md{" "}
                <span className="text-muted/50">&larr; new link added</span>
              </p>
              <p className="text-muted/40">
                git commit: grove (claude-ai): create Context Engineering
              </p>
            </div>
          </div>
        </div>

        {/* Compound */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-accent text-xs font-bold">04</span>
            <span className="text-lg font-medium">Knowledge compounds</span>
          </div>
          <div className="border-l border-surface-border pl-5">
            <p className="text-sm text-muted leading-relaxed">
              Next conversation &mdash; any device, any client &mdash; your AI
              already knows. The note exists. The links are wired. You never
              explain the same thing twice. The more you use it, the more
              it knows.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── What Grows ─── */

function WhatGrows() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-4">
        What grows
      </p>
      <p className="text-xl sm:text-2xl max-w-2xl leading-snug font-medium mb-6">
        Not a folder of files. A graph of connected ideas.
      </p>

      <div className="bg-surface border border-surface-border p-6 sm:p-8 max-w-2xl mb-6">
        <pre className="text-xs sm:text-sm text-muted leading-relaxed code-block overflow-x-auto">
{`Your vault
├── concepts
│   ├── Design Systems ──── linked to 42 other notes
│   ├── Risk Tolerance ──── linked to Financial Plan, journal entries
│   └── Resilience ───────── bridges architecture and personal notes
├── people
│   └── each linked to concepts, projects, conversations
├── journal entries
│   └── entities extracted, wikilinks wired automatically
└── 4,500+ connections
    └── the graph sees what folders can't`}</pre>
      </div>

      <div className="max-w-xl space-y-3 text-sm text-muted leading-relaxed">
        <p>
          Your notes aren&apos;t isolated files. They&apos;re nodes in a graph.
          A concept about resilience might link your engineering notes to your
          personal journal &mdash; because the same idea shows up in both places.
          Your AI can follow those connections.
        </p>
        <p>
          Every note has structured frontmatter. Every link is a real relationship.
          Grove understands your vault&apos;s conventions &mdash; types, tags, folder
          structure &mdash; and enforces them on every write. Agents can&apos;t
          corrupt what you&apos;ve built.
        </p>
      </div>
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
        Share a grove &mdash; a window into your knowledge.
      </p>

      <div className="max-w-xl space-y-4 text-sm text-muted leading-relaxed">
        <p>
          A grove is a topic-scoped slice of your vault with permission controls.
          Share your research notes with a colleague. Your recipes with a friend.
          Your architecture decisions with your team.
        </p>
        <p>
          They connect their AI to your grove. An LLM judge filters every response
          server-side &mdash; they see exactly what you choose to share, nothing more.
          Your private notes stay private. The boundaries are enforced by the server,
          not by trust.
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
          A background loop watches for new and changed notes. It extracts
          concepts, identifies people, wires links between related ideas,
          and surfaces surprising connections &mdash; all automatically.
        </p>
        <p>
          Save a bookmark. Write a journal entry. Drop a file in your vault.
          By the next morning, it&apos;s been integrated into the graph, linked
          to what&apos;s already there, ready for your AI to use.
        </p>
        <p>
          Every autonomous action is a git commit with a blast radius limit.
          Rollback to any point. The vault is sacred &mdash; discovery is a
          careful gardener, not an unsupervised lawnmower.
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
        Same API, same MCP protocol across all modes.
        Works with Claude, ChatGPT, Cursor, and any MCP client.
      </p>
    </section>
  );
}

/* ─── Why Now ─── */

function WhyNow() {
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
            structured wikis. That works for research collections. But most people
            don&apos;t start with a pile of papers &mdash; they start with notes
            they&apos;ve already been taking.
          </p>
          <p>
            There are 24 Obsidian MCP servers on the registry. Every one is
            local-only, read-only, and treats your vault as a bag of text files.
            They work from your laptop. Open Claude on your phone &mdash; nothing.
          </p>
          <p className="text-foreground">
            Grove is remote, bidirectional, and vault-aware. It doesn&apos;t just
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
          Your AI should know what you know.
        </h2>
        <p className="mt-3 text-muted">
          Connect your notes. Every conversation gets better.
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
