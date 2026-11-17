import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import zh from "@/i18n/zh.json";
import en from "@/i18n/en.json";
import { counterpartPath, prefixPath } from "@/i18n";
import { loadContent, localizedJourney, localizedSubjects, readContent, topicForLang } from "@/lib/content";

function keyPaths(v: unknown, prefix = ""): string[] {
  if (Array.isArray(v)) return v.flatMap((x, i) => keyPaths(x, `${prefix}[${i}]`));
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => keyPaths(x, prefix ? `${prefix}.${k}` : k));
  return [prefix];
}

describe("i18n string tables", () => {
  it("en.json has exactly the same keys as zh.json", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(zh).sort());
  });
  it("no empty English strings", () => {
    const empties = keyPaths(en).filter((p) => {
      const v = p.split(/[.[\]]/).filter(Boolean).reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], en);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empties).toEqual([]);
  });
  it("counterpart paths swap the /en prefix both ways", () => {
    expect(counterpartPath("zh", "/")).toBe("/en/");
    expect(counterpartPath("zh", "/os/syscall/")).toBe("/en/os/syscall/");
    expect(counterpartPath("en", "/en/")).toBe("/");
    expect(counterpartPath("en", "/en/os/syscall/3/")).toBe("/os/syscall/3/");
    expect(prefixPath("en", "/coding/")).toBe("/en/coding/");
    expect(prefixPath("zh", "/coding/")).toBe("/coding/");
  });
});

describe("bilingual content loading", () => {
  const c = loadContent();
  it("subjects.en.yaml covers every subject with the same block counts", () => {
    expect(c.subjectsEn.map((s) => s.id)).toEqual(c.subjects.map((s) => s.id));
    for (const s of c.subjects) {
      const en = c.subjectsEn.find((x) => x.id === s.id)!;
      expect(en.blocks.length).toBe(s.blocks.length);
      expect(en.tagline).not.toBe(s.tagline);
    }
  });
  it("journey is fully translated", () => {
    const en = localizedJourney(c, "en");
    expect(en).toHaveLength(c.journey.length);
    en.forEach((j, i) => { expect(j.title).not.toBe(c.journey[i]!.title); });
    expect(localizedJourney(c, "zh")).toBe(c.journey);
  });
  it("localized subjects keep topics wiring from the Chinese canonical file", () => {
    const en = localizedSubjects(c, "en");
    en.forEach((s, i) => {
      expect(s.blocks.map((b) => b.topics)).toEqual(c.subjects[i]!.blocks.map((b) => b.topics));
      expect(s.tagline).toBe(c.subjectsEn[i]!.tagline);
    });
  });
  it("topics fall back to Chinese when no en.yaml exists yet", () => {
    expect(c.topicsEn.size).toBe(0);
    for (const t of c.topics) expect(topicForLang(c, t, "en")).toBe(t);
  });
  it("an en.yaml overlay is picked up when present (fixture)", () => {
    const root = fs.mkdtempSync(path.join("/tmp", "cs-en-fixture-"));
    fs.cpSync(path.join(process.cwd(), "content"), root, { recursive: true });
    const zhFile = path.join(root, "topics/os/syscall/zh.yaml");
    const enFile = path.join(root, "topics/os/syscall/en.yaml");
    fs.writeFileSync(enFile, fs.readFileSync(zhFile, "utf8").replace(/title: .*/, "title: EN Overlay Title"));
    const fc = readContent(root);
    expect(fc.topicsEn.get("os/syscall")?.title).toBe("EN Overlay Title");
    expect(topicForLang(fc, fc.topics.find((t) => t.id === "os/syscall")!, "en").title).toBe("EN Overlay Title");
    expect(topicForLang(fc, fc.topics.find((t) => t.id === "os/syscall")!, "zh").title).not.toBe("EN Overlay Title");
  });
});
