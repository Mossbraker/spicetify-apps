import { version } from "../../package.json";
import { fetchWithRetry } from "../utils/fetch-with-retry";

type MusicBrainzTag = {
	count?: number;
	name: string;
};

type MusicBrainzArtist = {
	id?: string;
	name: string;
	score?: number;
	genres?: MusicBrainzTag[];
	tags?: MusicBrainzTag[];
};

type MusicBrainzArtistSearchResponse = {
	artists?: MusicBrainzArtist[];
};

type MusicBrainzArtistDetailsResponse = {
	genres?: MusicBrainzTag[];
	tags?: MusicBrainzTag[];
};

const SEARCH_LIMIT = 3;
const SERVICE_COOLDOWN_MS = 10 * 60 * 1000;
const artistGenresCache = new Map<string, Promise<MusicBrainzTag[]>>();
let serviceUnavailableUntil = 0;

const normalizeName = (value: string) => value.trim().toLocaleLowerCase();

const sortByCount = (tags: MusicBrainzTag[]) => [...tags].sort((left, right) => (right.count ?? 0) - (left.count ?? 0));

const isCoolingDown = () => Date.now() < serviceUnavailableUntil;

const startCooldown = () => {
	serviceUnavailableUntil = Date.now() + SERVICE_COOLDOWN_MS;
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
	if (isCoolingDown()) return null;

	try {
		const response = await fetchWithRetry(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": `spicetify-stats/${version} (https://github.com/harbassan/spicetify-apps)`,
			},
		});

		if (response.status === 429 || response.status === 503) {
			startCooldown();
			return null;
		}

		if (!response.ok) return null;
		return (await response.json()) as T;
	} catch {
		// Network error after all retries exhausted
		return null;
	}
};

const mergeTags = (tags: MusicBrainzTag[]) => {
	const merged = new Map<string, number>();
	for (const tag of tags) {
		if (!tag?.name) continue;
		const key = normalizeName(tag.name);
		merged.set(key, Math.max(merged.get(key) ?? 0, tag.count ?? 0));
	}

	return [...merged.entries()].map(([name, count]) => ({ name, count }));
};

export const getArtistGenres = async (artist: string) => {
	const normalizedArtist = normalizeName(artist);
	const cached = artistGenresCache.get(normalizedArtist);
	if (cached) return cached;

	if (isCoolingDown()) return [];

	const pending = (async () => {
		const query = encodeURIComponent(`artist:${artist}`);
		const payload = await fetchJson<MusicBrainzArtistSearchResponse>(
			`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json&limit=${SEARCH_LIMIT}`,
		);
		if (payload === null) {
			artistGenresCache.delete(normalizedArtist);
			return [] as MusicBrainzTag[];
		}
		const artists = payload.artists ?? [];
		if (artists.length === 0) return [];

		const target = artists.find((candidate) => normalizeName(candidate.name) === normalizedArtist) ?? artists[0];
		if (!target.id) return sortByCount(mergeTags([...(target.genres ?? []), ...(target.tags ?? [])]));

		const details = await fetchJson<MusicBrainzArtistDetailsResponse>(
			`https://musicbrainz.org/ws/2/artist/${target.id}?inc=genres+tags&fmt=json`,
		);
		if (!details) return sortByCount(mergeTags([...(target.genres ?? []), ...(target.tags ?? [])]));

		return sortByCount(mergeTags([...(details.genres ?? []), ...(details.tags ?? [])]));
	})();

	artistGenresCache.set(normalizedArtist, pending);
	return pending;
};