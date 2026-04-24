/**
 * Markdown rendering pipeline for Obsidian vault notes.
 * Handles wikilinks, callouts, math, syntax highlighting, and mermaid.
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { createHighlighter, type Highlighter, type BundledLanguage } from "shiki";
import type { Root as MdastRoot, Text, Blockquote, Paragraph } from "mdast";
import type { Root as HastRoot } from "hast";
import type { Plugin } from "unified";

// ---------------------------------------------------------------------------
// Shiki highlighter singleton
// ---------------------------------------------------------------------------

let highlighterPromise: Promise<Highlighter> | null = null;
const loadedLangs = new Set<string>();
const langLoadPromises = new Map<string, Promise<void>>();

// Aliases shiki accepts but that load under a canonical id.
const LANG_ALIASES: Record<string, BundledLanguage> = {
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  js: "javascript",
  ts: "typescript",
  py: "python",
  yml: "yaml",
};

// Allowlist: anything outside this set falls through to plain text.
// Keeps the bundled-languages list bounded so cold-start can't grow.
const SUPPORTED_LANGS = new Set<BundledLanguage>([
  "javascript", "typescript", "tsx", "jsx",
  "python", "bash", "json", "yaml", "markdown",
  "html", "css", "sql", "rust", "go", "toml", "diff",
]);

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark"],
      langs: [],
    });
  }
  return highlighterPromise;
}

async function ensureLang(highlighter: Highlighter, lang: string): Promise<string | null> {
  const resolved = (LANG_ALIASES[lang] ?? lang) as BundledLanguage;
  if (!SUPPORTED_LANGS.has(resolved)) return null;
  if (loadedLangs.has(resolved)) return resolved;

  let promise = langLoadPromises.get(resolved);
  if (!promise) {
    promise = highlighter.loadLanguage(resolved).then(() => {
      loadedLangs.add(resolved);
    });
    langLoadPromises.set(resolved, promise);
  }
  await promise;
  return resolved;
}

// ---------------------------------------------------------------------------
// Remark plugin: wikilinks
// ---------------------------------------------------------------------------

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function remarkWikilinks(
  links: Record<string, { path: string | null; exists: boolean }>,
  atHandle?: string,
  vaultSlug?: string,
): Plugin<[], MdastRoot> {
  return () => {
    return (tree: MdastRoot) => {
      visitText(tree, (node, index, parent) => {
        if (!parent || index === undefined) return;
        const value = node.value;
        if (!value.includes("[[")) return;

        const children: (Text | { type: string; data: { hName: string; hProperties: Record<string, string>; hChildren: { type: string; value: string }[] }; children: { type: string; value: string }[] })[] = [];
        let lastIndex = 0;

        WIKILINK_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = WIKILINK_RE.exec(value)) !== null) {
          // Text before the match
          if (match.index > lastIndex) {
            children.push({
              type: "text",
              value: value.slice(lastIndex, match.index),
            } as Text);
          }

          const target = match[1].trim();
          const display = (match[2] || target).trim();
          const linkInfo = links[target];

          if (linkInfo?.exists && linkInfo.path) {
            // Strip .md extension; scope the URL under /@<handle>/<slug>/
            // (or /@<handle>/ when not inside a vault) so wikilinks stay
            // within the current scope and don't fall through to the legacy
            // catch-all or the wrong vault.
            const prefix = atHandle
              ? vaultSlug
                ? `/@${atHandle}/${vaultSlug}`
                : `/@${atHandle}`
              : "";
            const href = prefix + "/" + linkInfo.path.replace(/\.md$/, "");
            children.push({
              type: "wikilink",
              data: {
                hName: "a",
                hProperties: { href, class: "wikilink" },
                hChildren: [{ type: "text", value: display }],
              },
              children: [{ type: "text", value: display }],
            });
          } else {
            children.push({
              type: "wikilink-unresolved",
              data: {
                hName: "span",
                hProperties: {
                  class: "wikilink-unresolved",
                  title: `Unresolved: ${target}`,
                },
                hChildren: [{ type: "text", value: display }],
              },
              children: [{ type: "text", value: display }],
            });
          }

          lastIndex = match.index + match[0].length;
        }

        if (children.length === 0) return;

        // Trailing text
        if (lastIndex < value.length) {
          children.push({
            type: "text",
            value: value.slice(lastIndex),
          } as Text);
        }

        // Replace the text node with the new children
        (parent.children as unknown[]).splice(index, 1, ...children);
      });
    };
  };
}

// Simple text visitor that walks mdast trees
function visitText(
  tree: MdastRoot,
  fn: (node: Text, index: number, parent: { children: unknown[] }) => void,
) {
  function visit(node: unknown, index?: number, parent?: unknown) {
    const n = node as { type: string; value?: string; children?: unknown[] };
    if (n.type === "text" && index !== undefined && parent) {
      fn(n as Text, index, parent as { children: unknown[] });
    }
    if (n.children) {
      // Walk in reverse so splicing doesn't skip nodes
      for (let i = n.children.length - 1; i >= 0; i--) {
        visit(n.children[i], i, n);
      }
    }
  }
  visit(tree);
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Remark plugin: strip empty sections left after dataview removal
// A heading followed by nothing (or only by another heading) is orphaned.
// ---------------------------------------------------------------------------

function remarkStripEmptySections(): Plugin<[], MdastRoot> {
  return () => {
    return (tree: MdastRoot) => {
      const removeIndices = new Set<number>();

      for (let i = 0; i < tree.children.length; i++) {
        const node = tree.children[i];
        if (node.type !== "heading") continue;

        const heading = node as { type: string; depth: number };

        // Check if this heading has no content before the next heading at same/higher level
        let hasContent = false;
        for (let j = i + 1; j < tree.children.length; j++) {
          const next = tree.children[j];
          if (next.type === "heading" && (next as { depth: number }).depth <= heading.depth) break;
          hasContent = true;
          break;
        }

        if (!hasContent) {
          removeIndices.add(i);
        }
      }

      tree.children = tree.children.filter((_, i) => !removeIndices.has(i));
    };
  };
}

// ---------------------------------------------------------------------------
// Remark plugin: strip Dataview queries
// ---------------------------------------------------------------------------

function remarkStripDataview(): Plugin<[], MdastRoot> {
  return () => {
    return (tree: MdastRoot) => {
      // Mark dataview code blocks and their preceding headings for removal
      const removeIndices = new Set<number>();

      for (let i = 0; i < tree.children.length; i++) {
        const node = tree.children[i];
        if (node.type !== "code") continue;
        const lang = (node as { lang?: string }).lang ?? "";
        if (!["dataview", "dataviewjs"].includes(lang.toLowerCase())) continue;

        removeIndices.add(i);

        // Also remove the heading immediately before this dataview block
        if (i > 0 && tree.children[i - 1].type === "heading") {
          removeIndices.add(i - 1);
        }
      }

      tree.children = tree.children.filter((_, i) => !removeIndices.has(i));

      // Strip inline dataview queries: `= expression` or `$= expression`
      stripInlineDataview(tree);
    };
  };
}

/** Remove inline code nodes that are dataview expressions (`= ...` or `$= ...`) */
function stripInlineDataview(tree: MdastRoot) {
  function visit(node: { type: string; children?: unknown[] }) {
    if (!node.children) return;
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i] as { type: string; value?: string; children?: unknown[] };
      if (child.type === "inlineCode" && child.value && /^\$?=\s/.test(child.value)) {
        node.children.splice(i, 1);
      } else {
        visit(child);
      }
    }
  }
  visit(tree as unknown as { type: string; children: unknown[] });
}

