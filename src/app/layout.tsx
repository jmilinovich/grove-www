import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    <html lang="en" className={`${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-mono">
        {children}
      </body>
    </html>
  );
}
