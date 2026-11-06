import { describe, expect, it } from "vitest";
import { checkTopic, Topic, type SourceDef } from "@/lib/schema";
import { indexFromPath } from "@/components/player/usePlayer";
import { stepPath } from "@/lib/paths";
import { readContent } from "@/lib/content";

const sources = new Map<string, SourceDef>([["book", { id: "book", title: "B", url: "https://example.com" }]]);
const verified = { ref: "book", locator: "p.1", claim: "c", status: "verified" as const, checkedBy: "Daniel", checkedAt: "2026-11-01" };
function topic(over: Record<string, unknown> = {}, step: Record<string, unknown> = {}) {
  return Topic.parse({
    id: "os/x", subject: "os", slug: "x", order: 1, status: "published", title: "T", summary: "S", premise: "P",
    overview: [], visual: "swimlane", lanes: [{ id: "u", label: "U" }], logColumns: [{ key: "e", label: "E" }],
    reviewedBy: "Daniel", reviewedAt: "2026-11-01",
    steps: [{ id: "s1", title: "t", tldr: "t", body: "b", derivation: "original", sources: [verified], canvas: { kind: "swimlane", actors: [{ lane: "u", id: "a", label: "A" }], messages: [] }, log: [], ...step }],
    ...over,
  });
}
const errors = (t: ReturnType<typeof topic>) => checkTopic(t, sources).filter((i) => i.level === "error").map((i) => i.msg);

describe("content rules (no verification gate)", () => {
  it("valid published topic passes", () => expect(errors(topic())).toEqual([]));
  it("published with no sources, pending status, no sign-off passes", () => {
    expect(errors(topic({ reviewedBy: undefined, reviewedAt: undefined }, { sources: [] }))).toEqual([]);
    expect(errors(topic({}, { sources: [{ ...verified, status: "pending" }] }))).toEqual([]);
  });
  it("adapted without NC-SA license fails", () => expect(errors(topic({ status: "draft" }, { derivation: "adapted" }))[0]).toMatch(/adapted/));
  it("unknown ref fails", () => expect(errors(topic({}, { sources: [{ ...verified, ref: "nope" }] }))[0]).toMatch(/ref=nope/));
});

describe("A: extended fields", () => {
  it("accepts level/minutes/prereq/objectives/aiLink/quiz and step code/points/mistake", () => {
    const t2 = topic({ subject: "network", id: "network/x", level: "基础", minutes: 10, prereq: ["os/syscall"], objectives: ["懂握手"], aiLink: "与流式 API 有关", quiz: [{ q: "q", options: ["a", "b", "c", "d"], answer: 1, explain: "e" }] }, { code: { lang: "ts", code: "let x=1" }, points: ["p"], mistake: "m" });
    expect(t2.level).toBe("基础"); expect(t2.quiz?.[0]?.answer).toBe(1); expect(t2.steps[0]?.code?.lang).toBe("ts");
  });
  it("rejects quiz with wrong option count", () => {
    expect(() => topic({ quiz: [{ q: "q", options: ["a"], answer: 0, explain: "e" }] })).toThrow();
  });
  it("old topics without new fields still parse", () => expect(errors(topic())).toEqual([]));
});

describe("paths", () => {
  it("round-trips step urls", () => {
    expect(stepPath("os", "syscall", 0)).toBe("/os/syscall/");
    expect(stepPath("os", "syscall", 2)).toBe("/os/syscall/3/");
    expect(indexFromPath("/os/syscall/", "os", "syscall", 5)).toBe(0);
    expect(indexFromPath("/os/syscall/3/", "os", "syscall", 5)).toBe(2);
    expect(indexFromPath("/os/syscall/9/", "os", "syscall", 5)).toBeNull();
  });
});

describe("repo content", () => {
  it("has no errors", () => expect(readContent().issues.filter((i) => i.level === "error")).toEqual([]));
});
