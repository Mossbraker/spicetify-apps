import type * as LastFM from "../types/lastfm";
import { apiFetch } from "./spotify";

type LastFmImage = {
	"#text": string;
};

type ArtistTopAlbumsResponse = {
	topalbums?: {
		album?: {
			image?: LastFmImage[];
		}[];
	};
};

type TrackInfoResponse = {
	track?: {
		album?: {
			image?: LastFmImage[];
		};
	};
};

const LASTFM_PLACEHOLDER_HASHES = [
	"2a96cbd8b46e442fc41c2b86b821562f",
	"c6f59c1e5e7240a4c0d427abd71f3dbb",
];

const toHttpsUrl = (url?: string) => (url ? url.replace(/^http:\/\//i, "https://") : undefined);

const isPlaceholderImage = (url?: string) =>
	Boolean(url && LASTFM_PLACEHOLDER_HASHES.some((hash) => url.includes(hash)));

export const getLastFmImageUrl = (images?: LastFmImage[]) => {
	if (!images?.length) return undefined;
	const image = [...images].reverse().find((entry) => entry?.["#text"]?.trim());
	const url = toHttpsUrl(image?.["#text"]);
	return isPlaceholderImage(url) ? undefined : url;
};

const lfmperiods = {
	extra_short_term: "7day",
	short_term: "1month",
	medium_term: "6month",
	long_term: "overall",
} as const;

const val = <T>(res: T | undefined) => {
	if (!res || (Array.isArray(res) && !res.length)) throw new Error("Lastfm returned an empty result. Try again later.");
	return res;
};

export const getTopTracks = async (key: string, user: string, range: keyof typeof lfmperiods) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${user}&api_key=${key}&limit=100&format=json&period=${lfmperiods[range]}`;
	const res = await apiFetch<LastFM.TopTracksResponse>("lfmTopTracks", url);
	return val(res?.toptracks?.track);
};

export const getTopArtists = async (key: string, user: string, range: keyof typeof lfmperiods) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${user}&api_key=${key}&limit=100&format=json&period=${lfmperiods[range]}`;
	const res = await apiFetch<LastFM.TopArtistsResponse>("lfmTopArtists", url);
	return val(res?.topartists?.artist);
};

export const getTopAlbums = async (key: string, user: string, range: keyof typeof lfmperiods) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${user}&api_key=${key}&limit=100&format=json&period=${lfmperiods[range]}`;
	const res = await apiFetch<LastFM.TopAlbumsResponse>("lfmTopAlbums", url);
	return val(res?.topalbums?.album);
};

export const getArtistChart = async (key: string) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${key}&format=json`;
	const res = await apiFetch<LastFM.ArtistChartResponse>("lfmArtistChart", url);
	return val(res?.artists?.artist);
};

export const getTrackChart = async (key: string) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${key}&format=json`;
	const res = await apiFetch<LastFM.TrackChartResponse>("lfmTrackChart", url);
	return val(res?.tracks?.track);
};

export const getArtistTopAlbumImage = async (key: string, artist: string) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=${encodeURIComponent(artist)}&api_key=${key}&autocorrect=1&limit=1&format=json`;
	const response = await apiFetch<ArtistTopAlbumsResponse>("lfmArtistTopAlbumImage", url, false);
	return getLastFmImageUrl(response?.topalbums?.album?.[0]?.image) ?? null;
};

export const getTrackAlbumImage = async (key: string, artist: string, track: string) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${key}&autocorrect=1&format=json`;
	const response = await apiFetch<TrackInfoResponse>("lfmTrackAlbumImage", url, false);
	return getLastFmImageUrl(response?.track?.album?.image) ?? null;
};

export const getArtistTopTags = async (key: string, artist: string) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(artist)}&api_key=${key}&format=json`;
	const response = await apiFetch<LastFM.ArtistTopTagsResponse>("lfmArtistTopTags", url, false);
	return (response?.toptags?.tag ?? [])
		.map((tag) => ({
			name: tag.name,
			count: Number(tag.count) || 0,
		}))
		.filter((tag) => tag.name);
};

export const getArtistInfo = async (key: string, artist: string, username?: string) => {
	let url = `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${encodeURIComponent(artist)}&api_key=${key}&format=json`;
	if (username) url += `&username=${encodeURIComponent(username)}`;
	const res = await apiFetch<LastFM.ArtistInfoResponse>("lfmArtistInfo", url, false);
	return res?.artist ?? null;
};

export const getArtistGlobalTopTracks = async (key: string, artist: string, limit = 50) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTracks&artist=${encodeURIComponent(artist)}&api_key=${key}&limit=${limit}&format=json`;
	const res = await apiFetch<LastFM.ArtistTopTracksResponse>("lfmArtistTopTracks", url, false);
	return res?.toptracks?.track ?? [];
};

export const getUserTopTracksForArtist = async (
	key: string,
	artist: string,
	username: string,
	limit = 20,
): Promise<{ name: string; url: string; userPlaycount: number }[]> => {
	// Fetch artist's global top tracks
	const globalTracks = await getArtistGlobalTopTracks(key, artist, limit);
	if (!globalTracks.length) return [];

	// Enrich each track with user play count via track.getInfo
	const CONCURRENCY = 5;
	const results: { name: string; url: string; userPlaycount: number }[] = [];

	for (let i = 0; i < globalTracks.length; i += CONCURRENCY) {
		const batch = globalTracks.slice(i, i + CONCURRENCY);
		const batchResults = await Promise.allSettled(
			batch.map(async (track) => {
				const cacheKey = `lfmTrackUserInfo:${artist}:${track.name}`;
				const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track.name)}&username=${encodeURIComponent(username)}&api_key=${key}&autocorrect=1&format=json`;
				const res = await apiFetch<{ track?: { userplaycount?: string; url?: string } }>(cacheKey, url, false);
				return {
					name: track.name,
					url: track.url,
					userPlaycount: Number(res?.track?.userplaycount ?? 0),
				};
			}),
		);
		for (const r of batchResults) {
			if (r.status === "fulfilled" && r.value.userPlaycount > 0) {
				results.push(r.value);
			}
		}
	}

	return results.sort((a, b) => b.userPlaycount - a.userPlaycount);
};
