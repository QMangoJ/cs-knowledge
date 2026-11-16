/** Glossary term markers in lesson text: `[[词]]` or `[[显示文字|词条名]]`.
 *  The player renders a marked term as a clickable dotted-underline button that
 *  opens a popover with the term's full form + one-line plain explanation
 *  (content/glossary.yaml + content/glossary-frag-*.yaml). Plain-text contexts
 *  (step rail, SVG canvas labels, meta descriptions) use plainText() so the
 *  markers never leak as raw brackets. */

export const MARKER_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

export type Segment = { kind: "text"; text: string } | { kind: "term"; display: string; key: string };

export function parseSegments(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(MARKER_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ kind: "text", text: text.slice(last, idx) });
    const first = m[1]!.trim();
    const second = m[2]?.trim();
    out.push(second ? { kind: "term", display: first, key: second } : { kind: "term", display: first, key: first });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

/** Markers replaced by their display text — for plain-text contexts. */
export function plainText(text: string): string {
  return text.replace(MARKER_RE, (_m, a: string, b?: string) => (b ? a : a).trim());
}

/** All glossary keys referenced by markers in the given texts. */
export function collectKeys(texts: string[]): Set<string> {
  const keys = new Set<string>();
  for (const t of texts) for (const m of t.matchAll(MARKER_RE)) keys.add((m[2] ?? m[1])!.trim());
  return keys;
}

const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** For build-time HTML (marked output): markers become clickable term buttons.
 *  Clicks are handled by delegation in the Player (class + data-term). */
export function termsInHtml(html: string): string {
  return html.replace(MARKER_RE, (_m, a: string, b?: string) => {
    const display = a.trim();
    const key = (b ?? a).trim();
    return `<button type="button" class="gloss-term" data-term="${escAttr(key)}">${escHtml(display)}</button>`;
  });
}
