import React, { useCallback } from "react";
import StatCard from "../components/cards/stat_card";
import ChartCard from "../components/cards/chart_card";
import SpotifyCard from "@shared/components/spotify_card";
import Shelf from "../components/shelf";
import useStatus from "@shared/status/useStatus";
import { usePopupQuery } from "../utils/usePopupQuery";
import { getArtistOverview } from "../api/platform";
import { getArtistInfo, getArtistTopTags, getArtistGlobalTopTracks, getUserTopTracksForArtist } from "../api/lastfm";
import type { ArtistUnion, PlaylistAppearance } from "../types/artist_overview";

interface ArtistData {
	overview: ArtistUnion;
	lastfmInfo: {
		stats?: {
			listeners?: string;
			playcount?: string;
			userplaycount?: string;
		};
		tags?: {
			tag?: { name: string; url: string }[];
		};
		bio?: {
			summary?: string;
		};
	} | null;
	lastfmTags: { name: string; count: number }[];
}

const formatNumber = (num: number): string => {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	return num.toLocaleString();
};

const PLAYLIST_PREVIEW_COUNT = 6;

// Wraps a track row element so that right-click opens Spotify's native track context menu.
// Uses the same useMemo pattern as TrackRow to avoid the React #31 crash path.
const TrackContextMenu: React.FC<{ uri: string; children: React.ReactElement }> = ({ uri, children }) => {
	const Menu = React.useMemo(
		() =>
			function TrackCtxMenu(props: any) {
				const TrackMenu = (Spicetify as any).ReactComponent?.TrackMenu;
				if (!TrackMenu) return null;
				return <TrackMenu {...props} uri={uri} />;
			},
		[uri],
	);
	if (!(Spicetify as any).ReactComponent?.ContextMenu) return children;
	return (
		<Spicetify.ReactComponent.ContextMenu menu={Menu} trigger="right-click">
			{children}
		</Spicetify.ReactComponent.ContextMenu>
	);
};


