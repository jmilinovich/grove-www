import type { JSX } from "react";
import { assertV2Authed, fetchSkills } from "@/lib/grove-api.v2";
import { SkillsListClient } from "./skills-list-client";

export const metadata = {
  title: "Skills — Grove",
};

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

// W3-SKILLS — Installed tab (skills/page.tsx).
//
// Per PLAN.md task block:
//   - Server component; calls `fetchSkills(vaultSlug)` from v2 grove-api.
//   - Renders a tab strip with three tabs: Installed (active), Browse
//     (placeholder "coming in v3"), New (placeholder).
//   - Installed tab: list of SkillCard from W1.
//   - Wraps the list in a client island (`SkillsListClient`) for the
//     j/k/Enter/r/c keymap.
//
// The tab strip is deliberately not a tabs *component* — three static
// labels with one active link is below the threshold for inventing a
// primitive. The two placeholder tabs render as inert `<span>`s with
// caption text rather than disabled buttons, so screen readers / keyboard
// users don't waste a Tab stop on something that doesn't navigate.
//
// Auth/slug validation is upstream (parent layout `notFound()`s malformed
// slugs); per-vault membership authorization is enforced by the v2
// grove-api on the live path. Mock mode accepts any slug.
export default async function SkillsPage({ params }: PageProps): Promise<JSX.Element> {
  await assertV2Authed();
  const { atHandle, vaultSlug } = await params;
  const skills = await fetchSkills(vaultSlug);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-display text-ink lowercase">
            skills
          </h1>
          <p className="font-sans text-body text-ink/60">
            the AI workers installed in this vault. each skill turns into
            tasks on your backlog.
          </p>
        </header>

        <TabStrip />

        <SkillsListClient
          skills={skills}
          vaultSlug={vaultSlug}
          atHandle={atHandle}
        />
      </div>
    </main>
  );
}

// Tab strip. Installed is the only live tab in v2 (per D-9 — no Browse
// in v2). The other two are placeholders carrying a `coming in v3` caption.
function TabStrip(): JSX.Element {
  return (
    <nav
      aria-label="skills tabs"
      className="flex items-center gap-6 border-b border-surface-border"
      data-testid="skills-tab-strip"
    >
      <TabActive label="installed" />
      <TabPlaceholder label="browse" caption="coming in v3" />
      <TabPlaceholder label="new" caption="coming in v3" />
    </nav>
  );
}

function TabActive({ label }: { label: string }): JSX.Element {
  return (
    <span
      data-testid="tab-installed"
      data-active="true"
      className="font-sans font-medium text-label text-ink pb-2 border-b-2 border-moss"
    >
      {label}
    </span>
  );
}

function TabPlaceholder({
  label,
  caption,
}: {
  label: string;
  caption: string;
}): JSX.Element {
  return (
    <span
      data-testid={`tab-${label}`}
      data-active="false"
      className="inline-flex items-baseline gap-2 pb-2 border-b-2 border-transparent"
    >
      <span className="font-sans font-medium text-label text-ink/40">
        {label}
      </span>
      <span className="font-sans text-detail text-ink/40">{caption}</span>
    </span>
  );
}
