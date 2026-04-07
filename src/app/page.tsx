const GITHUB_URL = "https://github.com/jmilinovich/grove";
const WAITLIST_URL = "#waitlist"; // TODO: replace with real waitlist

/* ─── Data ─── */

const tools = [
  {
    name: "query",
    example: '{ lex: "taste graph", vec: "how preferences propagate" }',
    result: "8 results in 23ms — BM25 + vector fusion",
  },
  {
    name: "get",
    example: '"Taste Graph"',
    result: "fuzzy resolves to Resources/Concepts/Taste Graph.md",
  },
  {
    name: "multi_get",
    example: '"Resources/People/*.md"',
    result: "47 notes, frontmatter parsed, backlinks resolved",
  },
  {
    name: "write_note",
    example: '{ path: "Resources/Concepts/Context Engineering.md", ... }',
    result: "validated → written → git commit → reindexed → embedded",
  },
  {
    name: "vault_status",
    example: '{ mode: "digest" }',
    result: "12 seeds, 8 sprouts, 3 withering — lifecycle of every note",
  },
  {
    name: "list_notes",
    example: '{ prefix: "Resources/Concepts" }',
    result: "234 concepts with type, tags, aliases, last modified",
  },
];

const steps = [
  {
    num: "01",
    title: "Connect your vault",
    desc: "Point Grove at your git repo. Obsidian vault, markdown folder, any structured knowledge base.",
  },
  {
    num: "02",
    title: "Your AI remembers",
    desc: "Add Grove as an MCP server to Claude, ChatGPT, Cursor — any client. It searches, reads, and writes back.",
  },
  {
    num: "03",
    title: "Knowledge compounds",
    desc: "Every conversation enriches your vault. New concepts are planted, entities are linked, the graph grows.",
  },
];

const comparisons = [
  { label: "Works from phone/web", grove: true, others: false },
  { label: "Write-back with validation", grove: true, others: false },
  { label: "Hybrid search (BM25 + vector)", grove: true, others: false },
  { label: "Graph analysis + lifecycle", grove: true, others: false },
  { label: "Self-hosted embeddings", grove: true, others: false },
  { label: "Frontmatter-aware", grove: true, others: false },
  { label: "Git-native (every write = commit)", grove: true, others: false },
  { label: "Works with any MCP client", grove: true, others: "some" },
];

/* ─── Components ─── */

function Nav() {
  return (
    <nav className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-6 text-sm">
      <span className="text-foreground font-bold tracking-tight text-base">
        grove<span className="text-accent">.</span>md
      </span>
      <div className="flex items-center gap-6 text-muted">
        <a href="#how-it-works" className="hover:text-foreground transition-colors hidden sm:block">
          How it works
        </a>
        <a href="#deploy" className="hover:text-foreground transition-colors hidden sm:block">
          Deploy
        </a>
        <a href={GITHUB_URL} className="hover:text-foreground transition-colors">
          GitHub
        </a>
        <a
          href={WAITLIST_URL}
          className="text-accent hover:text-green-300 transition-colors font-medium"
        >
          Get early access
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-24 pb-28 sm:pt-36 sm:pb-36 px-6 max-w-6xl mx-auto">
      <div className="fade-up">
        <p className="text-muted text-sm mb-8 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-accent" />
          MCP server for your knowledge
        </p>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight max-w-4xl fade-up delay-1">
        your knowledge,
        <br />
        everywhere your
        <br />
        AI is<span className="text-accent cursor-blink">.</span>
      </h1>

      <p className="mt-8 text-lg sm:text-xl text-muted max-w-2xl leading-relaxed fade-up delay-2">
        You open Claude on your phone and it has no idea who you are.
        Grove fixes that. Connect your vault, get an MCP endpoint.
        Search, read, write-back &mdash; from any surface.
      </p>

      <div className="mt-10 flex flex-wrap gap-4 fade-up delay-3">
        <a
          href={WAITLIST_URL}
          className="inline-flex items-center gap-2 bg-accent text-background px-7 py-3.5 text-sm font-bold hover:bg-green-300 transition-colors"
        >
          Get early access
        </a>
        <a
          href={GITHUB_URL}
          className="inline-flex items-center gap-2 border border-surface-border px-7 py-3.5 text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
        >
          Self-host &rarr;
        </a>
      </div>

      <div className="mt-16 text-sm text-muted fade-up delay-4">
        <span className="text-muted-light">Used today with</span>{" "}
        Claude &middot; ChatGPT &middot; Cursor &middot; any MCP client
      </div>
    </section>
  );
}

