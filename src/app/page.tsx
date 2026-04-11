const GITHUB_URL = "https://github.com/jmilinovich/grove";
const WAITLIST_URL = "#waitlist";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium">
        Skip to content
      </a>
      <Nav />
      <main id="main" className="w-full">
        <Hero />
        <TheProblem />
        <HowItWorks />
        <TheTools />
        <WhatGrows />
        <Groves />
        <Discovery />
        <Deploy />
        <WhyNow />
        <Comparison />
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
      <span className="font-serif font-medium tracking-tight text-lg text-ink">
        Grove
      </span>
      <div className="flex items-center gap-6 text-ink/50">
        <a href={GITHUB_URL} className="hover:text-ink transition-colors">
          GitHub
        </a>
        <a
          href={WAITLIST_URL}
          className="text-moss hover:text-earth transition-colors font-medium"
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
    <section className="bg-cream pt-28 pb-20 sm:pt-40 sm:pb-28 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight max-w-3xl fade-up font-serif text-ink text-pretty">
          Your notes and your AI,
          <br />
          finally connected.
        </h1>

        <p className="mt-8 text-lg text-ink/60 max-w-xl leading-relaxed fade-up delay-1">
          You take notes. You journal. You save ideas. Then you talk to your AI
          and it knows none of it. Grove connects them &mdash; your AI reads your
          notes, writes back, and the knowledge grows together.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 fade-up delay-2">
          <a
            href={WAITLIST_URL}
            className="inline-flex items-center bg-ink text-cream px-7 py-3.5 text-sm font-bold hover:bg-earth transition-colors active:scale-[0.98]"
          >
            Get early access
          </a>
          <a
            href={GITHUB_URL}
            className="inline-flex items-center border border-ink/20 px-7 py-3.5 text-sm text-ink hover:bg-ink/5 transition-colors active:scale-[0.98]"
          >
            Self-host &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── The Problem ─── */

