# Ideas

Raw feature ideas. When one gets shaped enough, it graduates into PLAN.md.

## Sparks

- Drop `next: { revalidate: 300 }` in `src/lib/grove-api.ts` (fetchNote/listNotes) — cookie-gated per-user fetches shouldn't cache a 5-min 404. A pre-write probe (link unfurl, prefetch, click racing the write) seeds a sticky 404 that Vercel serves for ~30s after a new note is created. Options: `cache: "no-store"`, or have grove server trigger `revalidatePath` on grove-www after each write.

## Shaping

<!-- Ideas getting fleshed out. Problem, sketch, open questions. -->

## Ready

<!-- Shaped enough to spec or build. Waiting for a slot. -->
