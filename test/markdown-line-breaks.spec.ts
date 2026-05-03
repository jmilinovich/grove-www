import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

const noLinks = {} as Record<string, { path: string | null; exists: boolean }>;

describe("markdown hard line breaks", () => {
  it("renders single newlines between non-blank lines as <br>", async () => {
    const html = await renderMarkdown(
      `**Serves:** Rob, Chris\n**Lane:** Rollout discipline.`,
      noLinks,
    );
    expect(html).toMatch(/<br\s*\/?>/);
    expect(html).not.toMatch(/Rob, Chris\s+<strong>Lane/);
  });

  it("still treats blank lines as paragraph breaks", async () => {
    const html = await renderMarkdown(`First paragraph.\n\nSecond paragraph.`, noLinks);
    const paragraphs = html.match(/<p>/g) ?? [];
    expect(paragraphs.length).toBe(2);
  });

  it("does not insert <br> inside fenced code blocks", async () => {
    const html = await renderMarkdown("```\nline one\nline two\n```", noLinks);
    expect(html).toMatch(/<pre/);
    expect(html).not.toMatch(/line one\s*<br/);
  });
});