function TheProblem() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <p className="text-muted text-xs tracking-[0.2em] uppercase mb-6">The problem</p>
          <p className="text-2xl sm:text-3xl leading-snug font-medium">
            Your AI forgets everything
            <br />
            the moment you switch devices.
          </p>
        </div>
        <div className="flex flex-col gap-6 text-muted leading-relaxed">
          <p>
            You&apos;ve built a knowledge system. Hundreds of notes, carefully structured,
            connected with wikilinks. Concepts, people, projects &mdash; years of thinking,
            organized.
          </p>
          <p>
            Then you open Claude on your phone. It has no idea who you are. Every concept,
            every connection &mdash; gone. You&apos;re starting from zero.
          </p>
          <p className="text-foreground">
            There are 24 Obsidian MCP servers. Every one is local-only, read-only,
            and treats your vault as a bag of text files.
          </p>
        </div>
      </div>
    </section>
  );
}

function Demo() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-10">What it feels like</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-surface-border">
        {/* Search */}
        <div className="bg-surface p-6 sm:p-8">
          <p className="text-xs text-muted mb-4">Claude on your phone</p>
          <div className="code-block text-sm space-y-3">
            <p className="text-muted-light">
              <span className="text-foreground">&quot;What was that framework I was developing
              about taste propagation?&quot;</span>
            </p>
            <div className="border-l-2 border-accent pl-4 mt-4">
              <p className="text-accent text-xs mb-1">grove.query</p>
              <p className="text-muted text-xs">
                lex: &quot;taste graph&quot; + vec: &quot;preference propagation&quot;
              </p>
              <p className="text-muted text-xs mt-1">
                <span className="text-accent">found</span> Resources/Concepts/Taste Graph.md
                <span className="text-muted"> &mdash; 23ms</span>
              </p>
            </div>
            <p className="text-muted-light text-sm mt-2">
              &quot;You&apos;ve been developing the Taste Graph concept since your time at Pinterest
              in 2016. It models how aesthetic preferences propagate through social networks...&quot;
            </p>
          </div>
        </div>

        {/* Write-back */}
        <div className="bg-surface p-6 sm:p-8">
          <p className="text-xs text-muted mb-4">Later, in a conversation about AI</p>
          <div className="code-block text-sm space-y-3">
            <p className="text-muted-light">
              <span className="text-foreground">&quot;This idea about context engineering is
              important. Plant it.&quot;</span>
            </p>
            <div className="border-l-2 border-accent pl-4 mt-4">
              <p className="text-accent text-xs mb-1">grove.write_note</p>
              <p className="text-muted text-xs">
                path: Resources/Concepts/Context Engineering.md
              </p>
              <p className="text-muted text-xs">
                frontmatter validated &middot; written &middot; committed &middot; reindexed
              </p>
            </div>
            <div className="border-l-2 border-muted pl-4 mt-3">
              <p className="text-muted text-xs font-mono">
                git log: <span className="text-foreground">grove (claude-ai): create Context Engineering</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted mt-6">
        Next conversation, any device &mdash; your AI already knows about Context Engineering.
        Knowledge compounds.
      </p>
    </section>
  );
}

