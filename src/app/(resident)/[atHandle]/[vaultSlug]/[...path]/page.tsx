import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Folder } from "lucide-react";
import { buttonClasses } from "@/components/primitives/button";
import { getApiKey } from "@/lib/auth";
import {
  fetchNote,
  listNotes,
  AuthError,
  type ListEntry,
} from "@/lib/grove-api";
import { parseAtHandle } from "@/lib/resident-context";
import { fetchWhoami, roleFromWhoami } from "@/lib/role";
import NoteView from "@/components/note-view";
import MetadataBar from "@/components/metadata-bar";
import Breadcrumbs from "@/components/breadcrumbs";

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string; path: string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { path } = await params;
  const vaultPath = path.map(decodeURIComponent).join("/");
  const filename = path[path.length - 1] ?? "";
  const title = decodeURIComponent(filename).replace(/\.md$/, "");
  return {
    title: `${title} — Grove`,
    description: `Viewing ${vaultPath}`,
  };
}

const TYPE_COLORS: Record<string, string> = {
  concept: "text-moss",
  person: "text-ink/60",
  recipe: "text-harvest",
  project: "text-earth",
  company: "text-earth",
  place: "text-moss",
  journal: "text-ink/40",
};

function DirectoryListing({
  prefix,
  entries,
  atHandle,
  vaultSlug,
}: {
  prefix: string;
  entries: ListEntry[];
  atHandle: string;
  vaultSlug: string;
}) {
  const directChildren: ListEntry[] = [];
  const subfolders = new Set<string>();

  for (const entry of entries) {
    const relative = entry.path.slice(prefix.length + 1);
    const slashIndex = relative.indexOf("/");
    if (slashIndex === -1) {
      directChildren.push(entry);
    } else {
      subfolders.add(relative.slice(0, slashIndex));
    }
  }

  const folderName = prefix.split("/").pop() || prefix;
  const base = `/${atHandle}/${vaultSlug}`;

  return (
    <div>
      <h1 className="font-serif text-heading font-medium tracking-[-0.015em] mb-2">
        {folderName}
      </h1>
      <p className="text-label text-ink/40 mb-8">
        {entries.length} note{entries.length !== 1 ? "s" : ""}
        {subfolders.size > 0 &&
          ` · ${subfolders.size} subfolder${subfolders.size !== 1 ? "s" : ""}`}
      </p>

      {subfolders.size > 0 && (
        <div className="mb-8">
          <h2 className="text-detail uppercase tracking-widest text-muted mb-3">
            Folders
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[...subfolders].sort().map((folder) => (
              <Link
                key={folder}
                href={`${base}/${prefix}/${folder}`}
                className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-label hover:border-muted hover:text-foreground transition-colors text-muted-light"
              >
                <Folder size={14} className="shrink-0 text-muted" />
                <span className="truncate">{folder}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {directChildren.length > 0 && (
        <div>
          <h2 className="text-detail uppercase tracking-widest text-muted mb-3">
            Notes
          </h2>
          <div className="space-y-1">
            {directChildren.map((entry) => (
              <Link
                key={entry.path}
                href={`${base}/${entry.path.replace(/\.md$/, "")}`}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-surface transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {entry.type && (
                    <span
                      className={`text-detail font-medium shrink-0 ${
                        TYPE_COLORS[entry.type] ?? "text-ink/40"
                      }`}
                    >
                      {entry.type}
                    </span>
                  )}
                  <span className="text-label text-muted-light group-hover:text-foreground transition-colors truncate">
                    {entry.name}
                  </span>
                </div>
                <span className="text-detail text-muted shrink-0">
                  {new Date(entry.modified_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SignInPrompt({
  atHandle,
  vaultSlug,
  vaultPath,
}: {
  atHandle: string;
  vaultSlug: string;
  vaultPath: string;
}) {
  const handle = parseAtHandle(atHandle) ?? atHandle;
  const redirectPath = `/${atHandle}/${vaultSlug}/${vaultPath}`;
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-detail uppercase tracking-[0.15em] text-ink/40 mb-3">
          Private note
        </p>
        <h1 className="text-heading font-serif font-medium text-ink tracking-tight mb-2">
          Sign in to read
        </h1>
        <p className="text-label text-ink/60 mb-8">
          This note belongs to{" "}
          <span className="font-mono text-ink">@{handle}</span>. Sign in with an
          API key that has access to continue.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
          className={buttonClasses({ variant: "primary", size: "md" })}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default async function VaultScopedNotePage({ params }: PageProps) {
  const { atHandle, vaultSlug, path } = await params;
  const vaultPath = path.map(decodeURIComponent).join("/");
  const handle = parseAtHandle(atHandle) ?? undefined;

  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) {
    return <SignInPrompt atHandle={atHandle} vaultSlug={vaultSlug} vaultPath={vaultPath} />;
  }

  let note;
  let entries: ListEntry[] = [];

  try {
    note = await fetchNote(vaultPath, apiKey, vaultSlug);
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(
        `/login?redirect=${encodeURIComponent(`/${atHandle}/${vaultSlug}/${vaultPath}`)}`,
      );
    }
    console.error(
      `[@handle/slug/...path] fetchNote failed for "${vaultPath}", trying listNotes:`,
      err,
    );
  }

  if (!note) {
    try {
      entries = await listNotes(vaultPath, apiKey, undefined, vaultSlug);
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(
          `/login?redirect=${encodeURIComponent(`/${atHandle}/${vaultSlug}/${vaultPath}`)}`,
        );
      }
      throw err;
    }
  }

  if (note) {
    const whoami = await fetchWhoami(apiKey);
    const role = roleFromWhoami(whoami);
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Breadcrumbs path={vaultPath} atHandle={handle} vaultSlug={vaultSlug} />
        <MetadataBar frontmatter={note.frontmatter} path={vaultPath} />
        <Suspense
          fallback={
            <div className="animate-pulse space-y-3 py-8">
              <div className="h-4 bg-surface rounded-md w-3/4" />
              <div className="h-4 bg-surface rounded-md w-1/2" />
              <div className="h-4 bg-surface rounded-md w-5/6" />
              <div className="h-4 bg-surface rounded-md w-2/3" />
            </div>
          }
        >
          <NoteView note={note} atHandle={handle} role={role} />
        </Suspense>
      </div>
    );
  }

  if (entries.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Breadcrumbs path={vaultPath} atHandle={handle} vaultSlug={vaultSlug} />
      <DirectoryListing
        prefix={vaultPath}
        entries={entries}
        atHandle={atHandle}
        vaultSlug={vaultSlug}
      />
    </div>
  );
}
