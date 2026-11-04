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
const errors = (t: ReturnType<typeof topic>) => checkTopic(t, sources, "2026-11-04").filter((i) => i.level === "error").map((i) => i.msg);
const warns = (t: ReturnType<typeof topic>) => checkTopic(t, sources, "2026-11-04").filter((i) => i.level === "warn").map((i) => i.msg);

describe("§8.2 content rules", () => {
  it("valid published topic passes", () => expect(errors(topic())).toEqual([]));
  it("empty sources: published fails, draft warns", () => {
    expect(errors(topic({}, { sources: [] }))).toContain("sources 为空");
    expect(warns(topic({ status: "draft" }, { sources: [] }))).toContain("sources 为空");
  });
  it("pending: published fails, draft only warns", () => {
    const p = { ...verified, status: "pending" };
    expect(errors(topic({}, { sources: [p] }))).toContain("status=pending");
    expect(errors(topic({ status: "draft" }, { sources: [p] }))).toEqual([]);
  });
  it("verified without checkedAt or in future fails even in draft", () => {
    expect(errors(topic({ status: "draft" }, { sources: [{ ...verified, checkedAt: undefined }] }))[0]).toMatch(/缺 checkedBy/);
    expect(errors(topic({}, { sources: [{ ...verified, checkedAt: "2027-01-01" }] }))[0]).toMatch(/未来/);
  });
  it("adapted without NC-SA license fails", () => {
    expect(errors(topic({ status: "draft" }, { derivation: "adapted" }))[0]).toMatch(/adapted/);
    expect(errors(topic({ license: "CC-BY-NC-SA-4.0" }, { derivation: "adapted" }))).toEqual([]);
  });
  it("unknown ref, missing signoff, unverified without note: all reported together", () => {
    const e = errors(topic({ reviewedBy: undefined }, { sources: [{ ...verified, ref: "nope" }, { ...verified, status: "unverified" }] }));
    expect(e).toEqual(expect.arrayContaining([expect.stringMatching(/签字/), expect.stringMatching(/ref=nope/), expect.stringMatching(/note/)]));
  });
  it("missing locator rejected by zod", () => {
    expect(() => topic({}, { sources: [{ ...verified, locator: "" }] })).toThrow();
  });
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
