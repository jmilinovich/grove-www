import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { fetchNote } from "@/lib/grove-api";
import NoteView from "@/components/note-view";
import MetadataBar from "@/components/metadata-bar";
import Breadcrumbs from "@/components/breadcrumbs";

interface PageProps {
  params: Promise<{ path: string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { path } = await params;
  const vaultPath = path.map(decodeURIComponent).join("/");
  const filename = path[path.length - 1];
  const title = decodeURIComponent(filename).replace(/\.md$/, "");
  return {
    title: `${title} — Grove`,
    description: `Viewing ${vaultPath}`,
  };
}

export default async function NotePage({ params }: PageProps) {
  const { path } = await params;
  const vaultPath = path.map(decodeURIComponent).join("/");

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) {
    notFound();
  }

  const note = await fetchNote(vaultPath, apiKey);
  if (!note) {
    notFound();
  }

  const title =
    (note.frontmatter?.title as string) ??
    (note.frontmatter?.aliases as string[])?.[0] ??
    vaultPath.split("/").pop()?.replace(/\.md$/, "") ??
    vaultPath;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Breadcrumbs path={vaultPath} />
        <h1 className="text-2xl font-bold tracking-tight mt-4 mb-4">{title}</h1>
        <MetadataBar frontmatter={note.frontmatter} path={vaultPath} />
        <NoteView note={note} />
      </div>
    </div>
  );
}
