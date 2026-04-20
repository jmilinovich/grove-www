import { renderMarkdown } from "../src/lib/markdown.ts";

const TOKEN = process.env.GROVE_TOKEN;

const sampleWithCode = `# Hello

Some prose with a [[wikilink]].

\`\`\`typescript
const x: number = 1;
console.log(x);
\`\`\`

More text.

\`\`\`bash
echo hi
\`\`\`

\`\`\`unknown-lang
plain text here
\`\`\`
`;

async function main() {
  // Case 1: no code blocks (Legacy Holdings). Should be fast — no shiki init.
  const res = await fetch(
    "https://api.grove.md/v1/notes/" + encodeURIComponent("Archives/Legacy Holdings"),
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const note = await res.json();

  const t0 = Date.now();
  const html = await renderMarkdown(note.content, note.links);
  console.log("no-code note ms:", Date.now() - t0, "bytes:", html.length);

  // Case 2: cold shiki cold-start, 2 langs needed.
  const t1 = Date.now();
  const html2 = await renderMarkdown(sampleWithCode, { wikilink: { path: "wikilink.md", exists: true } });
  console.log("shiki cold (2 langs) ms:", Date.now() - t1);
  console.log("has shiki markup:", html2.includes("shiki") || html2.includes("github-dark"));

  // Case 3: warm, same langs.
  const t2 = Date.now();
  await renderMarkdown(sampleWithCode, {});
  console.log("shiki warm ms:", Date.now() - t2);

  // Case 4: warm, new lang (python).
  const sampleNewLang = sampleWithCode + "\n```python\nprint(1)\n```\n";
  const t3 = Date.now();
  await renderMarkdown(sampleNewLang, {});
  console.log("shiki + 1 new lang ms:", Date.now() - t3);
}
main().catch((e) => { console.error(e); process.exit(1); });
