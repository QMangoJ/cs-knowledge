import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** Render chapter markdown snippets to HTML (trusted content from our JSON). */
export function mdToHtml(md: string): string {
  return marked.parse(md ?? "", { async: false }) as string;
}

export function Md({ md, className }: { md: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />;
}
