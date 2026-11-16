/**
 * Cloud-sync budget for the KV-backed endpoints (usage, mastery, favorites, mistakes, due review).
 * Workers Free allows 1,000 KV writes per day, so progress is saved locally during a session and pushed to the
 * server in bounded batches. A failed attempt is not retried immediately, and how long the next attempt waits
 * depends on the failure: a server rejection (429/5xx) means the request reached the server and may have cost
 * quota, so it keeps the long cooldown; a network error (status 0) never reached the server, costs no quota,
 * and is usually a transient radio blip on mobile, so it retries after a short floor instead of poisoning
 * sync for a whole hour. Local data is never cleared.
 */
export const SYNC_FAILURE_COOLDOWN_MS = 60 * 60_000;
export const SYNC_NETWORK_RETRY_MS = 60_000;

const FAILURE_PREFIX = "kv-sync-failed:";
const memoryFailures = new Map<string, { at: number; status: number }>();

type Failure = { at: number; status: number };

function parseFailure(raw: string | null): Failure | null {
	if (!raw) return null;
	const [tsRaw, statusRaw] = raw.split(":");
	const at = Number(tsRaw);
	if (!Number.isFinite(at) || at <= 0) return null;
	// Legacy entries stored only the timestamp; treat them as server failures (long cooldown).
	const status = statusRaw === undefined ? -1 : Number(statusRaw);
	return { at, status: Number.isFinite(status) ? status : -1 };
}

function storedFailure(endpoint: string): Failure | null {
	if (typeof localStorage === "undefined") return null;
	try {
		return parseFailure(localStorage.getItem(FAILURE_PREFIX + endpoint));
	} catch {
		return null;
	}
}

function lastFailure(endpoint: string): Failure | null {
	const mem = memoryFailures.get(endpoint);
	const stored = storedFailure(endpoint);
	if (!mem) return stored;
	if (!stored) return mem;
	return mem.at >= stored.at ? mem : stored;
}

/** False while a recent failure for this endpoint is still cooling down. */
export function canAttemptSync(endpoint: string, now = Date.now()): boolean {
	const failure = lastFailure(endpoint);
	if (!failure) return true;
	if (failure.at > now) return true;
	const floor = failure.status === 0 ? SYNC_NETWORK_RETRY_MS : SYNC_FAILURE_COOLDOWN_MS;
	return now - failure.at >= floor;
}

/** Record an attempt: `status` 0 means a network error. Any non-2xx starts the cooldown. */
export function noteSyncResult(endpoint: string, status: number, now = Date.now()) {
	const ok = status >= 200 && status < 300;
	if (!ok && status === 0) {
		// Several callers note the HTTP status and then throw into a catch that notes a
		// network error for the same attempt. A genuine network error means no response
		// arrived, so it can never follow a server rejection within the same few seconds;
		// keep the server record (and its quota-protecting cooldown) instead of letting
		// the bookkeeping artifact reclassify the failure as transient.
		const existing = lastFailure(endpoint);
		if (existing && existing.status !== 0 && now - existing.at < 5000) return;
	}
	if (ok) memoryFailures.delete(endpoint);
	else memoryFailures.set(endpoint, { at: now, status });
	if (typeof localStorage === "undefined") return;
	try {
		if (ok) localStorage.removeItem(FAILURE_PREFIX + endpoint);
		else localStorage.setItem(FAILURE_PREFIX + endpoint, `${now}:${status}`);
	} catch {
		/* private mode: the in-memory record still blocks retries in this page */
	}
}

export function resetSyncPolicyForTests() {
	memoryFailures.clear();
	if (typeof localStorage === "undefined") return;
	try {
		for (const key of Object.keys(localStorage)) if (key.startsWith(FAILURE_PREFIX)) localStorage.removeItem(key);
	} catch {
		/* ignore */
	}
}
