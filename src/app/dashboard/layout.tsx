import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { fetchWhoami, roleFromWhoami } from "@/lib/role";
import DashboardNav from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) redirect("/login?redirect=/dashboard");

  const whoami = await fetchWhoami(apiKey);
  if (!whoami) redirect("/login?redirect=/dashboard");
  if (roleFromWhoami(whoami) === "non-owner") redirect("/home");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <DashboardNav />
      {children}
    </div>
  );
}
