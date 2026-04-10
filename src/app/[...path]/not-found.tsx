import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-muted mb-4">404</p>
        <h1 className="text-xl font-medium mb-2">Note not found</h1>
        <p className="text-sm text-muted mb-8">
          This path doesn&apos;t match any note in your vault.
        </p>
        <Link
          href="/"
          className="text-sm text-accent hover:text-green-300 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
