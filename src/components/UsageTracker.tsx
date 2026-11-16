"use client";

import { useEffect } from "react";

import { startUsageTracker } from "@/lib/usage-time";

/**
 * Reports this site's own usage time to the learning app's usage
 * endpoint (app=cs, anonymous per-device totals — same mechanism and
 * counting rules as the other ki-toko sites: foreground page plus an
 * interaction within 3 minutes; local-first, flushed on hide).
 * Added 2026-11-17 so the time dashboard shows cs.ki-toko.com's
 * self-recorded time instead of the ActivityWatch estimate.
 */
export function UsageTracker() {
	useEffect(() => startUsageTracker("cs"), []);
	return null;
}
