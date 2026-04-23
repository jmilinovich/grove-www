import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { fetchWhoami, roleFromWhoami } from "@/lib/role";
import { scopedPath } from "@/lib/vault-context";
import DashboardNav from "@/components/dashboard-nav";
import AdminScopeBanner from "@/components/admin-scope-banner";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

export default async function DashboardLayout({ children, params }: LayoutProps) {
  const { atHandle, vaultSlug } = await params;
  const scopedRoot = scopedPath(atHandle, vaultSlug, "/dashboard");
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect(`/login?redirect=${encodeURIComponent(scopedRoot)}`);

  const whoami = await fetchWhoami(apiKey);
  if (!whoami) redirect(`/login?redirect=${encodeURIComponent(scopedRoot)}`);
  if (roleFromWhoami(whoami) === "non-owner") redirect("/home");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <DashboardNav />
      <AdminScopeBanner vaultSlug={vaultSlug} />
      {children}
    </div>
  );
}
