import type * as Spotify from "../types/spotify";
import { statsDebug } from "../extensions/debug";
import { isOAuthEnabled, hasValidTokens, oauthFetch } from "./oauth";

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/";

type SuppressedEndpoint = {
	status: number;
	reason: string;
	until: number;
};

const ENDPOINT_SUPPRESSION_STORAGE_KEY = "stats:spotify:endpoint-suppressions";

const endpointSuppressions = new Map<string, SuppressedEndpoint>();

const setSuppressionActivity = (endpointKey: string, suppression: SuppressedEndpoint) => {
	statsDebug.setActivity({
		key: `suppression:${endpointKey}`,
		kind: "suppression",
		title: `Spotify ${endpointKey}`,
		detail: buildSuppressedMessage(endpointKey, suppression),
		until: suppression.until,
		createdAt: Date.now(),
	});
};

const loadSuppressions = () => {
	if (endpointSuppressions.size > 0) return;

	try {
		const raw = localStorage.getItem(ENDPOINT_SUPPRESSION_STORAGE_KEY);
		if (!raw) return;

		const parsed = JSON.parse(raw) as Record<string, SuppressedEndpoint>;
		const now = Date.now();
		for (const [key, value] of Object.entries(parsed)) {
			if (value.until > now) {
				endpointSuppressions.set(key, value);
				setSuppressionActivity(key, value);
			}
		}
	} catch {
		localStorage.removeItem(ENDPOINT_SUPPRESSION_STORAGE_KEY);
	}
};

