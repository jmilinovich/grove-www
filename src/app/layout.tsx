import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Lora } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import CommandPalette from "@/components/command-palette";
import LastVisited from "@/components/last-visited";
import SidebarProvider from "@/components/sidebar-provider";
import SearchProvider from "@/components/search-provider";
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
  title: "Grove — your knowledge, everywhere your AI is",
  description:
    "A hosted MCP server that wraps your git-tracked Obsidian vault. Search, read, write-back, graph analysis. Works from any MCP client.",
  openGraph: {
    title: "Grove — your knowledge, everywhere your AI is",
    description:
      "Give your AI a persistent memory that works from every surface. One vault. Every client.",
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
        <SearchProvider>
          <SidebarProvider>
            <CommandPalette />
            <LastVisited />
            <AppShell isSignedIn={isSignedIn}>
              {children}
            </AppShell>
          </SidebarProvider>
        </SearchProvider>
      </body>
    </html>
  );
}
