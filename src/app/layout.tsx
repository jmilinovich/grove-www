import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import CommandPalette from "@/components/command-palette";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} ${inter.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-mono">
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