// Remark plugin: Obsidian callouts
// ---------------------------------------------------------------------------

const CALLOUT_RE = /^\[!(\w+)\]\s*(.*)?$/;

function remarkCallouts(): Plugin<[], MdastRoot> {
  return () => {
    return (tree: MdastRoot) => {
      visitBlockquotes(tree, (node) => {
        const firstChild = node.children[0];
        if (!firstChild || firstChild.type !== "paragraph") return;

        const para = firstChild as Paragraph;
        const firstText = para.children[0];
        if (!firstText || firstText.type !== "text") return;

        const lines = firstText.value.split("\n");
        const match = lines[0].match(CALLOUT_RE);
        if (!match) return;

        const calloutType = match[1].toLowerCase();
        const calloutTitle = match[2] || calloutType.charAt(0).toUpperCase() + calloutType.slice(1);

        // Remove the callout syntax line from text
        if (lines.length > 1) {
          firstText.value = lines.slice(1).join("\n");
        } else {
          // Remove the first text node entirely
          para.children.shift();
        }

        // If paragraph is now empty, remove it
        if (para.children.length === 0) {
          node.children.shift();
        }

        // Transform the blockquote into a callout div
        (node as unknown as Record<string, unknown>).data = {
          hName: "div",
          hProperties: {
            class: `callout callout-${calloutType}`,
          },
        };

        // Prepend title
        node.children.unshift({
          type: "paragraph",
          data: {
            hName: "div",
            hProperties: { class: "callout-title" },
          },
          children: [{ type: "text", value: calloutTitle }],
        } as unknown as Paragraph);
      });
    };
  };
}

function visitBlockquotes(tree: MdastRoot, fn: (node: Blockquote) => void) {
  function visit(node: unknown) {
    const n = node as { type: string; children?: unknown[] };
    if (n.type === "blockquote") {
      fn(n as Blockquote);
    }
    if (n.children) {
      for (const child of n.children) {
        visit(child);
      }
    }
  }
  visit(tree);
}

// ---------------------------------------------------------------------------
// Rehype plugin: mermaid code blocks → placeholder divs
// ---------------------------------------------------------------------------

