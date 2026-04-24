import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

const noLinks = {} as Record<string, { path: string | null; exists: boolean }>;

describe("markdown link safety", () => {
  it("forces external links to target=_blank with rel=noopener noreferrer nofollow", async () => {
    const html = await renderMarkdown(`[evil](https://evil.com/x)`, noLinks);
    expect(html).toMatch(/<a [^>]*href="https:\/\/evil\.com\/x"[^>]*>/);
    expect(html).toMatch(/target="_blank"/);
    expect(html).toMatch(/rel="noopener noreferrer nofollow"/);
  });

  it("never emits target=_top or target=_parent in rendered output", async () => {
    // Even when the raw HTML anchor survives sanitize, the post-processor
    // overwrites target with either _self or _blank. We check the
    // contrapositive: none of these dangerous values can appear.
    const html = await renderMarkdown(
      `[evil](https://evil.com/x)\n\n[home](/Resources/Concepts)\n\n<a href="https://evil.com" target="_top">x</a>`,
      noLinks,
    );
    expect(html).not.toMatch(/target="_top"/);
    expect(html).not.toMatch(/target="_parent"/);
  });

  it("keeps internal/relative links as target=_self with no author rel", async () => {
    const html = await renderMarkdown(`[home](/Resources/Concepts)`, noLinks);
    expect(html).toMatch(/href="\/Resources\/Concepts"/);
    expect(html).toMatch(/target="_self"/);
    // Internal links shouldn't carry rel — we only set rel for off-origin.
    expect(html).not.toMatch(/<a [^>]*rel=/);
  });

  it("treats hash anchors as same-document and uses _self", async () => {
    const html = await renderMarkdown(`[jump](#section)`, noLinks);
    expect(html).toMatch(/href="#section"/);
    expect(html).toMatch(/target="_self"/);
  });

  it("treats mailto: links as internal (no _blank)", async () => {
    const html = await renderMarkdown(`[mail](mailto:x@example.com)`, noLinks);
    expect(html).toMatch(/href="mailto:x@example\.com"/);
    expect(html).toMatch(/target="_self"/);
    expect(html).not.toMatch(/target="_blank"/);
  });

  it("treats protocol-relative URLs as external", async () => {
    const html = await renderMarkdown(`[oops](//evil.com/x)`, noLinks);
    expect(html).toMatch(/target="_blank"/);
    expect(html).toMatch(/rel="noopener noreferrer nofollow"/);
  });

  it("treats grove.md and *.grove.md hosts as internal", async () => {
    const html = await renderMarkdown(
      `[home](https://grove.md/about)\n\n[api](https://api.grove.md/v1/me)`,
      noLinks,
    );
    // Both should be _self.
    const matches = html.match(/target="[^"]+"/g) ?? [];
    expect(matches.every((m) => m === 'target="_self"')).toBe(true);
  });
});

describe("markdown id clobbering defense", () => {
  it("strips author-supplied id attributes globally", async () => {
    const html = await renderMarkdown(
      `<img src="https://example.com/x.png" id="__proto__" alt="x" />`,
      noLinks,
    );
    expect(html).not.toMatch(/id=/);
  });

  it("strips id from headings (no anchoring in pipeline today)", async () => {
    const html = await renderMarkdown(`<h2 id="open">Title</h2>`, noLinks);
    expect(html).not.toMatch(/id=/);
  });
});
