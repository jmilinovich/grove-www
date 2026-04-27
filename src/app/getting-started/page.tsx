import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/primitives/button";

const GITHUB_URL = "https://github.com/jmilinovich/grove";
const WAITLIST_URL = "/#waitlist";

export const metadata: Metadata = {
  title: "Getting started — Grove",
  description:
    "Set up your Grove vault, import your existing markdown notes, and connect Claude. Step-by-step onboarding for new Grove users.",
  openGraph: {
    title: "Getting started with Grove",
    description:
      "Accept your invite, install the CLI, import your notes, and connect Claude. Your knowledge, everywhere your AI is.",
    type: "article",
  },
};

export default function GettingStarted() {
  return (
    <div className="flex flex-col items-center">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-background focus:px-4 focus:py-2 focus:text-label focus:font-medium"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" className="w-full">
        <Hero />
        <Steps />
        <DayToDay />
        <CliReference />
        <Help />
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
      <Link
        href="/"
        className="font-serif font-medium tracking-tight text-subhead text-ink hover:text-earth transition-colors"
      >
        Grove
      </Link>
      <div className="flex items-center gap-6 text-ink/40">
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
    <section className="bg-cream pt-16 pb-12 sm:pt-24 sm:pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">
          Getting started
        </p>
        <h1 className="text-page sm:text-display font-medium leading-[1.1] tracking-[-0.02em] max-w-[24ch] font-serif text-ink text-pretty">
          Your notes, in your AI, in about ten minutes.
        </h1>
        <p className="mt-8 text-base text-ink/60 max-w-[60ch] leading-[1.6]">
          You&apos;ve got a folder of markdown files. You want your AI to read
          them, write back to them, and remember them across every conversation
          on every device. Here&apos;s how to set that up.
        </p>
        <p className="mt-4 text-base text-ink/60 max-w-[60ch] leading-[1.6]">
          The order matters. Import your notes first, then connect your AI
          &mdash; otherwise the first thing your AI sees is an empty vault.
        </p>
      </div>
    </section>
  );
}

/* ─── Steps ─── */