function Story() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <div className="max-w-2xl">
        <p className="text-muted text-xs tracking-[0.2em] uppercase mb-6">Why this exists</p>
        <div className="space-y-4 text-muted leading-relaxed">
          <p>
            I keep my life in an Obsidian vault. ~1,000 notes, PARA-organized, git-tracked.
            Journal entries going back years. Concept notes on ideas I&apos;ve been developing
            across multiple jobs. People, recipes, a financial plan, business notes. Connected
            with wikilinks into a knowledge graph.
          </p>
          <p>
            I built Claude skills to tend this vault like a garden &mdash; searching, planting,
            harvesting entities, detecting withering ideas. It worked. But only from my laptop.
            Only in Claude Code.
          </p>
          <p className="text-foreground text-lg">
            Then I opened Claude on my phone during a conversation and realized:
            it had no idea who I was.
          </p>
          <p>
            So I put the search engine on a VPS. Added auth. Added write-back with frontmatter
            validation so agents couldn&apos;t corrupt the vault. Added graph analysis so Claude
            could understand the shape of my knowledge, not just search it.
          </p>
          <p>
            Three weeks in, I haven&apos;t manually searched my own notes once.
            Claude finds what I need in ~30ms from any surface.
            When it learns something new, it plants it. The knowledge compounds.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-12">How it works</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div key={step.num} className="flex flex-col gap-3">
            <span className="text-accent text-xs font-bold">{step.num}</span>
            <h3 className="text-lg font-bold">{step.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Tools() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <p className="text-muted text-xs tracking-[0.2em] uppercase mb-2">6 MCP tools</p>
          <p className="text-xl max-w-lg">
            Not twelve, not twenty. Six. Agent tool selection degrades past ten.
          </p>
        </div>
      </div>

      <div className="space-y-px">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="bg-surface border border-surface-border p-5 flex flex-col sm:flex-row sm:items-start gap-4"
          >
            <code className="text-accent text-sm font-bold shrink-0 w-28">{tool.name}</code>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted font-mono truncate">{tool.example}</p>
              <p className="text-sm text-muted-light mt-1">{tool.result}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeploymentModes() {
  return (
    <section id="deploy" className="py-20 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-2">Deploy anywhere</p>
      <p className="text-xl mb-12 max-w-lg">
        Same API. Same tools. Same privacy. Choose your deployment.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hosted */}
        <div className="deploy-card border-2 border-accent bg-accent-dim/20 p-8 flex flex-col gap-4 relative">
          <div className="absolute top-4 right-4">
            <span className="text-[10px] bg-accent text-background px-2 py-0.5 font-bold uppercase tracking-wider">
              Recommended
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-accent">Hosted</h3>
            <p className="text-sm text-muted mt-1">We run the infrastructure</p>
          </div>
          <ul className="text-sm text-muted space-y-2 flex-1">
            <li className="flex gap-2">
              <span className="text-accent">+</span> Connect your GitHub repo
            </li>
            <li className="flex gap-2">
              <span className="text-accent">+</span> Get an MCP endpoint in seconds
            </li>
            <li className="flex gap-2">
              <span className="text-accent">+</span> GPU-accelerated search
            </li>
            <li className="flex gap-2">
              <span className="text-accent">+</span> Auto-scaling, zero ops
            </li>
            <li className="flex gap-2">
              <span className="text-accent">+</span> Your data encrypted at rest
            </li>
          </ul>
          <a
            href={WAITLIST_URL}
            className="mt-2 inline-flex items-center justify-center bg-accent text-background px-6 py-3 text-sm font-bold hover:bg-green-300 transition-colors"
          >
            Get early access
          </a>
        </div>

        {/* Self-Hosted */}
        <div className="deploy-card border border-surface-border p-8 flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold">Self-Hosted</h3>
            <p className="text-sm text-muted mt-1">Your server, your rules</p>
          </div>
          <ul className="text-sm text-muted space-y-2 flex-1">
            <li className="flex gap-2">
              <span className="text-foreground">+</span> Full source code, MIT licensed
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">+</span> Self-hosted embeddings
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">+</span> Data never leaves your box
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">+</span> Customize everything
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">+</span> Runs on any VPS ($24/mo)
            </li>
          </ul>
          <a
            href={GITHUB_URL}
            className="mt-2 inline-flex items-center justify-center border border-surface-border px-6 py-3 text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
          >
            View on GitHub &rarr;
          </a>
        </div>

        {/* Enterprise */}
        <div className="deploy-card border border-surface-border p-8 flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold">Enterprise</h3>
            <p className="text-sm text-muted mt-1">On-prem with support</p>
          </div>
          <ul className="text-sm text-muted space-y-2 flex-1">
            <li className="flex gap-2">
              <span className="text-foreground">+</span> On-prem or private cloud
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">+</span> SSO / SAML integration
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">+</span> Dedicated support
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">+</span> SLA guarantees
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">+</span> Custom deployment
            </li>
          </ul>
          <a
            href="mailto:hello@grove.md"
            className="mt-2 inline-flex items-center justify-center border border-surface-border px-6 py-3 text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
          >
            Contact us
          </a>
        </div>
      </div>

      <p className="text-sm text-muted mt-8 text-center">
        All deployment modes use the same API and MCP protocol. Move between them at any time.
      </p>
    </section>
  );
}

