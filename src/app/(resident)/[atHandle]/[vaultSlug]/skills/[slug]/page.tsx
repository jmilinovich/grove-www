import type { JSX } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSkills } from "@/lib/grove-api.v2";
import { SkillDetailClient } from "../skills-list-client";

export const metadata = {
  title: "Skill — Grove",
};

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string; slug: string }>;
}

// W3-SKILLS — Skill detail page.
//
// Per PLAN.md task block:
//   - Server component; receives slug param, fetches skill from
//     `fetchSkills()` (filters; mock has 7 skills).
//   - Renders: description, sample tasks list, cadence dropdown, enable/
//     disable toggle, run-now button.
//   - Cadence change calls `configureSkill` Server Action.
//
// The static structural surface (header / description / sample-tasks
// list / back link) is server-rendered. The three interactive widgets
// (cadence select, enable-disable toggle, run-now) live inside
// `<SkillDetailClient />` — a small `'use client'` island co-located
// with the list client. Keeping both clients in one file avoids
// duplicating the Server-Action imports + the action-handler wiring
// pattern, and matches the W2-PAGE-1 convention of co-locating page
// client islands under a single import.
export default async function SkillDetailPage({
  params,
}: PageProps): Promise<JSX.Element> {
  const { atHandle, vaultSlug, slug } = await params;
  const skills = await fetchSkills(vaultSlug);
  const skill = skills.find((s) => s.slug === slug);
  if (!skill) notFound();

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-8">
        <nav>
          <Link
            href={`/${atHandle}/${vaultSlug}/skills`}
            className="font-sans text-label text-ink/60 hover:text-ink transition-colors"
          >
            ◂ all skills
          </Link>
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-display text-ink">{skill.name}</h1>
          <p className="font-sans text-body text-ink/60">{skill.description}</p>
          <p className="font-sans text-detail text-ink/40 lowercase">
            domain: {skill.domain} · author: {skill.author}
          </p>
        </header>

        <section
          aria-labelledby="sample-tasks-heading"
          className="flex flex-col gap-2"
          data-testid="sample-tasks"
        >
          <h2
            id="sample-tasks-heading"
            className="font-sans font-medium text-label text-ink lowercase"
          >
            sample tasks
          </h2>
          <ul className="flex flex-col gap-1 pl-4 list-disc text-ink/60">
            {skill.sampleTasks.map((sample) => (
              <li key={sample} className="font-sans text-body">
                {sample}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="configure-heading"
          className="flex flex-col gap-3"
        >
          <h2
            id="configure-heading"
            className="font-sans font-medium text-label text-ink lowercase"
          >
            configure
          </h2>
          <SkillDetailClient skill={skill} vaultSlug={vaultSlug} />
        </section>
      </div>
    </main>
  );
}
