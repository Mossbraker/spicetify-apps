const searchCache = new Map<string, { uri: string; ts: number }>();
const SEARCH_CACHE_TTL = 30 * 60 * 1000;

export async function searchAndNavigate(
	type: "artist" | "album" | "track",
	query: string,
	fallbackUrl: string,
): Promise<void> {
	const cacheKey = `${type}:${query}`;
	const cached = searchCache.get(cacheKey);
	if (cached && Date.now() - cached.ts < SEARCH_CACHE_TTL) {
		const id = cached.uri.split(":")[2];
		Spicetify.Platform.History.push(`/${type}/${id}`);
		return;
	}

	try {
		const res = await Spicetify.CosmosAsync.get(
			`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=1`,
		);
		const items = res[`${type}s`]?.items;
		if (items?.[0]?.uri) {
			const uri = items[0].uri;
			if (searchCache.size > 200) {
				const oldest = searchCache.keys().next().value;
				if (oldest) searchCache.delete(oldest);
			}
			searchCache.set(cacheKey, { uri, ts: Date.now() });
			const id = uri.split(":")[2];
			Spicetify.Platform.History.push(`/${type}/${id}`);
		} else {
			window.open(fallbackUrl, "_blank", "noreferrer");
		}
	} catch {
		window.open(fallbackUrl, "_blank", "noreferrer");
	}
}