function Privacy() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-2">Privacy &amp; security</p>
      <p className="text-xl mb-10 max-w-lg">
        Your vault is sacred. Grove is plumbing.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-surface-border">
        {[
          {
            title: "Self-hosted embeddings",
            desc: "bge-base-en-v1.5 runs on your infrastructure. Queries never hit a third-party API.",
          },
          {
            title: "Git-native",
            desc: "Every write is a git commit. Full audit trail. Rollback to any point in time.",
          },
          {
            title: "Validated writes",
            desc: "Frontmatter enforcement, path security, type checking. Agents can't corrupt your vault.",
          },
          {
            title: "Scoped API keys",
            desc: "SHA-256 hashed. Per-vault scoping. Read/write permissions. Revocable instantly.",
          },
        ].map((item) => (
          <div key={item.title} className="bg-surface p-6">
            <h4 className="text-sm font-bold mb-2">{item.title}</h4>
            <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Comparison() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <p className="text-muted text-xs tracking-[0.2em] uppercase mb-2">
        24 Obsidian MCP servers exist
      </p>
      <p className="text-xl mb-10 max-w-lg">
        All local-only file readers. Grove is a knowledge API.
      </p>

      <div className="max-w-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-surface-border">
              <th className="pb-3 pr-6 font-normal"></th>
              <th className="pb-3 pr-6 font-normal text-accent">Grove</th>
              <th className="pb-3 font-normal">Others</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row) => (
              <tr key={row.label} className="border-b border-surface-border">
                <td className="py-2.5 pr-6 text-muted">{row.label}</td>
                <td className="py-2.5 pr-6">
                  <span className="text-accent">&#10003;</span>
                </td>
                <td className="py-2.5">
                  {row.others === true ? (
                    <span className="text-accent">&#10003;</span>
                  ) : row.others === false ? (
                    <span className="text-muted">&#10005;</span>
                  ) : (
                    <span className="text-amber">~</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GrovesPreview() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <div className="border border-dashed border-surface-border p-8 sm:p-12 max-w-3xl">
        <p className="text-amber text-xs tracking-[0.2em] uppercase mb-4">Coming soon</p>
        <h3 className="text-2xl font-bold mb-4">
          Groves &mdash; share a slice of your knowledge
        </h3>
        <p className="text-muted leading-relaxed mb-4">
          Create a grove: a topic-scoped window into your vault with permission controls and
          server-side LLM filtering. Share your AI research notes with a colleague. Your recipes
          with a friend. Your architecture decisions with your team.
        </p>
        <p className="text-muted leading-relaxed">
          They connect their Claude to your grove. They get structured, searchable access to
          exactly what you choose to share &mdash; nothing more.
        </p>
      </div>
    </section>
  );
}

function BottomCTA() {
  return (
    <section id="waitlist" className="py-28 px-6 max-w-6xl mx-auto border-t border-surface-border">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Stop starting from zero.
        </h2>
        <p className="mt-4 text-muted text-lg">
          Give your AI the knowledge it&apos;s been missing.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={WAITLIST_URL}
            className="inline-flex items-center justify-center gap-2 bg-accent text-background px-8 py-4 text-sm font-bold hover:bg-green-300 transition-colors"
          >
            Get early access to hosted Grove
          </a>
          <a
            href={GITHUB_URL}
            className="inline-flex items-center justify-center gap-2 border border-surface-border px-8 py-4 text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
          >
            Self-host now &rarr;
          </a>
        </div>

        <p className="mt-6 text-xs text-muted">
          Open source &middot; MIT licensed &middot; ~2,500 LOC &middot; Zero dependencies on third-party AI
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full max-w-6xl mx-auto px-6 py-8 border-t border-surface-border flex items-center justify-between text-xs text-muted">
      <span>
        grove<span className="text-accent">.</span>md
      </span>
      <div className="flex gap-6">
        <a href={GITHUB_URL} className="hover:text-foreground transition-colors">
          GitHub
        </a>
        <a href="mailto:hello@grove.md" className="hover:text-foreground transition-colors">
          Contact
        </a>
        <span>MIT License</span>
      </div>
    </footer>
  );
}

/* ─── Page ─── */

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <Nav />
      <main className="w-full">
        <Hero />
        <TheProblem />
        <Demo />
        <Story />
        <HowItWorks />
        <Tools />
        <DeploymentModes />
        <Privacy />
        <Comparison />
        <GrovesPreview />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}
