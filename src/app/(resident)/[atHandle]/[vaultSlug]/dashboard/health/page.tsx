import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import HealthView, {
  type HealthSnapshot,
  type HealthFlag,
} from "@/components/health-view";

const API_URL = process.env.GROVE_API_URL ?? "https://api.grove.md";

export const metadata = {
  title: "Health — Grove",
};

function scoped(vaultSlug: string, path: string): string {
  return `${API_URL}/v/${encodeURIComponent(vaultSlug)}${path}`;
}

async function fetchCurrent(apiKey: string, vaultSlug: string): Promise<HealthSnapshot | null> {
  try {
    const res = await fetch(scoped(vaultSlug, "/v1/admin/health/current"), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.snapshot ?? null;
  } catch {
    return null;
  }
}

async function fetchHistory(apiKey: string, vaultSlug: string): Promise<HealthSnapshot[]> {
  try {
    const res = await fetch(scoped(vaultSlug, "/v1/admin/health/history?days=30"), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.snapshots ?? [];
  } catch {
    return [];
  }
}

async function fetchFlags(apiKey: string, vaultSlug: string): Promise<HealthFlag[]> {
  try {
    const res = await fetch(scoped(vaultSlug, "/v1/admin/health/flags"), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.flags ?? [];
  } catch {
    return [];
  }
}

interface HealthPageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

export default async function HealthPage({ params }: HealthPageProps) {
  const { vaultSlug } = await params;
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard/health");

  const [current, history, flags] = await Promise.all([
    fetchCurrent(apiKey, vaultSlug),
    fetchHistory(apiKey, vaultSlug),
    fetchFlags(apiKey, vaultSlug),
  ]);

  return (
    <div>
      <h1 className="font-serif font-medium text-title text-ink mb-8">Graph health</h1>
      <HealthView current={current} history={history} initialFlags={flags} />
    </div>
  );
}