function TheProblem() {
  return (
    <section aria-label="The problem" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <div className="max-w-2xl space-y-6">
        <p className="text-muted text-xs tracking-[0.2em] uppercase mb-2">The problem</p>

        <h2 className="text-xl sm:text-2xl leading-snug font-serif font-medium text-pretty">
          Your notes live in one world. Your AI lives in another.
        </h2>

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
    <section aria-label="How it works" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-12">
        How it works
      </p>
      <h2 className="sr-only">How it works</h2>

      <div className="max-w-2xl space-y-16">
        {/* Connect */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-moss text-xs font-bold">01</span>
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
            <span className="text-moss text-xs font-bold">02</span>
            <span className="text-lg font-medium">Your AI reads your notes</span>
          </div>
          <div className="border-l border-surface-border pl-5 space-y-4">
            <p className="text-sm text-muted leading-relaxed">
              Ask a question and your AI searches your vault &mdash; keyword
              and semantic search fused together in under 30ms. It finds
              the right notes, follows the links between them, and answers
              with your own context.
            </p>
            <div className="bg-code-bg text-code-fg border border-code-bg/50 p-4 text-sm">
              <p className="text-foreground">
                &quot;What do I know about design systems?&quot;
              </p>
              <p className="text-muted mt-2 text-xs">
                <span className="text-moss">found</span>{" "}
                3 concept notes, 2 journal entries, linked to 14 other
                ideas in your vault &mdash; 23ms
              </p>
            </div>
          </div>
        </div>

        {/* Write back */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-moss text-xs font-bold">03</span>
            <span className="text-lg font-medium">Your AI writes back</span>
          </div>
          <div className="border-l border-surface-border pl-5 space-y-4">
            <p className="text-sm text-muted leading-relaxed">
              When you discover something new in a conversation, your AI can
              save it directly to your vault. New concepts, updated notes,
              extracted entities. Every write is validated against your vault&apos;s
              structure and committed to git.
            </p>
            <div className="bg-code-bg text-code-fg border border-code-bg/50 p-4 text-xs text-muted font-mono space-y-1">
              <p>
                <span className="text-moss">+</span> Concepts/Context Engineering.md
              </p>
              <p>
                <span className="text-moss">~</span> Concepts/Design Systems.md{" "}
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
            <span className="text-moss text-xs font-bold">04</span>
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
    <section aria-label="What grows" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-4">
        What grows
      </p>
      <h2 className="text-xl sm:text-2xl max-w-2xl leading-snug font-serif font-medium mb-6 text-pretty">
        Not a folder of files. A graph of connected ideas.
      </h2>

      <div className="bg-code-bg text-code-fg border border-code-bg/50 p-6 sm:p-8 max-w-2xl mb-6">
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
    <section aria-label="Groves" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-amber text-xs tracking-[0.2em] uppercase mb-4">
        Coming soon
      </p>
      <h2 className="text-xl sm:text-2xl max-w-2xl leading-snug font-serif font-medium mb-6 text-pretty">
        Share a grove &mdash; a window into your knowledge.
      </h2>

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
    <section aria-label="Discovery" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-amber text-xs tracking-[0.2em] uppercase mb-4">
        Coming soon
      </p>
      <h2 className="text-xl sm:text-2xl max-w-2xl leading-snug font-serif font-medium mb-6 text-pretty">
        The graph grows while you sleep.
      </h2>

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
    <section id="deploy" aria-label="Deployment options" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-4">
        Your vault, your choice
      </p>
      <h2 className="sr-only">Deployment options</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        <div className="deploy-card border border-moss/30 bg-moss/5 p-6 flex flex-col gap-3">
          <p className="text-xs text-moss font-bold uppercase tracking-wider">
            Hosted
          </p>
          <p className="text-sm text-muted flex-1">
            Connect your GitHub repo. Get an MCP endpoint. We handle search,
            embeddings, and infrastructure.
          </p>
          <a
            href={WAITLIST_URL}
            className="text-sm text-moss hover:text-earth transition-colors font-medium"
          >
            Get early access &rarr;
          </a>
        </div>

        <div className="deploy-card border border-surface-border p-6 flex flex-col gap-3">
          <p className="text-xs text-ink font-bold uppercase tracking-wider">
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
          <p className="text-xs text-ink font-bold uppercase tracking-wider">
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
    <section aria-label="Why now" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <div className="max-w-2xl">
        <h2 className="sr-only">Why now</h2>
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
      aria-label="Get started"
      className="py-28 px-6 max-w-5xl mx-auto border-t border-surface-border"
    >
      <div className="max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-pretty">
          Your AI should know what you know.
        </h2>
        <p className="mt-3 text-muted">
          Connect your notes. Every conversation gets better.
        </p>

        <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md" action="https://formspree.io/f/placeholder" method="POST">
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            className="flex-1 bg-white border border-ink/10 rounded px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center bg-ink text-cream rounded px-7 py-3 text-sm font-bold hover:bg-earth transition-colors active:scale-[0.98]"
          >
            Get early access
          </button>
        </form>
        <a
          href={GITHUB_URL}
          className="mt-3 inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
        >
          Or self-host now &rarr;
        </a>

        <p className="mt-6 text-xs text-muted">
          Open source &middot; MIT licensed &middot; Privacy-first &middot; Git-native
        </p>
      </div>
    </section>
  );
}

/* ─── The Tools ─── */

function TheTools() {
  const tools = [
    { name: "query", desc: "Hybrid search — keywords and meaning fused together.", example: '"design systems" → 3 concepts, 2 journals, 14 links — 23ms' },
    { name: "get", desc: "Read a note with parsed frontmatter and content hash.", example: 'get("Resilience") → type: concept, 847 words, 12 backlinks' },
    { name: "multi_get", desc: "Batch-read notes by glob pattern or list.", example: '"Resources/Concepts/D*" → Design Systems, Decision Making, ...' },
    { name: "write_note", desc: "Create or update with frontmatter validation and git commit.", example: 'write("Context Engineering") → committed, reindexed, 140ms' },
    { name: "list_notes", desc: "Browse by folder, type, or pattern.", example: '"Resources/People/*" → 84 notes, sorted by modified' },
    { name: "vault_status", desc: "Health, history, diagnostics, graph analysis, lifecycle digest.", example: 'mode: "graph" → 4,500 links, 12 clusters, 3 bridges' },
  ];

  return (
    <section aria-label="The six tools" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-4">The tools</p>
      <h2 className="text-xl sm:text-2xl max-w-2xl leading-snug font-serif font-medium mb-12 text-pretty">
        Six tools. No more. Agents work better with less choice.
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
        {tools.map((tool) => (
          <div key={tool.name} className="space-y-2">
            <p className="text-sm font-medium text-moss font-mono">{tool.name}</p>
            <p className="text-sm text-muted leading-relaxed">{tool.desc}</p>
            <div className="bg-code-bg text-code-fg border border-code-bg/50 p-3 text-xs font-mono text-muted-light">
              {tool.example}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Comparison ─── */

function Comparison() {
  return (
    <section aria-label="Comparison" className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-4">The landscape</p>
      <h2 className="text-xl sm:text-2xl max-w-2xl leading-snug font-serif font-medium mb-8 text-pretty">
        24 Obsidian MCP servers. All local-only.
      </h2>
      <div className="max-w-2xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-surface-border text-muted text-xs uppercase tracking-wider">
              <th className="py-3 pr-6"></th>
              <th className="py-3 pr-6">Others</th>
              <th className="py-3 text-moss">Grove</th>
            </tr>
          </thead>
          <tbody className="text-muted-light">
            <tr className="border-b border-surface-border/50">
              <td className="py-3 pr-6">Works from your phone</td>
              <td className="py-3 pr-6 text-muted">No</td>
              <td className="py-3 text-foreground">Yes</td>
            </tr>
            <tr className="border-b border-surface-border/50">
              <td className="py-3 pr-6">Write-back with validation</td>
              <td className="py-3 pr-6 text-muted">No</td>
              <td className="py-3 text-foreground">Yes</td>
            </tr>
            <tr className="border-b border-surface-border/50">
              <td className="py-3 pr-6">Frontmatter-aware search</td>
              <td className="py-3 pr-6 text-muted">No</td>
              <td className="py-3 text-foreground">Yes</td>
            </tr>
            <tr className="border-b border-surface-border/50">
              <td className="py-3 pr-6">Semantic + keyword hybrid</td>
              <td className="py-3 pr-6 text-muted">Rare</td>
              <td className="py-3 text-foreground">Yes</td>
            </tr>
            <tr className="border-b border-surface-border/50">
              <td className="py-3 pr-6">Git-backed writes</td>
              <td className="py-3 pr-6 text-muted">No</td>
              <td className="py-3 text-foreground">Every write</td>
            </tr>
            <tr>
              <td className="py-3 pr-6">Graph analysis</td>
              <td className="py-3 pr-6 text-muted">No</td>
              <td className="py-3 text-foreground">Centrality, clusters, bridges</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── Footer ─── */

function Footer() {
  return (
    <footer className="w-full max-w-5xl mx-auto px-6 py-8 border-t border-surface-border flex items-center justify-between text-xs text-ink/40">
      <span className="font-serif font-medium text-sm text-ink/60">
        Grove
      </span>
      <div className="flex gap-6">
        <a href={GITHUB_URL} className="hover:text-ink transition-colors">
          GitHub
        </a>
        <span>MIT</span>
      </div>
    </footer>
  );
}
