import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getApiKey } from "@/lib/auth";
import WaitlistForm from "@/components/waitlist-form";
import { Button, buttonClasses } from "@/components/primitives/button";
import { SkillCard } from "@/components/primitives/skill-card";
import { CitrusMark } from "@/components/citrus-mark";
import { fetchWhoami, landingPathForRole, roleFromWhoami } from "@/lib/role";
import type { Skill } from "@/lib/grove-api.v2.types";

const GITHUB_URL = "https://github.com/jmilinovich/grove";
const WAITLIST_URL = "#waitlist";

export default async function Home() {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (apiKey) {
    const whoami = await fetchWhoami(apiKey);
    if (whoami) {
      redirect(landingPathForRole(roleFromWhoami(whoami)));
    }
  }

  return (
    <div className="flex flex-col items-center">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-ink focus:text-cream focus:px-4 focus:py-2 focus:text-label focus:font-medium"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" className="w-full">
        <Hero />
        <WhyNow />
        <Versus />
        <TheGarden />
        <TheBacklog />
        <TheRoundtrip />
        <OneBreath />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ─── Nav ─── */

function Nav() {
  return (
    <nav className="w-full max-w-5xl mx-auto flex items-center justify-between px-6 py-6 text-label">
      <Link href="/" className="flex items-center gap-2 text-ink hover:text-earth transition-colors">
        <CitrusMark size={20} title="Grove" />
        <span className="font-serif font-medium tracking-tight text-subhead">
          Grove
        </span>
      </Link>
      <div className="flex items-center gap-6 text-ink/40">
        <Link
          href="/getting-started"
          className="hidden sm:inline hover:text-ink transition-colors"
        >
          Getting started
        </Link>
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
    <section className="bg-cream pt-20 pb-20 sm:pt-28 sm:pb-24 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: first-person headline + body + trust */}
        <div className="lg:col-span-7 lg:pr-4">
          <h1 className="text-display md:text-display-lg font-medium leading-[1.05] tracking-[-0.025em] fade-up font-serif text-ink text-pretty max-w-[16ch]">
            I keep my life
            <br />
            in an Obsidian
            <br />
            vault. Grove is
            <br />
            how every AI
            <br />
            session knows it.
          </h1>

          <p className="mt-8 text-base text-ink/60 max-w-[44ch] leading-[1.6] fade-up delay-1">
            Notes from years. Recipes, journal entries, concepts about
            people and projects. Then I open Claude on my phone and none
            of it follows. Grove fixes that &mdash; one MCP endpoint over
            a git-tracked vault, on every device, with write-back.
          </p>

          <p className="mt-8 text-detail text-ink/40 font-mono fade-up delay-2">
            1,750+ notes &middot; 4,500+ links &middot; MIT licensed &middot; self-hostable
          </p>
        </div>

        {/* Right: three-card deployment chooser */}
        <div className="lg:col-span-5 fade-up delay-2 space-y-3">
          <DeployCard
            tier="Hosted"
            accent
            blurb="Point Grove at your git-tracked vault. We index, embed, and serve."
          >
            <WaitlistForm source="hero" size="md" />
            <p className="mt-3 text-detail text-ink/40">
              Free during early access.
            </p>
          </DeployCard>

          <DeployCard
            tier="Self-hosted"
            blurb="Your VPS, your data. Self-hosted embeddings. MIT licensed."
          >
            <a
              href={GITHUB_URL}
              className={`${buttonClasses({ variant: "secondary", size: "md", fullWidth: true })} font-mono`}
            >
              git clone github.com/jmilinovich/grove
            </a>
          </DeployCard>

          <DeployCard
            tier="Enterprise"
            blurb="On-prem, SSO, SLA, dedicated review."
          >
            <a
              href="mailto:hello@grove.md"
              className={buttonClasses({ variant: "ghost", size: "md", fullWidth: true })}
            >
              hello@grove.md
            </a>
          </DeployCard>
        </div>
      </div>
    </section>
  );
}

function DeployCard({
  tier,
  blurb,
  accent = false,
  children,
}: {
  tier: string;
  blurb: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  const border = accent
    ? "border-ink"
    : "border-surface-border hover:border-ink";
  return (
    <div
      className={`bg-cream border ${border} rounded-md p-6 transition-colors`}
    >
      <p className="text-label font-medium text-ink">{tier}</p>
      <p className="mt-2 text-detail text-ink/60 leading-[1.5]">{blurb}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/* ─── Why now (Karpathy pull-quote) ─── */

function WhyNow() {
  return (
    <section
      aria-label="Why now"
      className="max-w-3xl mx-auto px-6 py-24 sm:py-32"
    >
      <p className="font-serif font-medium text-title sm:text-heading leading-snug tracking-tight text-pretty text-ink">
        There is room here for an incredible new product instead of a
        hacky collection of scripts.
      </p>
      <p className="mt-6 text-label text-ink/40">&mdash; Andrej Karpathy</p>

      <div className="mt-12 max-w-[60ch] space-y-4 text-base text-ink/60 leading-[1.7]">
        <p>
          Karpathy was describing the workflow where an LLM compiles raw
          documents into a structured wiki. The right idea, in the wrong
          direction. Most people don&rsquo;t start with a pile of papers.
          They start with notes they&rsquo;ve already been taking &mdash;
          for years, across phones and laptops, in Obsidian or Bear or
          a folder of markdown.
        </p>
        <p className="text-ink">
          The substrate already exists. The product is the bridge between
          the substrate and every AI session you&rsquo;ll have for the
          rest of your life.
        </p>
      </div>
    </section>
  );
}

/* ─── Versus (comparison) ─── */

function Versus() {
  return (
    <section
      aria-label="Versus the existing servers"
      className="max-w-4xl mx-auto px-6 py-20 border-t border-surface-border"
    >
      <p className="text-label font-medium text-ink/60 mb-3">
        Versus the existing 24 Obsidian MCP servers
      </p>
      <h2 className="font-serif font-medium text-title sm:text-heading leading-snug tracking-tight text-pretty text-ink mb-10 max-w-[24ch]">
        They live on your laptop. Grove lives everywhere.
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-label text-left">
          <thead>
            <tr className="border-b border-surface-border text-ink/60 text-detail">
              <th className="py-3 pr-6 font-medium">&nbsp;</th>
              <th className="py-3 pr-6 font-medium">Existing servers</th>
              <th className="py-3 font-medium text-moss">Grove</th>
            </tr>
          </thead>
          <tbody className="text-ink/60 font-sans">
            <ComparisonRow label="Works from your phone" left="no" right="yes" />
            <ComparisonRow
              label="Search beyond keyword match"
              left="keyword only"
              right="hybrid (BM25 + vector)"
            />
            <ComparisonRow
              label="Write back to your vault"
              left="read-only"
              right="git-backed, validated"
            />
            <ComparisonRow
              label="Frontmatter awareness"
              left="text-flat"
              right="typed"
            />
            <ComparisonRow
              label="Graph analysis"
              left="none"
              right="centrality, clusters, bridges"
            />
            <ComparisonRow
              label="Scoped sharing"
              left="no"
              right="per-handle, per-vault"
              last
            />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ComparisonRow({
  label,
  left,
  right,
  last = false,
}: {
  label: string;
  left: string;
  right: string;
  last?: boolean;
}) {
  return (
    <tr className={last ? "" : "border-b border-surface-border"}>
      <td className="py-3 pr-6 text-ink">{label}</td>
      <td className="py-3 pr-6 text-ink/40">{left}</td>
      <td className="py-3 text-ink">{right}</td>
    </tr>
  );
}

/* ─── The garden (skills + gardener verbs) ─── */

const MOCK_SKILLS: Array<{ skill: Skill; lastRunAt: string; nextRunAt: string }> = [
  {
    skill: {
      id: "skill-daily-vault-review",
      slug: "daily-vault-review",
      name: "Daily Vault Review",
      domain: "system",
      author: "builtin",
      description:
        "Surfaces today's noteworthy patterns, dormant threads, and perishable claims approaching staleness.",
      sampleTasks: [],
      cadenceOptions: ["daily", "on-demand"],
      defaultCadence: "daily",
      defaultArtifactType: "surface",
      installState: "installed",
    },
    lastRunAt: "2026-05-13T08:00:00Z",
    nextRunAt: "2026-05-14T08:00:00Z",
  },
  {
    skill: {
      id: "skill-concept-graph-cleanup",
      slug: "concept-graph-cleanup",
      name: "Concept Graph Cleanup",
      domain: "knowledge",
      author: "builtin",
      description:
        "Detects probable duplicates, orphans, and dead concepts. Surfaces them for ritual review.",
      sampleTasks: [],
      cadenceOptions: ["weekly", "on-demand"],
      defaultCadence: "weekly",
      defaultArtifactType: "concept-merge",
      installState: "installed",
    },
    lastRunAt: "2026-05-11T06:00:00Z",
    nextRunAt: "2026-05-18T06:00:00Z",
  },
];

const GARDENER_VERBS = [
  { verb: "plant", note: "create concepts and journal entries" },
  { verb: "harvest", note: "extract entities and wire links" },
  { verb: "tend", note: "merge duplicates, prune stubs" },
  { verb: "forage", note: "pull bookmarks into Sources/" },
  { verb: "wander", note: "random walks across the graph" },
  { verb: "pulse", note: "health, drift, graph metrics" },
];

function TheGarden() {
  return (
    <section
      aria-label="The garden"
      className="max-w-5xl mx-auto px-6 py-20 border-t border-surface-border"
    >
      <p className="text-label font-medium text-ink/60 mb-3">What shipped</p>
      <h2 className="font-serif font-medium text-title sm:text-heading leading-snug tracking-tight text-pretty text-ink mb-10 max-w-[26ch]">
        Seven skills tend your vault. You disposition. The graph grows.
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-5 space-y-4 text-base text-ink/60 leading-[1.7] max-w-[50ch]">
          <p>
            Each morning Grove proposes work. A daily review surfaces
            what deserves a second pass. A graph cleanup merges
            duplicates and prunes stubs. A dormant-thread scan
            resurfaces ideas you put down a season ago. You confirm,
            refine, or dismiss.
          </p>
          <p>
            The gardener&rsquo;s grammar &mdash; plant, harvest, tend,
            forage, wander, pulse &mdash; is the API. Skills are how
            Grove turns your vault into a backlog of work it can do
            <em> for </em> you.
          </p>

          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-detail text-ink/40 font-mono">
            {GARDENER_VERBS.map((g) => (
              <li key={g.verb} className="flex flex-col">
                <span className="text-moss">{g.verb}</span>
                <span className="text-ink/40">{g.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7 space-y-3">
          {MOCK_SKILLS.map(({ skill, lastRunAt, nextRunAt }) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              lastRunAt={lastRunAt}
              nextRunAt={nextRunAt}
            />
          ))}
          <p className="text-detail text-ink/40 pt-2 pl-1">
            + 5 more: Relationship Surface &middot; Dormant Thread &middot;
            Journal Patterns &middot; Perishable Audit &middot; Vault Health
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── The backlog (product reveal) ─── */

function TheBacklog() {
  return (
    <section
      aria-label="The backlog homepage"
      className="max-w-4xl mx-auto px-6 py-20"
    >
      <p className="text-label font-medium text-ink/60 mb-3">The homepage</p>
      <h2 className="font-serif font-medium text-title sm:text-heading leading-snug tracking-tight text-pretty text-ink mb-10 max-w-[28ch]">
        Open Grove. You see the work the vault wants done.
      </h2>

      <div className="bg-cream border border-surface-border rounded-md overflow-hidden">
        {/* Mocked window chrome — sentence-case label, no buttons. */}
        <div className="px-6 py-3 border-b border-surface-border flex items-center justify-between text-detail text-ink/40 font-mono">
          <span>jrmilinovich / life-vault</span>
          <span>today &middot; 4 pending &middot; 7 cleared</span>
        </div>

        {/* needs review */}
        <div className="px-6 pt-6 pb-3 border-b border-surface-border">
          <p className="text-label font-medium text-ink lowercase">
            needs review <span className="text-ink/60">(2)</span>
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            <ReviewRow
              skill="Concept Graph Cleanup"
              title='merge concepts: "Resilience" ≈ "Antifragility"'
              meta="2 candidates · scored 0.91 cosine"
              voice="perishable"
            />
            <ReviewRow
              skill="Daily Vault Review"
              title="3 perishable claims older than 14 days"
              meta="surface-only · skill: perishable audit"
              voice="perishable"
            />
          </ul>
        </div>

        {/* pending tasks */}
        <div className="px-6 pt-6 pb-6">
          <p className="text-label font-medium text-ink lowercase mb-4">
            pending <span className="text-ink/60">(4)</span>
          </p>
          <ul className="flex flex-col gap-3">
            <PendingRow
              skill="Daily Vault Review"
              title="Today&rsquo;s patterns from your journal"
              meta="daily &middot; runs tonight 11pm &middot; ~14m"
              source="Journal/2026/2026-05-13.md"
            />
            <PendingRow
              skill="Relationship Surface"
              title="People you haven&rsquo;t talked to in 60 days"
              meta="weekly &middot; runs Mon 6am &middot; ~6m"
              source="Resources/People/*"
            />
            <PendingRow
              skill="Dormant Thread Surface"
              title="Concepts you keep linking to but never edit"
              meta="weekly &middot; runs Mon 6am &middot; ~8m"
              source="Resources/Concepts/*"
            />
          </ul>
        </div>
      </div>

      <p className="mt-8 max-w-[60ch] text-base text-ink/60 italic font-serif leading-[1.6]">
        This is the homepage &mdash; not a sidebar, not a settings
        screen. The work Grove proposes, and the durable record the AI
        wrote yesterday, waiting for your sign-off.
      </p>
    </section>
  );
}

function ReviewRow({
  skill,
  title,
  meta,
  voice,
}: {
  skill: string;
  title: string;
  meta: string;
  voice: "durable" | "perishable";
}) {
  // Static, server-rendered replica of the live NeedsReviewList row.
  // Match real ProvenanceBadge chip styling but without the popover (no
  // interactivity needed on a landing page).
  const chipClass =
    voice === "durable"
      ? "text-moss"
      : "text-harvest border-[var(--harvest-15)]";
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-sans font-medium text-label text-moss">
          {skill}
        </span>
        <span
          className={`inline-flex items-center justify-center bg-cream border border-surface-border rounded-sm font-mono text-detail px-1.5 py-0.5 ${chipClass}`}
          aria-label={`${voice} provenance`}
        >
          {voice}
        </span>
        <h3 className="font-serif text-subhead text-ink leading-snug">
          {title}
        </h3>
      </div>
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <p className="text-detail text-ink/60">{meta}</p>
        <div className="flex items-center gap-3 font-sans text-label text-ink/60">
          <ShortcutHint shortcut="c" label="confirm" />
          <ShortcutHint shortcut="r" label="refine" />
          <ShortcutHint shortcut="x" label="dismiss" />
          <ShortcutHint shortcut="s" label="mark stale" />
        </div>
      </div>
    </li>
  );
}

function PendingRow({
  skill,
  title,
  meta,
  source,
}: {
  skill: string;
  title: string;
  meta: string;
  source: string;
}) {
  return (
    <li className="bg-surface border border-surface-border rounded-md p-6 hover:border-ink transition-colors">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-sans font-medium text-label text-moss">
          {skill}
        </span>
        <h3
          className="font-serif font-medium text-subhead text-ink leading-snug"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
      <p className="mt-2 text-detail text-ink/60">{meta}</p>
      <p className="mt-1 text-detail text-ink/60">
        from{" "}
        <span className="text-ink border-b border-surface-border">
          {source}
        </span>
      </p>
      <div className="mt-4 flex items-center justify-end gap-4 font-sans text-label text-ink/60">
        <ShortcutHint shortcut="r" label="run" />
        <ShortcutHint shortcut="e" label="defer" />
        <ShortcutHint shortcut="d" label="dismiss" />
      </div>
    </li>
  );
}

function ShortcutHint({ shortcut, label }: { shortcut: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="hidden sm:inline-flex items-center justify-center bg-cream border border-surface-border rounded-sm font-mono text-detail px-1.5 py-0.5 text-ink/60"
      >
        {shortcut}
      </span>
      <span>{label}</span>
    </span>
  );
}

/* ─── The roundtrip (real MCP transcript) ─── */

function TheRoundtrip() {
  return (
    <section
      aria-label="The MCP roundtrip"
      className="max-w-3xl mx-auto px-6 py-20 border-t border-surface-border"
    >
      <p className="text-label font-medium text-ink/60 mb-3">
        Under the hood
      </p>
      <h2 className="font-serif font-medium text-title sm:text-heading leading-snug tracking-tight text-pretty text-ink mb-10 max-w-[26ch]">
        The MCP roundtrip, in two calls.
      </h2>

      <div className="space-y-6">
        <CodeBlock title="query">
{`POST /v1/query
{
  "searches": [
    { "type": "lex", "query": "design systems" },
    { "type": "vec", "query": "how I think about taste" }
  ],
  "intent": "What do I know about design systems?"
}

→ 200 OK   23 ms
{
  "results": [
    { "path": "Resources/Concepts/Design Systems.md", "type": "concept", "score": 0.87 },
    { "path": "Resources/Concepts/Taste.md",          "type": "concept", "score": 0.81 },
    { "path": "Journal/2024/2024-09-12.md",           "type": "journal", "score": 0.74 }
  ],
  "took_ms": 23
}`}
        </CodeBlock>

        <CodeBlock title="write_note">
{`POST /v1/notes/Resources/Concepts/Context Engineering.md
{
  "frontmatter": { "type": "concept", "tags": ["agents", "prompting"] },
  "content": "...",
  "if_hash": "abc123…"
}

→ 200 OK   140 ms
{
  "git_sha":     "9fc91db",
  "indexed_at":  "2026-05-13T10:42:18Z",
  "links_added": 3,
  "backlinks":   ["Resources/Concepts/Design Systems.md", …]
}`}
        </CodeBlock>
      </div>

      <p className="mt-8 max-w-[60ch] text-base text-ink/60 leading-[1.7]">
        Every read is hybrid lex + vec fused server-side. Every write is
        a git commit with a content hash for optimistic concurrency.
        Six tools, the same on every client &mdash; Claude, ChatGPT,
        Cursor, your own script. The contract is small on purpose.
      </p>
    </section>
  );
}

function CodeBlock({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <div className="bg-code-bg rounded-md border border-code-border overflow-hidden">
      <p className="px-4 pt-3 pb-2 text-detail text-cream/40 font-mono border-b border-code-border">
        {title}
      </p>
      <pre className="px-4 py-4 text-detail sm:text-label text-cream/60 font-mono leading-[1.7] overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

/* ─── One breath ─── */

function OneBreath() {
  return (
    <section
      aria-label="The vault is sacred"
      className="max-w-4xl mx-auto px-6 py-32 text-center"
    >
      <p className="font-serif font-medium text-title sm:text-heading leading-snug text-ink/60 max-w-[40ch] mx-auto text-pretty">
        The vault is sacred. Discovery is a careful gardener, not an
        unsupervised lawnmower.
      </p>
    </section>
  );
}

/* ─── Bottom CTA ─── */

function BottomCTA() {
  return (
    <section
      id="waitlist"
      aria-label="Get started"
      className="max-w-2xl mx-auto px-6 py-20 border-t border-surface-border"
    >
      <h2 className="font-serif font-medium text-title sm:text-heading tracking-tight leading-snug text-pretty text-ink">
        Stop starting from zero.
      </h2>
      <p className="mt-4 text-base text-ink/60 leading-[1.7] max-w-[50ch]">
        Connect your vault once. Every conversation builds on the last
        one. From every device you own.
      </p>

      <div className="mt-8">
        <WaitlistForm source="bottom-cta" size="md" />
      </div>

      <a
        href={GITHUB_URL}
        className="mt-4 inline-flex items-center text-label text-ink/60 hover:text-ink transition-colors font-mono"
      >
        Or self-host &mdash; git clone github.com/jmilinovich/grove &rarr;
      </a>

      <p className="mt-8 text-detail text-ink/40">
        MIT licensed &middot; CSP-hardened &middot; self-hosted embeddings &middot; git-native writes
      </p>
    </section>
  );
}

/* ─── Footer ─── */

function Footer() {
  return (
    <footer className="w-full max-w-5xl mx-auto px-6 py-8 border-t border-surface-border flex items-center justify-between text-detail text-ink/40">
      <Link
        href="/"
        className="flex items-center gap-2 text-ink/60 hover:text-ink transition-colors"
      >
        <CitrusMark size={16} title="Grove" />
        <span className="font-serif font-medium text-label">Grove</span>
      </Link>
      <div className="flex gap-6">
        <a href={GITHUB_URL} className="hover:text-ink transition-colors">
          GitHub
        </a>
        <span>MIT</span>
      </div>
    </footer>
  );
}