interface Step {
  num: string;
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Accept your invite",
    body: (
      <>
        <p className="text-base text-ink/60 leading-[1.6]">
          You&apos;ll get an email titled <em>You&apos;ve been invited to … on
          Grove</em> with two buttons. Click <strong className="text-ink">Open
          your vault in Grove</strong> first &mdash; it signs you in with a
          magic link and lands you on your dashboard. The link expires in 15
          minutes. Ignore the &ldquo;Add to Claude.ai&rdquo; button for now.
        </p>
        <p className="text-base text-ink/60 leading-[1.6]">
          If the magic link expired, ask the person who invited you to re-run
          the invite &mdash; it&apos;s idempotent and will issue a fresh link.
        </p>
      </>
    ),
  },
  {
    num: "02",
    title: "Create an API token",
    body: (
      <>
        <p className="text-base text-ink/60 leading-[1.6]">
          From your dashboard, open the <strong className="text-ink">Keys</strong>{" "}
          tab and create a new key named something like <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">cli</code>. The
          token starts with <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">grove_live_</code> and
          is shown once &mdash; copy it somewhere safe before you close the
          dialog.
        </p>
        <p className="text-base text-ink/60 leading-[1.6]">
          You can revoke and re-issue tokens any time from the same page.
        </p>
      </>
    ),
  },
  {
    num: "03",
    title: "Install the Grove CLI",
    body: (
      <>
        <p className="text-base text-ink/60 leading-[1.6]">
          The CLI is how you bulk-import existing notes and run search,
          listing, and write commands from a terminal. You need Node 22 or
          newer &mdash; check with <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">node --version</code>.
        </p>
        <CodeBlock>
{`git clone https://github.com/jmilinovich/grove.git
cd grove
npm install
npm link        # makes \`grove\` available on your PATH`}
        </CodeBlock>
        <p className="text-base text-ink/60 leading-[1.6]">
          Point the CLI at your token:
        </p>
        <CodeBlock>
{`grove init --server https://api.grove.md --token grove_live_...
grove whoami    # confirm it works`}
        </CodeBlock>
      </>
    ),
  },
  {
    num: "04",
    title: "Import your existing markdown",
    body: (
      <>
        <p className="text-base text-ink/60 leading-[1.6]">
          This is the step that makes the rest worth doing. Point{" "}
          <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">grove ingest</code>{" "}
          at the directory of <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">.md</code> files
          you want to import, with <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">--recursive</code>{" "}
          so subfolders come along too. Each file becomes a note, each write
          becomes a git commit, and duplicates are skipped.
        </p>
        <CodeBlock>
{`# dry-run first to see what would happen
grove ingest ~/my-notes --recursive --dry-run

# then run for real
grove ingest ~/my-notes --recursive`}
        </CodeBlock>
        <ul className="text-base text-ink/60 leading-[1.6] space-y-2 list-disc pl-5 marker:text-ink/40">
          <li>
            <strong className="text-ink">Plain markdown is fine.</strong>{" "}
            Files without frontmatter become <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">type: concept</code>{" "}
            by default and land in <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">Inbox/</code>. You
            can re-organize later.
          </li>
          <li>
            <strong className="text-ink">Existing frontmatter is respected.</strong>{" "}
            YAML <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">type:</code> and{" "}
            <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">tags:</code> carry through.
          </li>
          <li>
            <strong className="text-ink">Recursive is opt-in.</strong> Without{" "}
            <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">--recursive</code>{" "}
            (or <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">-r</code>),
            ingest reads only the top level of the directory you pass.
            Hidden folders like <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">.git</code>{" "}
            and <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">.obsidian</code>{" "}
            are always skipped.
          </li>
          <li>
            <strong className="text-ink">Snapshot before writes.</strong> A
            git tag is created before each ingest, so you can roll back with{" "}
            <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">grove rollback &lt;tag&gt;</code>{" "}
            if anything looks off.
          </li>
        </ul>
        <p className="text-base text-ink/60 leading-[1.6]">
          Confirm your notes landed:
        </p>
        <CodeBlock>
{`grove status      # note count, recent commit
grove search "something you know is in there"`}
        </CodeBlock>
      </>
    ),
  },
  {
    num: "05",
    title: "Let the graph build itself",
    body: (
      <>
        <p className="text-base text-ink/60 leading-[1.6]">
          Every note that lands via <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">ingest</code>{" "}
          (or any subsequent write from your AI) is enqueued for{" "}
          <strong className="text-ink">discovery</strong> &mdash; a background
          worker on the server that reads each new note, extracts the concepts
          and people it mentions, creates stub notes for entities that
          don&apos;t exist yet, and wires up wikilinks between related ideas.
        </p>
        <p className="text-base text-ink/60 leading-[1.6]">
          You don&apos;t have to do anything to trigger it. After a large
          ingest the queue takes a few minutes to drain. Watch the progress:
        </p>
        <CodeBlock>{`grove inspect --mode=discovery`}</CodeBlock>
        <p className="text-base text-ink/60 leading-[1.6]">
          That returns the queue depth, the last-processed timestamp, and a
          window of recent extractions and surprising connections. When{" "}
          <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">queue_depth</code>{" "}
          drops to zero, your graph has caught up. Every discovery action is a
          git commit, so you can audit or roll back exactly like a hand-edit.
        </p>
      </>
    ),
  },
  {
    num: "06",
    title: "Connect Claude",
    body: (
      <>
        <p className="text-base text-ink/60 leading-[1.6]">
          Now that your vault has content, this part is the payoff. Re-open the
          invite email and click <strong className="text-ink">Add to
          Claude.ai</strong>. It opens claude.ai with the connector URL
          pre-filled &mdash; approve the OAuth flow and Grove appears as a tool
          in every Claude conversation: web, phone, desktop, Code.
        </p>
        <p className="text-base text-ink/60 leading-[1.6]">
          Test it by asking Claude something specific from your notes &mdash;{" "}
          <em>what did I write about [topic]?</em> &mdash; and watch it call
          the <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">query</code>{" "}
          tool against your vault.
        </p>
        <p className="text-base text-ink/60 leading-[1.6]">
          Using ChatGPT, Cursor, or another MCP client? Add this URL as a
          custom MCP server:
        </p>
        <CodeBlock>{`https://api.grove.md/v/<your-slug>/mcp`}</CodeBlock>
      </>
    ),
  },
];

