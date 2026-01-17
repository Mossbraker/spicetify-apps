import { searchForAlbum, searchForArtist, searchForTrack } from "../api/spotify";
import { cacher, set } from "../extensions/cache";
import type * as LastFM from "../types/lastfm";
import type * as Spotify from "../types/spotify";
import type {
	LastFMMinifiedAlbum,
	LastFMMinifiedArtist,
	LastFMMinifiedTrack,
	SpotifyMinifiedAlbum,
	SpotifyMinifiedArtist,
	SpotifyMinifiedTrack,
} from "../types/stats_types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Throttled batch processing to avoid Spotify API rate limits (429 errors).
// Processes items sequentially with a delay between each to stay under rate limits.
// /me/* endpoints have stricter limits (~5-10 req before 429), so we use 1s delay.
const THROTTLE_DELAY_MS = 1000;
export const throttledMap = async <T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> => {
	const results: R[] = [];
	for (let i = 0; i < items.length; i++) {
		results.push(await fn(items[i]));
		// Add delay between requests to avoid rate limiting
		if (i < items.length - 1) await delay(THROTTLE_DELAY_MS);
	}
	return results;
};

export const minifyArtist = (artist: Spotify.Artist): SpotifyMinifiedArtist => ({
	id: artist.id,
	name: artist.name,
	image: artist.images?.at(0)?.url,
	uri: artist.uri,
	genres: artist.genres,
	type: "spotify",
});

export const minifyAlbum = (album: Spotify.SimplifiedAlbum): SpotifyMinifiedAlbum => ({
	id: album.id,
	uri: album.uri,
	name: album.name,
	image: album.images[0]?.url,
	type: "spotify",
});

export const minifyTrack = (track: Spotify.Track): SpotifyMinifiedTrack => ({
	id: track.id,
	uri: track.uri,
	name: track.name,
	duration_ms: track.duration_ms,
	popularity: track.popularity,
	explicit: track.explicit,
	image: track.album.images.at(-1)?.url,
	artists: track.artists.map((artist) => ({
		name: artist.name,
		uri: artist.uri,
	})),
	album: {
		name: track.album.name,
		uri: track.album.uri,
		release_date: track.album.release_date,
	},
	type: "spotify",
});

export const convertArtist = async (artist: LastFM.Artist) => {
	const spotifyArtist = await cacher(async () => {
		const searchRes = await searchForArtist(artist.name);
		const spotifyArtists = searchRes.filter(
			(a) => a.name.localeCompare(artist.name, undefined, { sensitivity: "base" }) === 0,
		);
		return spotifyArtists.sort((a, b) => b.popularity - a.popularity)[0];
	})({ queryKey: ["searchForArtist", artist.name] });
	if (!spotifyArtist)
		return {
			name: artist.name,
			playcount: Number(artist.playcount),
			uri: artist.url,
			type: "lastfm",
		} as LastFMMinifiedArtist;
	set(`artist-${spotifyArtist.id}`, spotifyArtist);
	return {
		...minifyArtist(spotifyArtist),
		playcount: Number(artist.playcount),
		name: artist.name,
	} as SpotifyMinifiedArtist;
};

export const convertAlbum = async (album: LastFM.Album) => {
	const spotifyAlbum = await cacher(async () => {
		const searchRes = await searchForAlbum(album.name, album.artist.name);
		return searchRes.find((a) => a.name.localeCompare(album.name, undefined, { sensitivity: "base" }) === 0);
	})({
		queryKey: ["searchForAlbum", album.name, album.artist.name],
	});
	if (!spotifyAlbum)
		return {
			uri: album.url,
			name: album.name,
			playcount: Number(album.playcount),
			type: "lastfm",
		} as LastFMMinifiedAlbum;
	return {
		...minifyAlbum(spotifyAlbum),
		playcount: Number(album.playcount),
		name: album.name,
	} as SpotifyMinifiedAlbum;
};

export const convertTrack = async (track: LastFM.Track) => {
	const spotifyTrack = await cacher(async () => {
		const searchRes = await searchForTrack(track.name, track.artist.name);
		return searchRes.find((t) => t.name.localeCompare(track.name, undefined, { sensitivity: "base" }) === 0);
	})({
		queryKey: ["searchForTrack", track.name, track.artist.name],
	});
	if (!spotifyTrack)
		return {
			uri: track.url,
			name: track.name,
			playcount: Number(track.playcount),
			duration_ms: Number(track.duration) * 1000,
			artists: [
				{
					name: track.artist.name,
					uri: track.artist.url,
				},
			],
			type: "lastfm",
		} as LastFMMinifiedTrack;
	return {
		...minifyTrack(spotifyTrack),
		playcount: Number(track.playcount),
		name: track.name,
	} as SpotifyMinifiedTrack;
};
