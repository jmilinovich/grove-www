import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiKey } from "@/lib/auth";
import { fetchWhoami, resolveLandingPath, roleFromWhoami } from "@/lib/role";
import LoginForm from "./login-form";

interface LoginPageProps {
  searchParams?: Promise<{ redirect?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (apiKey) {
    const whoami = await fetchWhoami(apiKey);
    if (whoami) {
      const resolved = await searchParams;
      const raw = resolved?.redirect;
      const requested = Array.isArray(raw) ? raw[0] : raw;
      redirect(resolveLandingPath(roleFromWhoami(whoami), requested ?? null));
    }
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
