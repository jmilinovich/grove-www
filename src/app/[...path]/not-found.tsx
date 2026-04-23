import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-6xl font-medium text-ink/15 mb-4">404</p>
        <h1 className="font-serif text-title font-medium mb-2">Note not found</h1>
        <p className="text-label text-ink/40 mb-8">
          This path doesn&apos;t match any note in your vault.
        </p>
        <Link
          href="/"
          className="text-label text-moss hover:text-earth transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
