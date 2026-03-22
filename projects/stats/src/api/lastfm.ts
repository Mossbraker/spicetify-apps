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

export const getTopTracks = (key: string, user: string, range: keyof typeof lfmperiods) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${user}&api_key=${key}&limit=100&format=json&period=${lfmperiods[range]}`;
	return apiFetch<LastFM.TopTracksResponse>("lfmTopTracks", url).then((res) => val(res?.toptracks?.track));
};

export const getTopArtists = (key: string, user: string, range: keyof typeof lfmperiods) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${user}&api_key=${key}&limit=100&format=json&period=${lfmperiods[range]}`;
	return apiFetch<LastFM.TopArtistsResponse>("lfmTopArtists", url).then((res) => val(res?.topartists?.artist));
};

export const getTopAlbums = (key: string, user: string, range: keyof typeof lfmperiods) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${user}&api_key=${key}&limit=100&format=json&period=${lfmperiods[range]}`;
	return apiFetch<LastFM.TopAlbumsResponse>("lfmTopAlbums", url).then((res) => val(res?.topalbums?.album));
};

export const getArtistChart = (key: string) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${key}&format=json`;
	return apiFetch<LastFM.ArtistChartResponse>("lfmArtistChart", url).then((res) => val(res?.artists?.artist));
};

export const getTrackChart = (key: string) => {
	const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${key}&format=json`;
	return apiFetch<LastFM.TrackChartResponse>("lfmTrackChart", url).then((res) => val(res?.tracks?.track));
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
