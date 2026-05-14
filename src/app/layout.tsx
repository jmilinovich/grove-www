import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Lora } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import CommandPalette from "@/components/command-palette";
import LastVisited from "@/components/last-visited";
import SidebarProvider from "@/components/sidebar-provider";
import SearchProvider from "@/components/search-provider";
import { MeProvider } from "@/contexts/me-context";
import AppShell from "@/components/app-shell";
import { getApiKey } from "@/lib/auth";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Grove — every AI session knows your vault",
  description:
    "Grove turns your git-tracked Obsidian vault into an MCP endpoint with hybrid search, write-back, and a daily backlog of work the AI proposes against your graph. Hosted or self-hosted, MIT licensed.",
  openGraph: {
    title: "Grove — every AI session knows your vault",
    description:
      "An MCP endpoint over your git-tracked Obsidian vault. Hybrid search, validated write-back, and a daily backlog of skill-driven work. From every device.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve auth state SSR so AppShell can decide on chrome without an
  // /api/whoami round-trip (prevents flash of missing chrome on scoped
  // routes like /@<handle>/...).
  const cookieStore = await cookies();
  const isSignedIn = Boolean(getApiKey(cookieStore));

  return (
    <html lang="en" className={`${geistMono.variable} ${inter.variable} ${lora.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <MeProvider>
          <SearchProvider>
            <SidebarProvider>
              <CommandPalette />
              <LastVisited />
              <AppShell isSignedIn={isSignedIn}>
                {children}
              </AppShell>
            </SidebarProvider>
          </SearchProvider>
        </MeProvider>
      </body>
    </html>
  );
}