const persistSuppressions = () => {
	const now = Date.now();
	const entries = [...endpointSuppressions.entries()].filter(([, value]) => value.until > now);
	if (entries.length === 0) {
		localStorage.removeItem(ENDPOINT_SUPPRESSION_STORAGE_KEY);
		return;
	}

	localStorage.setItem(ENDPOINT_SUPPRESSION_STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
};

const getEndpointKey = (url: string) => {
	if (url.includes("/v1/me/top/artists")) return "me-top-artists";
	if (url.includes("/v1/me/top/tracks")) return "me-top-tracks";
	if (url.includes("/v1/audio-features")) return "audio-features";
	if (url.includes("/v1/artists?ids=")) return "artist-metas";
	if (url.includes("/v1/albums?ids=")) return "album-metas";
	if (url.includes("/v1/tracks?ids=")) return "track-metas";
	if (url.includes("/v1/search?") && url.includes("type=artist")) return "search-artist";
	if (url.includes("/v1/search?") && url.includes("type=album")) return "search-album";
	if (url.includes("/v1/search?") && url.includes("type=track")) return "search-track";
	if (url.includes("/v1/me/tracks/contains")) return "query-liked";
	if (url.includes("/v1/me/playlists")) return "user-playlists";
	if (url.includes("/v1/playlists/")) return "playlist-meta";
	return url.replace(/^https?:\/\/api\.spotify\.com\/v1\//, "").split("?")[0];
};

const getSuppressionDurationMs = (endpointKey: string, status: number, retryAfterSeconds?: number) => {
	if (status === 429) {
		const retryAfterMs = retryAfterSeconds ? retryAfterSeconds * 1000 : 60_000;
		return Math.max(retryAfterMs, 15_000);
	}

	if (status === 403) {
		if (endpointKey === "audio-features" || endpointKey === "artist-metas") return 30 * 60_000;
		return 10 * 60_000;
	}

	if (status === 400) return 10 * 60_000;

	return 60_000;
};

const buildSuppressedMessage = (endpointKey: string, suppression: SuppressedEndpoint) => {
	const secondsRemaining = Math.max(1, Math.ceil((suppression.until - Date.now()) / 1000));
	if (suppression.status === 429) {
		return `Spotify rate-limited ${endpointKey}. Skipping retries for ${secondsRemaining}s.`;
	}

	return `Spotify ${endpointKey} requests are temporarily disabled after repeated ${suppression.status} responses.`;
};

const createSuppressedError = (endpointKey: string, suppression: SuppressedEndpoint) => {
	const error = new Error(buildSuppressedMessage(endpointKey, suppression)) as Error & {
		status?: number;
		endpointKey?: string;
		suppressed?: boolean;
	};
	error.status = suppression.status;
	error.endpointKey = endpointKey;
	error.suppressed = true;
	return error;
};

const getActiveSuppression = (endpointKey: string) => {
	loadSuppressions();
	const suppression = endpointSuppressions.get(endpointKey);
	if (!suppression) return null;
	if (suppression.until <= Date.now()) {
		endpointSuppressions.delete(endpointKey);
		statsDebug.clearActivity(`suppression:${endpointKey}`);
		persistSuppressions();
		return null;
	}
	setSuppressionActivity(endpointKey, suppression);
	return suppression;
};

const suppressEndpoint = (endpointKey: string, status: number, reason: string, retryAfterSeconds?: number) => {
	const suppression = {
		status,
		reason,
		until: Date.now() + getSuppressionDurationMs(endpointKey, status, retryAfterSeconds),
	};
	endpointSuppressions.set(endpointKey, suppression);
	setSuppressionActivity(endpointKey, suppression);
	statsDebug.warn("Spotify endpoint suppressed", {
		endpointKey,
		status,
		reason,
		retryAfterSeconds,
		suppressedUntil: new Date(suppression.until).toISOString(),
	});
	persistSuppressions();
	return createSuppressedError(endpointKey, suppression);
};

const extractStatus = (error: unknown) => {
	if (!error || typeof error !== "object") {
		if (typeof error === "string") {
			const match = error.match(/\b(400|401|403|404|429)\b/);
			return match ? Number(match[1]) : undefined;
		}
		return undefined;
	}

	const e = error as Record<string, unknown>;
	if (typeof e.code === "number") return e.code;
	if (typeof e.status === "number") return e.status;
	if (typeof e.message === "string") {
		const match = e.message.match(/\b(400|401|403|404|429)\b/);
		return match ? Number(match[1]) : undefined;
	}
	return undefined;
};

const extractRetryAfterSeconds = (error: unknown) => {
	if (!error || typeof error !== "object") return undefined;
	const e = error as Record<string, unknown>;
	if (typeof e.retryAfter === "number") return e.retryAfter;
	if (typeof e.message === "string") {
		const match = e.message.match(/Retry after (\d+)/i);
		return match ? Number(match[1]) : undefined;
	}
	return undefined;
};

export const clearSpotifyRequestSuppressions = () => {
	for (const endpointKey of endpointSuppressions.keys()) {
		statsDebug.clearActivity(`suppression:${endpointKey}`);
	}
	endpointSuppressions.clear();
	localStorage.removeItem(ENDPOINT_SUPPRESSION_STORAGE_KEY);
	statsDebug.info("Cleared Spotify request suppressions");
};

export const isSuppressedSpotifyError = (error: unknown): boolean => {
	if (!error || typeof error !== "object") return false;
	return Boolean((error as { suppressed?: boolean }).suppressed);
};

// Helper to detect rate limit errors from CosmosAsync exceptions
const isRateLimitError = (error: unknown): boolean => {
	if (!error || typeof error !== "object") return false;
	const e = error as Record<string, unknown>;
	return (
		e.code === 429 ||
		e.status === 429 ||
		(typeof e.message === "string" && e.message.includes("429"))
	);
};

const isSpotifyApiUrl = (url: string) => url.startsWith(SPOTIFY_API_BASE_URL);

const externalFetch = async <T>(url: string): Promise<T> => {
	const response = await fetch(url, {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		const retryAfter = response.headers.get("Retry-After");
		statsDebug.warn("External request failed", {
			url,
			status: response.status,
			retryAfter,
		});
		throw {
			code: response.status,
			retryAfter: retryAfter ? Number(retryAfter) : undefined,
			message: response.statusText,
		};
	}

	return response.json();
};

/**
 * Try using the internal Spotify client token with direct fetch.
 * This may bypass CosmosAsync middleware rate limiting.
 */
const directFetch = async <T>(url: string): Promise<T> => {
	const token = Spicetify.Platform?.AuthorizationAPI?.getState?.()?.token?.accessToken;
	if (!token) {
		statsDebug.warn("Direct fetch unavailable because no internal token was found");
		throw new Error("No internal token available");
	}

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (response.status === 429) {
		const retryAfter = response.headers.get("Retry-After");
		statsDebug.warn("Direct Spotify fetch rate-limited", {
			url,
			retryAfter,
		});
		throw {
			code: 429,
			retryAfter: retryAfter ? Number(retryAfter) : undefined,
			message: `Rate limited. Retry after ${retryAfter || "unknown"} seconds`,
		};
	}

	if (!response.ok) {
		statsDebug.warn("Direct Spotify fetch failed", {
			url,
			status: response.status,
			message: response.statusText,
		});
		throw { code: response.status, message: response.statusText };
	}

	return response.json();
};

/**
 * Core API fetch function.
 * Priority: OAuth > Direct Fetch > CosmosAsync
 */
export const apiFetch = async <T>(name: string, url: string, log = true): Promise<T> => {
	if (!isSpotifyApiUrl(url)) {
		const timeStart = window.performance.now();
		const response = await externalFetch<T>(url);
		if (log) console.log("stats -", name, "fetch time:", window.performance.now() - timeStart);
		return response;
	}

	const endpointKey = getEndpointKey(url);
	const activeSuppression = getActiveSuppression(endpointKey);
	if (activeSuppression) {
		statsDebug.info("Skipping suppressed Spotify endpoint", {
			endpointKey,
			url,
			suppressedUntil: new Date(activeSuppression.until).toISOString(),
		});
		throw createSuppressedError(endpointKey, activeSuppression);
	}

	// Use OAuth if enabled and connected
	if (isOAuthEnabled() && hasValidTokens()) {
		try {
			const timeStart = window.performance.now();
			const response = await oauthFetch<T>(url);
			if (log) console.log("stats -", name, "fetch time (OAuth):", window.performance.now() - timeStart);
			return response;
		} catch (error) {
			const status = extractStatus(error);
			if (status === 400 || status === 403 || status === 429) {
				throw suppressEndpoint(endpointKey, status, name, extractRetryAfterSeconds(error));
			}
			statsDebug.warn("OAuth fetch failed", {
				name,
				url,
				status,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	// Try direct fetch with internal token first (may bypass CosmosAsync rate limits)
	const useDirectFetch = globalThis.SpicetifyStats?.ConfigWrapper?.Config?.["use-direct-fetch"] ?? false;
	if (useDirectFetch && Spicetify.Platform?.AuthorizationAPI) {
		try {
			const timeStart = window.performance.now();
			const response = await directFetch<T>(url);
			if (log) console.log("stats -", name, "fetch time (direct):", window.performance.now() - timeStart);
			return response;
		} catch (error) {
			const status = extractStatus(error);
			if (status === 400 || status === 403 || status === 429) {
				throw suppressEndpoint(endpointKey, status, name, extractRetryAfterSeconds(error));
			}
			statsDebug.warn("Direct fetch failed; falling back to CosmosAsync", {
				name,
				url,
				status,
				error: error instanceof Error ? error.message : String(error),
			});
			console.log("stats -", name, "direct fetch failed, falling back to CosmosAsync:", error);
			// Fall through to CosmosAsync
		}
	}

	// Fall back to CosmosAsync with retry logic
	try {
		const timeStart = window.performance.now();
		const response = await Spicetify.CosmosAsync.get(url);

		if (response.code === 429) {
			throw suppressEndpoint(endpointKey, 429, name);
		}

		if (response.code === 400 || response.code === 403) {
			throw suppressEndpoint(endpointKey, response.code, name);
		}

		if (response.code || response.error)
			throw new Error(
				`Failed to fetch the info from server. Try again later. ${name.includes("lfm") ? "Check your LFM API key and username." : ""}`,
			);
		if (log) console.log("stats -", name, "fetch time:", window.performance.now() - timeStart);
		return response;
	} catch (error) {
		const status = extractStatus(error);
		if (status === 400 || status === 403 || status === 429 || isRateLimitError(error)) {
			throw suppressEndpoint(endpointKey, status ?? 429, name, extractRetryAfterSeconds(error));
		}
		statsDebug.error("Spotify request failed", {
			name,
			url,
			status,
			error: error instanceof Error ? error.message : String(error),
		});
		console.log("stats -", name, "request failed:", error);
		throw error as Error;
	}
};

const val = <T>(res: T | undefined) => {
	if (!res || (Array.isArray(res) && !res.length))
		throw new Error("Spotify returned an empty result. Try again later.");
	return res;
};

const f = (param: string) => {
	return encodeURIComponent(param.replace(/'/g, ""));
};

export const getTopTracks = (range: Spotify.SpotifyRange) => {
	return apiFetch<Spotify.TopTracksResponse>(
		"topTracks",
		`https://api.spotify.com/v1/me/top/tracks?limit=50&offset=0&time_range=${range}`,
	).then((res) => val(res.items));
};

export const getTopArtists = (range: Spotify.SpotifyRange) => {
	return apiFetch<Spotify.TopArtistsResponse>(
		"topArtists",
		`https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=${range}`,
	).then((res) => val(res.items));
};

/**
 * @param ids - max: 50
 */
export const getArtistMetas = (ids: string[]) => {
	return apiFetch<Spotify.SeveralArtistsResponse>("artistMetas", `https://api.spotify.com/v1/artists?ids=${ids}`).then(
		(res) => res.artists,
	);
};

export const getAlbumMetas = (ids: string[]) => {
	return apiFetch<Spotify.SeveralAlbumsResponse>("albumMetas", `https://api.spotify.com/v1/albums?ids=${ids}`).then(
		(res) => res.albums,
	);
};

export const getTrackMetas = (ids: string[]) => {
	return apiFetch<Spotify.SeveralTracksResponse>("trackMetas", `https://api.spotify.com/v1/tracks?ids=${ids}`).then(
		(res) => res.tracks,
	);
};

export const getAudioFeatures = (ids: string[]) => {
	return apiFetch<Spotify.SeveralAudioFeaturesResponse>(
		"audioFeatures",
		`https://api.spotify.com/v1/audio-features?ids=${ids}`,
	).then((res) => res.audio_features);
};

export const searchForTrack = (track: string, artist: string) => {
	return apiFetch<Spotify.SearchResponse>(
		"searchForTrack",
		`https://api.spotify.com/v1/search?q=track:${f(track)}+artist:${f(artist)}&type=track&limit=50`,
	).then((res) => res.tracks.items);
};

export const searchForArtist = (artist: string) => {
	return apiFetch<Spotify.SearchResponse>(
		"searchForArtist",
		`https://api.spotify.com/v1/search?q=artist:${f(artist)}&type=artist&limit=50`,
	).then((res) => res.artists.items);
};

export const searchForAlbum = (album: string, artist: string) => {
	return apiFetch<Spotify.SearchResponse>(
		"searchForAlbum",
		`https://api.spotify.com/v1/search?q=album:${f(album)}+artist:${f(artist)}&type=album&limit=50`,
	).then((res) => res.albums.items);
};

export const queryLiked = (ids: string[]) => {
	return apiFetch<boolean[]>("queryLiked", `https://api.spotify.com/v1/me/tracks/contains?ids=${ids}`);
};

export const getPlaylistMeta = (id: string) => {
	return apiFetch<Spotify.PlaylistResponse>("playlistMeta", `https://api.spotify.com/v1/playlists/${id}`);
};

export const getUserPlaylists = () => {
	return apiFetch<Spotify.UserPlaylistsResponse>("userPlaylists", "https://api.spotify.com/v1/me/playlists").then(
		(res) => res.items,
	);
};