function rehypeMermaid(): Plugin<[], HastRoot> {
  return () => {
    return (tree: HastRoot) => {
      visitHast(tree, (node, index, parent) => {
        if (!parent || index === undefined) return;
        const el = node as unknown as { tagName: string; properties?: Record<string, unknown>; children?: { type: string; tagName?: string; properties?: Record<string, unknown>; children?: { type: string; value?: string }[] }[] };
        if (el.tagName !== "pre") return;

        const code = el.children?.[0];
        if (!code || code.tagName !== "code") return;

        const className = code.properties?.className;
        const classes = Array.isArray(className) ? className : [];
        if (!classes.some((c: unknown) => String(c).includes("language-mermaid"))) return;

        const source = code.children
          ?.filter((c: { type: string }) => c.type === "text")
          .map((c: { type: string; value?: string }) => c.value || "")
          .join("") || "";

        const encoded = Buffer.from(source).toString("base64");

        // Replace pre with mermaid placeholder
        (parent.children as unknown[])[index] = {
          type: "element",
          tagName: "div",
          properties: {
            "data-mermaid-source": encoded,
            class: "mermaid-placeholder",
          },
          children: [],
        };
      });
    };
  };
}

function visitHast(
  tree: HastRoot,
  fn: (node: unknown, index: number, parent: { children: unknown[] }) => void,
) {
  function visit(node: unknown, index?: number, parent?: unknown) {
    if (index !== undefined && parent) {
      fn(node, index, parent as { children: unknown[] });
    }
    const n = node as { children?: unknown[] };
    if (n.children) {
      for (let i = n.children.length - 1; i >= 0; i--) {
        visit(n.children[i], i, n);
      }
    }
  }
  visit(tree);
}

// ---------------------------------------------------------------------------
// Sanitize schema — permissive enough for callouts, wikilinks, katex, shiki
// ---------------------------------------------------------------------------

const sanitizeSchema = {
  tagNames: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "a", "em", "strong", "del", "br", "hr",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "table", "thead", "tbody", "tr", "th", "td",
    "div", "span", "sup", "sub",
    "img",
    "input",
    // KaTeX elements
    "math", "semantics", "mrow", "mi", "mo", "mn", "msub", "msup",
    "msubsup", "mfrac", "msqrt", "mroot", "mover", "munder",
    "munderover", "mtable", "mtr", "mtd", "mtext", "mspace",
    "annotation",
    "svg", "path", "line", "rect", "circle",
  ],
  // NOTE: rehype-sanitize uses HAST property names, not HTML attribute names.
  // Standard markdown code fences emit `className` (array); our custom remark
  // plugins set `class` (string). We allow both so both paths survive.
  attributes: {
    "*": ["className", "class", "style", "id", "title", "data-mermaid-source", "data-language"],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    input: ["type", "checked", "disabled"],
    th: ["align"],
    td: ["align"],
    code: ["className", "class"],
    annotation: ["encoding"],
    math: ["xmlns"],
    svg: ["xmlns", "viewBox", "width", "height", "fill", "stroke"],
    path: ["d", "fill", "stroke", "strokeWidth"],
    line: ["x1", "y1", "x2", "y2"],
    rect: ["x", "y", "width", "height", "rx", "ry"],
    circle: ["cx", "cy", "r"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https", "data"],
  },
  strip: ["script"],
};

// ---------------------------------------------------------------------------
// Syntax highlighting post-processor
// ---------------------------------------------------------------------------

async function highlightCodeBlocks(html: string): Promise<string> {
  const CODE_BLOCK_RE = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;

  // First pass: collect langs we need so we can load them in parallel.
  const needed = new Set<string>();
  for (const m of html.matchAll(CODE_BLOCK_RE)) {
    if (m[1] !== "mermaid") needed.add(m[1]);
  }
  if (needed.size === 0) return html;

  const highlighter = await getHighlighter();
  const resolvedByLang = new Map<string, string | null>();
  await Promise.all(
    [...needed].map(async (lang) => {
      resolvedByLang.set(lang, await ensureLang(highlighter, lang));
    }),
  );

  return html.replace(CODE_BLOCK_RE, (_match, lang: string, code: string) => {
    if (lang === "mermaid") return _match;

    const decoded = code
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const resolved = resolvedByLang.get(lang) ?? "text";

    try {
      return highlighter.codeToHtml(decoded, {
        lang: resolved,
        theme: "github-dark",
      });
    } catch {
      return _match;
    }
  });
}

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------

export async function renderMarkdown(
  content: string,
  links: Record<string, { path: string | null; exists: boolean }>,
  atHandle?: string,
  vaultSlug?: string,
): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikilinks(links, atHandle, vaultSlug))
    .use(remarkStripDataview())
    .use(remarkStripEmptySections())
    .use(remarkCallouts())
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeMermaid())
    .use(rehypeKatex)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  const html = String(result);
  return highlightCodeBlocks(html);
}
