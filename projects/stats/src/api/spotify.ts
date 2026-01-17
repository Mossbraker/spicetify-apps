import type * as Spotify from "../types/spotify";
import { isOAuthEnabled, hasValidTokens, oauthFetch } from "./oauth";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry config for rate-limited requests.
// /me/* endpoints have stricter limits and may require longer waits.
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000; // Start with 5s delay for rate-limited retries

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

/**
 * Core API fetch function.
 * Uses OAuth if enabled and has valid tokens, otherwise falls back to CosmosAsync.
 */
export const apiFetch = async <T>(name: string, url: string, log = true): Promise<T> => {
	// Use OAuth if enabled and connected
	if (isOAuthEnabled() && hasValidTokens()) {
		const timeStart = window.performance.now();
		const response = await oauthFetch<T>(url);
		if (log) console.log("stats -", name, "fetch time (OAuth):", window.performance.now() - timeStart);
		return response;
	}

	// Fall back to CosmosAsync with retry logic
	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const timeStart = window.performance.now();
			const response = await Spicetify.CosmosAsync.get(url);

			// Handle rate limiting (429) returned as response code
			if (response.code === 429) {
				if (attempt < MAX_RETRIES) {
					const waitTime = BASE_DELAY_MS * 2 ** attempt;
					console.log("stats -", name, "rate limited (response), retrying in", waitTime, "ms");
					await delay(waitTime);
					continue;
				}
				throw new Error("Rate limited by Spotify. Please wait a moment and try again.");
			}

			if (response.code || response.error)
				throw new Error(
					`Failed to fetch the info from server. Try again later. ${name.includes("lfm") ? "Check your LFM API key and username." : ""}`,
				);
			if (log) console.log("stats -", name, "fetch time:", window.performance.now() - timeStart);
			return response;
		} catch (error) {
			// CosmosAsync may throw exceptions for 429 errors instead of returning them
			if (isRateLimitError(error) && attempt < MAX_RETRIES) {
				const waitTime = BASE_DELAY_MS * 2 ** attempt;
				console.log("stats -", name, "rate limited (exception), retrying in", waitTime, "ms");
				await delay(waitTime);
				continue;
			}
			lastError = error as Error;
			console.log("stats -", name, "request failed:", error);
			break;
		}
	}

	throw lastError;
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
