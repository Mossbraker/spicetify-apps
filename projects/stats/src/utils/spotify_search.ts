import { searchForTrack, searchForArtist, isSuppressedSpotifyError } from "../api/spotify";

const COSMOS_CACHE_TTL_MS = 30 * 60 * 1000;
const cosmosCache = new Map<string, { uri: string; ts: number }>();

function getCosmosCached(key: string): string | undefined {
	const entry = cosmosCache.get(key);
	if (!entry) return undefined;
	if (Date.now() - entry.ts < COSMOS_CACHE_TTL_MS) return entry.uri;
	cosmosCache.delete(key);
	return undefined;
}

async function cosmosFallbackSearch(
	type: "artist" | "track",
	name: string,
	artistName?: string,
): Promise<string | undefined> {
	const cacheKey = `${type}:${name}:${artistName ?? ""}`;
	const cached = getCosmosCached(cacheKey);
	if (cached) return cached;

	const q =
		type === "track"
			? `track:${name.replace(/'/g, "")} artist:${(artistName ?? "").replace(/'/g, "")}`
			: `artist:${name.replace(/'/g, "")}`;
	const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type}&limit=1&market=from_token`;

	const res = await Spicetify.CosmosAsync.get(url);
	const items = type === "track" ? res?.tracks?.items : res?.artists?.items;
	const uri: string | undefined = items?.[0]?.uri;

	if (uri) {
		cosmosCache.set(cacheKey, { uri, ts: Date.now() });
	}
	return uri;
}

function navigateToUri(type: "artist" | "track", uri: string): void {
	const id = uri.split(":")[2];
	Spicetify.Platform.History.push(`/${type}/${id}`);
}

export async function searchAndNavigate(
	type: "artist" | "track",
	name: string,
	fallbackUrl: string,
	artistName?: string,
): Promise<void> {
	// Try the normal apiFetch-based search first
	try {
		let uri: string | undefined;
		if (type === "track") {
			const items = await searchForTrack(name, artistName ?? "");
			uri = items?.[0]?.uri;
		} else {
			const items = await searchForArtist(name);
			uri = items?.[0]?.uri;
		}
		if (uri) {
			navigateToUri(type, uri);
			return;
		}
	} catch (error: unknown) {
		// If the endpoint is suppressed (e.g. from prior 429s), fall back to CosmosAsync
		if (isSuppressedSpotifyError(error)) {
			try {
				const uri = await cosmosFallbackSearch(type, name, artistName);
				if (uri) {
					navigateToUri(type, uri);
					return;
				}
			} catch {
				// CosmosAsync also failed — fall through to external URL
			}
		}
	}
	window.open(fallbackUrl, "_blank", "noreferrer");
}