const ArtistPage = ({ uri }: { uri: string }) => {
	const artistId = uri.replace("spotify:artist:", "");

	const [playlistAppearances, setPlaylistAppearances] = React.useState<PlaylistAppearance[] | null>(null);
	const [playlistProgress, setPlaylistProgress] = React.useState<{ current: number; total: number } | null>(null);
	const [playlistLoading, setPlaylistLoading] = React.useState(false);
	const [showAllPlaylists, setShowAllPlaylists] = React.useState(false);
	const [lfmTopTracks, setLfmTopTracks] = React.useState<{ name: string; playcount: string; listeners: string; url: string }[] | null>(null);
	const [lfmTopTracksLoading, setLfmTopTracksLoading] = React.useState(false);
	const [userTopTracks, setUserTopTracks] = React.useState<{ name: string; url: string; userPlaycount: number }[] | null>(null);
	const [userTopTracksLoading, setUserTopTracksLoading] = React.useState(false);
	const isMountedRef = React.useRef(true);

	React.useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Read config inside callback body to avoid unstable config reference in deps
	const fetchData = useCallback(async (): Promise<ArtistData> => {
		const overview = await getArtistOverview(`spotify:artist:${artistId}`);
		const config = window.SpicetifyStats?.ConfigWrapper?.Config;

		let lastfmInfo = null;
		let lastfmTags: { name: string; count: number }[] = [];
		if (config?.["api-key"]) {
			try {
				const [info, tags] = await Promise.all([
					getArtistInfo(config["api-key"], overview.profile.name, config["lastfm-user"] || undefined),
					getArtistTopTags(config["api-key"], overview.profile.name),
				]);
				lastfmInfo = info;
				lastfmTags = tags;
			} catch {
				// Last.fm failure is non-fatal — show Spotify data only
			}
		}
		return { overview, lastfmInfo, lastfmTags };
	}, [artistId]);

	const { status, error, data } = usePopupQuery(fetchData);

	// Playlist scanning closure — needs access to setPlaylistProgress (component state)
	const scanPlaylists = React.useCallback(
		async (artistUri: string) => {
			setPlaylistLoading(true);
			setPlaylistProgress(null);
			try {
				const rootlist = await Spicetify.Platform.RootlistAPI.getContents({ flatten: true });
				const playlists = (rootlist as { items?: { uri: string; name: string; type: string }[] }).items
					?.filter((i: { type: string }) => i.type === "playlist")
					?.slice(0, 200) ?? [];
				const results: PlaylistAppearance[] = [];
				const CONCURRENCY = 5;

				for (let i = 0; i < playlists.length; i += CONCURRENCY) {
					if (!isMountedRef.current) break;
					setPlaylistProgress({ current: Math.min(i + CONCURRENCY, playlists.length), total: playlists.length });
					const batch = playlists.slice(i, i + CONCURRENCY);
					const batchResults = await Promise.allSettled(
						batch.map(async (pl: { uri: string; name: string; type: string }) => {
							const playlistData = await Spicetify.Platform.PlaylistAPI.getPlaylist(pl.uri);
							const pd = playlistData as any;
							const imageUrl: string | undefined =
								pd?.metadata?.images?.[0]?.url ??
								pd?.images?.[0]?.url ??
								undefined;
							const items = (playlistData as { contents?: { items?: { artists?: { uri: string }[] }[] } }).contents?.items ?? [];
							const matchCount = items.filter(
								(t: { artists?: { uri: string }[] }) => t.artists?.some((a: { uri: string }) => a.uri === artistUri),
							).length;
							return matchCount > 0 ? { uri: pl.uri, name: pl.name, type: pl.type, matchCount, imageUrl } : null;
						}),
					);
					for (const result of batchResults) {
						if (result.status === "fulfilled" && result.value) {
							results.push(result.value);
						}
					}
				}
				if (isMountedRef.current) {
					setPlaylistAppearances(results);
				}
			} catch {
				if (isMountedRef.current) {
					setPlaylistAppearances([]);
				}
			} finally {
				if (isMountedRef.current) {
					setPlaylistLoading(false);
					setPlaylistProgress(null);
				}
			}
		},
		[],
	);

	// Auto-load playlist appearances after main data loads (if config enabled)
	React.useEffect(() => {
		if (status !== "success" || !data) return;
		const config = window.SpicetifyStats?.ConfigWrapper?.Config;
		const autoLoad = config?.["auto-load-playlist-appearances"] !== false;
		if (autoLoad && playlistAppearances === null && !playlistLoading) {
			scanPlaylists(`spotify:artist:${artistId}`);
		}
	}, [status, data, artistId, scanPlaylists, playlistAppearances, playlistLoading]);

	const handleLoadPlaylists = () => {
		scanPlaylists(`spotify:artist:${artistId}`);
	};

	const handleLoadLfmTopTracks = async () => {
		if (lfmTopTracksLoading) return;
		const config = window.SpicetifyStats?.ConfigWrapper?.Config;
		if (!config?.["api-key"] || !data?.overview?.profile?.name) return;
		setLfmTopTracksLoading(true);
		try {
			const tracks = await getArtistGlobalTopTracks(config["api-key"], data.overview.profile.name);
			if (isMountedRef.current) setLfmTopTracks(tracks);
		} catch {
			if (isMountedRef.current) setLfmTopTracks([]);
		} finally {
			if (isMountedRef.current) setLfmTopTracksLoading(false);
		}
	};

	const handleLoadUserTopTracks = async () => {
		if (userTopTracksLoading) return;
		const config = window.SpicetifyStats?.ConfigWrapper?.Config;
		if (!config?.["api-key"] || !config?.["lastfm-user"] || !data?.overview?.profile?.name) return;
		setUserTopTracksLoading(true);
		try {
			const tracks = await getUserTopTracksForArtist(
				config["api-key"],
				data.overview.profile.name,
				config["lastfm-user"],
			);
			if (isMountedRef.current) setUserTopTracks(tracks);
		} catch {
			if (isMountedRef.current) setUserTopTracks([]);
		} finally {
			if (isMountedRef.current) setUserTopTracksLoading(false);
		}
	};

	const Status = useStatus(status, error);
	if (Status) return Status;

	const { overview, lastfmInfo, lastfmTags } = data as NonNullable<typeof data>;
	const config = window.SpicetifyStats?.ConfigWrapper?.Config;
	const hasLastFm = Boolean(config?.["api-key"]);
	const hasLastFmUser = Boolean(config?.["api-key"] && config?.["lastfm-user"]);
	const autoLoadPlaylists = config?.["auto-load-playlist-appearances"] !== false;

	// Compute estimated listening time from user scrobbles
	let estimatedListeningTime: string | null = null;
	if (lastfmInfo?.stats?.userplaycount) {
		const userScrobbles = Number(lastfmInfo.stats.userplaycount);
		const topTracks = overview.discography?.topTracks?.items ?? [];
		if (userScrobbles > 0 && topTracks.length > 0) {
			const totalMs = topTracks.reduce((sum, t) => sum + (t.track?.duration?.totalMilliseconds ?? 0), 0);
			const avgMs = totalMs / topTracks.length;
			const totalMinutes = Math.round((userScrobbles * avgMs) / 60000);
			if (totalMinutes >= 60) {
				estimatedListeningTime = `${(totalMinutes / 60).toFixed(1)} hrs`;
			} else {
				estimatedListeningTime = `${totalMinutes} min`;
			}
		}
	}

	// Build genre chart data from Last.fm tags
	const genreData: Record<string, number> = {};
	if (lastfmTags.length > 0) {
		for (const tag of lastfmTags.slice(0, 20)) {
			genreData[tag.name] = tag.count;
		}
	}

	// Top tracks from Spotify
	const topTracks = overview.discography?.topTracks?.items?.slice(0, 10) ?? [];

	// Discography albums + singles
	const albums = overview.discography?.albums?.items ?? [];
	const singles = overview.discography?.singles?.items ?? [];

	// Related artists
	const relatedArtists = overview.relatedContent?.relatedArtists?.items ?? [];

	const albumCards = albums.slice(0, 10).map((album) => {
		const release = album.releases?.items?.[0];
		if (!release) return null;
		return (
			<SpotifyCard
				key={release.uri}
				type="album"
				uri={release.uri}
				header={release.name}
				subheader={`${release.date?.year ?? "Unknown"} \u00B7 ${release.tracks?.totalCount ?? 0} tracks`}
				imageUrl={release.coverArt?.sources?.[0]?.url}
			/>
		);
	}).filter(Boolean);

	const singleCards = singles.slice(0, 10).map((single) => {
		const release = single.releases?.items?.[0];
		if (!release) return null;
		return (
			<SpotifyCard
				key={release.uri}
				type="album"
				uri={release.uri}
				header={release.name}
				subheader={`${release.date?.year ?? "Unknown"}`}
				imageUrl={release.coverArt?.sources?.[0]?.url}
			/>
		);
	}).filter(Boolean);

	const relatedArtistCards = relatedArtists.slice(0, 10).map((artist) => (
		<SpotifyCard
			key={artist.uri}
			type="artist"
			uri={artist.uri}
			header={artist.profile.name}
			subheader="Related Artist"
			imageUrl={artist.visuals?.avatarImage?.sources?.[0]?.url}
		/>
	));

	const playlistCards = (playlistAppearances ?? []).map((pl) => (
		<SpotifyCard
			key={pl.uri}
			type="playlist"
			uri={pl.uri}
			header={pl.name}
			subheader={`Appears in ${pl.matchCount} track${pl.matchCount !== 1 ? "s" : ""}`}
			imageUrl={pl.imageUrl}
		/>
	));

	return (
		<div id="stats-app" className="page-content encore-dark-theme encore-base-set">
			{/* Artist-level stats */}
			<section className="stats-artistOverview">
				<StatCard label="Monthly Listeners" value={formatNumber(overview.stats?.monthlyListeners ?? 0)} />
				<StatCard label="Followers" value={formatNumber(overview.stats?.followers ?? 0)} />
				{overview.stats?.worldRank > 0 && (
					<StatCard label="World Rank" value={`#${overview.stats.worldRank}`} />
				)}
				<StatCard label="Albums" value={overview.discography?.albums?.totalCount ?? 0} />
				<StatCard label="Singles" value={overview.discography?.singles?.totalCount ?? 0} />
			</section>

			{/* User-level stats - only rendered if any user data available */}
			{(Number(lastfmInfo?.stats?.userplaycount) > 0 || estimatedListeningTime) && (
				<section className="stats-artistOverview-userRow">
					{Number(lastfmInfo?.stats?.userplaycount) > 0 && (
						<StatCard label="Your Scrobbles" value={formatNumber(Number(lastfmInfo.stats.userplaycount))} />
					)}
					{estimatedListeningTime && (
						<StatCard label="Est. Listening Time" value={estimatedListeningTime} />
					)}
				</section>
			)}

			{/* Genres */}
			<Shelf title="Genres">
				{hasLastFm && Object.keys(genreData).length > 0 ? (
					<ChartCard data={genreData} />
				) : (
					<div className="main-card-card stats-genreCard stats-genreCardEmpty">
						{hasLastFm
							? "No genre data available"
							: <>No genre data available <span className="stats-genreTooltip" title="Connect Last.fm in Stats settings for richer genre data">(?)</span></>
						}
					</div>
				)}
			</Shelf>

			{/* Playlist Appearances */}
			<Shelf title="Playlist Appearances">
				{playlistLoading ? (
					<div>
						<div className="stats-playlistProgress">
							{playlistProgress
								? `Scanning playlist ${playlistProgress.current} of ${playlistProgress.total}...`
								: "Starting scan..."
							}
						</div>
					</div>
				) : playlistAppearances !== null ? (
					playlistCards.length > 0 ? (
						<>
							<div className="main-gridContainer-gridContainer grid">
								{showAllPlaylists ? playlistCards : playlistCards.slice(0, PLAYLIST_PREVIEW_COUNT)}
							</div>
							{playlistCards.length > PLAYLIST_PREVIEW_COUNT && (
								<button
									type="button"
									className="stats-seeMoreBtn"
									onClick={() => setShowAllPlaylists((v) => !v)}
								>
									{showAllPlaylists ? "Show fewer" : `Show all ${playlistCards.length} playlists`}
								</button>
							)}
						</>
					) : (
						<div className="main-card-card stats-genreCard stats-genreCardEmpty">
							No playlist appearances found
						</div>
					)
				) : !autoLoadPlaylists ? (
					<button type="button" className="stats-playlistAppearances-loadBtn" onClick={handleLoadPlaylists}>
						Load Playlist Appearances
					</button>
				) : null}
			</Shelf>

			{/* Spotify Top Tracks */}
			{topTracks.length > 0 && (
				<Shelf title="Top Tracks">
					<div className="stats-lfmTrackList">
						{topTracks.map((item, idx) => {
							const trackId = item.track?.uri?.split(":")?.[2];
							return (
								<TrackContextMenu key={item.track?.uri ?? idx} uri={item.track?.uri ?? ""}>
									<div
										className="stats-lfmTrackRow stats-lfmTrackRow--clickable"
									role="button"
									tabIndex={0}
									onClick={() => {
										if (trackId) {
											Spicetify.PopupModal.hide?.();
											Spicetify.Platform.History.push(`/track/${trackId}`);
										}
									}}
									onKeyDown={(e) => {
										if ((e.key === "Enter" || e.key === " ") && trackId) {
											Spicetify.PopupModal.hide?.();
											Spicetify.Platform.History.push(`/track/${trackId}`);
										}
									}}
								>
									<span className="stats-lfmTrackName">
										{idx + 1}. {item.track?.name ?? "Unknown"}
									</span>
									<span className="stats-lfmTrackListeners">
										{item.track?.playcount ? formatNumber(Number(item.track.playcount)) : "N/A"} plays
									</span>
									</div>
								</TrackContextMenu>
							);
						})}
					</div>
				</Shelf>
			)}

			{/* Last.fm Global Top Tracks */}
			{hasLastFm && (
				<Shelf title="Last.fm Global Top Tracks">
					{lfmTopTracks === null ? (
						<button
							type="button"
							className="stats-lfmTopTracks-loadBtn"
							onClick={handleLoadLfmTopTracks}
							disabled={lfmTopTracksLoading}
						>
							{lfmTopTracksLoading ? "Loading..." : "Load Last.fm Top Tracks"}
						</button>
					) : lfmTopTracks.length > 0 ? (
						<div className="stats-lfmTrackList">
							{lfmTopTracks.map((track, idx) => (
								<a
									key={`${track.name}-${idx}`}
									className="stats-lfmTrackRow stats-lfmTrackRow--link"
									href={track.url}
									target="_blank"
									rel="noreferrer"
								>
									<span className="stats-lfmTrackName">
										{idx + 1}. {track.name}
									</span>
									<span className="stats-lfmTrackListeners">
										{formatNumber(Number(track.listeners))} listeners
									</span>
								</a>
							))}
						</div>
					) : (
						<div className="main-card-card stats-genreCard stats-genreCardEmpty">
							No Last.fm top tracks available
						</div>
					)}
				</Shelf>
			)}

			{/* Your Top Scrobbled Tracks */}
			{hasLastFmUser && (
				<Shelf title="Your Top Scrobbled Tracks">
					{userTopTracks === null ? (
						<button
							type="button"
							className="stats-lfmTopTracks-loadBtn"
							onClick={handleLoadUserTopTracks}
							disabled={userTopTracksLoading}
						>
							{userTopTracksLoading ? "Loading..." : "Load My Top Tracks"}
						</button>
					) : userTopTracks.length > 0 ? (
						<div className="stats-lfmTrackList">
							{userTopTracks.map((track, idx) => (
								<a
									key={`${track.name}-${idx}`}
									className="stats-lfmTrackRow stats-lfmTrackRow--link"
									href={track.url}
									target="_blank"
									rel="noreferrer"
								>
									<span className="stats-lfmTrackName">
										{idx + 1}. {track.name}
									</span>
									<span className="stats-lfmTrackListeners">
										{formatNumber(track.userPlaycount)} scrobbles
									</span>
								</a>
							))}
						</div>
					) : (
						<div className="main-card-card stats-genreCard stats-genreCardEmpty">
							No scrobble data found for this artist
						</div>
					)}
				</Shelf>
			)}

			{/* Discography: Albums */}
			{albumCards.length > 0 && (
				<Shelf title="Albums">
					<div className="main-gridContainer-gridContainer grid">{albumCards}</div>
				</Shelf>
			)}

			{/* Discography: Singles */}
			{singleCards.length > 0 && (
				<Shelf title="Singles & EPs">
					<div className="main-gridContainer-gridContainer grid">{singleCards}</div>
				</Shelf>
			)}

			{/* Related Artists */}
			{relatedArtistCards.length > 0 && (
				<Shelf title="Related Artists">
					<div className="main-gridContainer-gridContainer grid">{relatedArtistCards}</div>
				</Shelf>
			)}
		</div>
	);
};

export default React.memo(ArtistPage);
