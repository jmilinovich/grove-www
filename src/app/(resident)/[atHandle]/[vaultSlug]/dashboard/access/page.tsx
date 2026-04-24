import { permanentRedirect } from "next/navigation";
import { scopedPath } from "@/lib/vault-context";

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

export default async function AccessIndexPage({ params }: PageProps) {
  const { atHandle, vaultSlug } = await params;
  permanentRedirect(scopedPath(atHandle, vaultSlug, "/dashboard/access/keys"));
}
