import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import TrailEditor, { type TrailEditorInitial } from "@/components/trail-editor";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

interface Trail {
  id: string;
  name: string;
  description: string;
  allow_tags: string[];
  deny_tags: string[];
  allow_types: string[];
  deny_types: string[];
  allow_paths: string[];
  deny_paths: string[];
  rate_limit_reads: number | null;
  rate_limit_writes: number | null;
}

async function fetchTrail(id: string, apiKey: string): Promise<Trail | null> {
  const res = await fetch(`${API_URL}/v1/admin/trails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list" }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { trails?: Trail[] };
  return data.trails?.find((t) => t.id === id) ?? null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Trail editor — Grove",
};

export default async function TrailEditorPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect(`/login?redirect=/dashboard/trails/${encodeURIComponent(id)}`);

  let initial: TrailEditorInitial;

  if (id === "new") {
    initial = {
      id: "new",
      name: "",
      description: "",
      allow_tags: [],
      deny_tags: [],
      allow_types: [],
      deny_types: [],
      allow_paths: [],
      deny_paths: [],
      rate_limit_reads: null,
      rate_limit_writes: null,
    };
  } else {
    const trail = await fetchTrail(id, apiKey);
    if (!trail) notFound();
    initial = {
      id: trail.id,
      name: trail.name,
      description: trail.description,
      allow_tags: trail.allow_tags,
      deny_tags: trail.deny_tags,
      allow_types: trail.allow_types,
      deny_types: trail.deny_types,
      allow_paths: trail.allow_paths,
      deny_paths: trail.deny_paths,
      rate_limit_reads: trail.rate_limit_reads,
      rate_limit_writes: trail.rate_limit_writes,
    };
  }

  return <TrailEditor initial={initial} />;
}
