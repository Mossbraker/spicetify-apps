import { statsDebug } from "./debug";

type CacheEntry<T> = {
	value: T;
	cachedAt: number;
	lastAccessedAt: number;
	hits: number;
};

type InvalidatedCacheEntry = {
	key: string;
	status: "stale";
	ageMs: number;
	idleMs: number;
	hits: number;
	invalidatedAt: number;
	reason?: string;
};

export type CacheDiagnostic = {
	key: string;
	status: "fresh" | "stale";
	ageMs: number;
	idleMs: number;
	hits: number;
	invalidatedAt?: number;
	reason?: string;
};

const cache = new Map<string, CacheEntry<unknown>>();
const recentInvalidations: InvalidatedCacheEntry[] = [];
const MAX_INVALIDATION_DIAGNOSTICS = 8;

const getEntry = <T,>(key: string) => cache.get(key) as CacheEntry<T> | undefined;

const touch = <T,>(key: string) => {
	const entry = getEntry<T>(key);
	if (!entry) return undefined;
	entry.hits += 1;
	entry.lastAccessedAt = Date.now();
	return entry;
};

export const set = <T>(key: string, value: T) => {
	const now = Date.now();
	cache.set(key, {
		value,
		cachedAt: now,
		lastAccessedAt: now,
		hits: 0,
	});
	statsDebug.info("Cache populated", { key });
	return value;
};

const invalidate = (key: string, reason = "Manual refresh") => {
	const entry = cache.get(key);
	if (!entry) return;

	cache.delete(key);
	recentInvalidations.unshift({
		key,
		status: "stale",
		ageMs: Date.now() - entry.cachedAt,
		idleMs: Date.now() - entry.lastAccessedAt,
		hits: entry.hits,
		invalidatedAt: Date.now(),
		reason,
	});
	if (recentInvalidations.length > MAX_INVALIDATION_DIAGNOSTICS) {
		recentInvalidations.splice(MAX_INVALIDATION_DIAGNOSTICS);
	}
	statsDebug.info("Cache invalidated", { key, reason, hits: entry.hits });
};

export const getCacheDiagnostics = (): CacheDiagnostic[] => {
	const now = Date.now();
	const freshEntries = [...cache.entries()]
		.map(([key, entry]) => ({
			key,
			status: "fresh" as const,
			ageMs: now - entry.cachedAt,
			idleMs: now - entry.lastAccessedAt,
			hits: entry.hits,
		}))
		.sort((left, right) => left.idleMs - right.idleMs);

	const staleEntries = recentInvalidations.map((entry) => ({
		key: entry.key,
		status: entry.status,
		ageMs: entry.ageMs,
		idleMs: now - entry.invalidatedAt,
		hits: entry.hits,
		invalidatedAt: entry.invalidatedAt,
		reason: entry.reason,
	}));

	return [...freshEntries, ...staleEntries];
};

// cache a specific function
export const cacher = <T>(cb: () => Promise<T>) => {
	return async ({ queryKey }: { queryKey: string[] }) => {
		const key = queryKey.join("-");
		const cachedEntry = touch<T>(key);
		if (cachedEntry) return cachedEntry.value;

		statsDebug.info("Cache miss", { key });
		const result = await cb();
		set(key, result);
		return result;
	};
};

// cache a batch function
export const batchCacher = <T>(prefix: string, cb: (ids: string[]) => Promise<(T | undefined)[]>) => {
	return async (ids: string[]) => {
		const uncached = ids.filter((id) => !cache.has(`${prefix}-${id}`));
		if (uncached.length > 0) {
			statsDebug.info("Batch cache miss", { prefix, requested: ids.length, uncached: uncached.length });
			const results = await cb(uncached);
			uncached.forEach((id, index) => {
				const result = results[index];
				if (result !== undefined) {
					set(`${prefix}-${id}`, result);
				}
			});
		}

		return ids.map((id) => touch<T>(`${prefix}-${id}`)?.value);
	};
};

export const invalidator = async <T>(queryKey: string[], refetch: () => Promise<T>) => {
	invalidate(queryKey.join("-"));
	return refetch();
};