function Steps() {
  return (
    <section
      aria-label="Setup steps"
      className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border"
    >
      <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">
        Six steps
      </p>
      <h2 className="sr-only">Setup steps</h2>

      <div className="max-w-2xl space-y-12">
        {STEPS.map((step) => (
          <div key={step.num}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-moss text-detail font-medium">{step.num}</span>
              <span className="text-subhead font-medium">{step.title}</span>
            </div>
            <div className="border-l border-surface-border pl-5 space-y-4">
              {step.body}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Day-to-day ─── */

function DayToDay() {
  const examples = [
    { ask: "What did I write about X last month?", tool: "query" },
    { ask: "Read me the note titled Y.", tool: "get" },
    { ask: "Create a concept note about Z.", tool: "write_note" },
    { ask: "What's in my inbox?", tool: "list_notes" },
    { ask: "Show me the shape of my graph.", tool: "vault_status" },
  ];

  return (
    <section
      aria-label="Day-to-day usage"
      className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border"
    >
      <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">
        Day-to-day
      </p>
      <h2 className="text-title max-w-2xl leading-snug font-serif font-medium mb-6 text-pretty">
        Talk to your AI the way you always have.
      </h2>
      <p className="text-base text-ink/60 max-w-2xl leading-[1.6] mb-8">
        Once your vault is wired up, asking your AI questions about your own
        notes just works. Behind the scenes Claude picks the right Grove tool;
        you don&apos;t have to think about it.
      </p>

      <div className="max-w-2xl border-t border-surface-border">
        {examples.map((ex) => (
          <div
            key={ex.tool}
            className="flex items-baseline justify-between gap-6 py-4 border-b border-surface-border"
          >
            <p className="text-base text-ink/60 leading-[1.6]">{ex.ask}</p>
            <code className="text-detail text-moss font-mono shrink-0">
              {ex.tool}
            </code>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── CLI reference ─── */

function CliReference() {
  return (
    <section
      aria-label="CLI reference"
      className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border"
    >
      <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">
        CLI reference
      </p>
      <h2 className="text-title max-w-2xl leading-snug font-serif font-medium mb-6 text-pretty">
        Useful from the terminal too.
      </h2>

      <div className="max-w-2xl">
        <CodeBlock>
{`grove search "query string"            # hybrid search (BM25 + vectors)
grove read "Note Title"                # fuzzy read by title or path
grove list "Resources/People/*"        # list notes matching glob
grove write Inbox/idea.md --type concept --content "..."
grove status                           # vault health overview
grove digest                           # what's been planted, what's withering
grove history --since "1 week ago"     # recent changes
grove --help                           # everything else`}
        </CodeBlock>

        <p className="text-base text-ink/60 leading-[1.6] mt-6">
          Config lives at{" "}
          <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">
            ~/.grove/cli.json
          </code>{" "}
          (mode 0600). You can override the server and token per-shell with{" "}
          <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">
            GROVE_SERVER
          </code>{" "}
          and{" "}
          <code className="px-1 py-0.5 bg-surface border border-surface-border rounded-sm text-detail font-mono">
            GROVE_TOKEN
          </code>{" "}
          environment variables.
        </p>
      </div>
    </section>
  );
}

/* ─── Help ─── */

function Help() {
  const items = [
    {
      q: "I lost the magic link.",
      a: "Ask whoever invited you to re-run the invite — it's idempotent and issues a fresh 15-minute link.",
    },
    {
      q: "I lost my API token.",
      a: "Create a new one from the Keys tab and re-run grove init. Old tokens can be revoked from the same page.",
    },
    {
      q: "Already have an Obsidian vault?",
      a: "Even better. Grove was built for Obsidian conventions — wikilinks, frontmatter, folder structure. grove ingest your vault folders and everything carries over.",
    },
    {
      q: "Can I get my data out?",
      a: "Yes. Your vault is a git repo — clone it any time, you own everything. Grove is a server in front of files, not a silo.",
    },
  ];

  return (
    <section
      aria-label="Help"
      className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border"
    >
      <p className="text-ink/40 text-label tracking-[0.15em] uppercase mb-4">
        Help
      </p>
      <h2 className="sr-only">Help</h2>

      <div className="max-w-2xl space-y-8">
        {items.map((item) => (
          <div key={item.q}>
            <p className="text-subhead font-medium mb-2">{item.q}</p>
            <p className="text-base text-ink/60 leading-[1.6]">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Bottom CTA ─── */

function BottomCTA() {
  return (
    <section
      aria-label="Get started"
      className="py-20 px-6 max-w-5xl mx-auto border-t border-surface-border"
    >
      <div className="max-w-xl">
        <h2 className="text-title sm:text-heading font-serif font-medium tracking-[-0.015em] text-pretty">
          Don&apos;t have an invite yet?
        </h2>
        <p className="mt-3 text-ink/60 leading-[1.6]">
          Hosted Grove is in early access while we onboard friends and a small
          waitlist. You can also self-host today &mdash; the server is MIT
          licensed and runs on a small VPS for around thirty dollars a month.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={WAITLIST_URL}
            className={buttonClasses({ variant: "primary", size: "lg" })}
          >
            Get early access
          </a>
          <a
            href={GITHUB_URL}
            className={buttonClasses({ variant: "secondary", size: "lg" })}
          >
            Self-host &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */

function Footer() {
  return (
    <footer className="w-full max-w-5xl mx-auto px-6 py-8 border-t border-surface-border flex items-center justify-between text-detail text-ink/40">
      <Link
        href="/"
        className="font-serif font-medium text-label text-ink/60 hover:text-ink transition-colors"
      >
        Grove
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

/* ─── Helpers ─── */

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="bg-code-bg rounded-md p-4 sm:p-5 overflow-x-auto">
      <pre className="text-detail sm:text-label text-cream/60 leading-relaxed font-mono">
        {children}
      </pre>
    </div>
  );
}
