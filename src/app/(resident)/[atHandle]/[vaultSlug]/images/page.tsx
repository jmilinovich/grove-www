import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiKey } from "@/lib/auth";
import { listNotes, type ListEntry } from "@/lib/grove-api";
import ImageGrid from "@/components/image-grid";

export const metadata = {
  title: "Images — Grove",
};

interface PageProps {
  params: Promise<{ atHandle: string; vaultSlug: string }>;
}

export default async function ImagesPage({ params }: PageProps) {
  const { atHandle, vaultSlug } = await params;
  const cookieStore = await cookies();
  const apiKey = getApiKey(cookieStore);
  if (!apiKey) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/@${atHandle}/${vaultSlug}/images`)}`,
    );
  }

  let entries: ListEntry[];
  try {
    entries = await listNotes("", apiKey, "image");
  } catch {
    entries = [];
  }

  const images = entries.filter((e) => e.type === "image" && e.thumbnail_url);

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="font-serif font-medium text-title text-ink">Images</h1>
        <p className="mt-1 text-label text-ink/60">
          {images.length === 0
            ? "No images in your vault yet."
            : `${images.length} ${images.length === 1 ? "image" : "images"} in your vault.`}
        </p>
      </header>

      {images.length > 0 && <ImageGrid images={images} />}
    </div>
  );
}
