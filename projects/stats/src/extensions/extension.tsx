import React from "react";
import PlaylistPage from "../pages/playlist";
import { version as STATS_VERSION } from "../../package.json";
import ConfigWrapper from "@shared/config/config_wrapper";
import { startAuthFlow, handleCallback, clearTokens, getConnectionStatus } from "../api/oauth";

const getOAuthStatusLabel = () => {
	const { connected, expiresAt } = getConnectionStatus();
	const hasRefreshToken = Boolean(localStorage.getItem("stats:oauth:refresh_token"));

	if (!connected && !hasRefreshToken) return "Disconnected";
	if (!connected && hasRefreshToken) return "Refresh token available; access token will be restored on next request";
	if (!expiresAt) return hasRefreshToken ? "Connected; refresh token available" : "Connected; no refresh token stored";

	const expiresText = expiresAt.toLocaleString();
	return hasRefreshToken
		? `Connected; access token expires ${expiresText}; refresh token available`
		: `Connected; access token expires ${expiresText}; no refresh token stored`;
};

// contruct global class for stats methods
class SpicetifyStats {
	ConfigWrapper = new ConfigWrapper(
		[
			{
				name: "Spotify Client ID",
				key: "oauth-client-id",
				type: "text",
				def: null,
				placeholder: "Enter Client ID from Spotify Developer Dashboard",
				desc: `Create an app at developer.spotify.com/dashboard. Add redirect URI: http://127.0.0.1:5173/callback`,
				sectionHeader: "OAuth (Bypass Rate Limits)",
			},
			{
				name: "Use OAuth",
				key: "use-oauth",
				type: "toggle",
				def: false,
				desc: "Use your own Spotify Developer App instead of the built-in API",
				callback: (enabled: boolean) => {
					if (enabled) {
						startAuthFlow();
					}
				},
				initializeCallback: false,
			},
			{
				name: "Paste Callback URL",
				key: "oauth-callback",
				type: "text",
				def: null,
				placeholder: "http://127.0.0.1:5173/callback?code=...",
				desc: "After authorizing, copy the full URL from your browser and paste it here",
				initializeCallback: false,
				callback: async (url: string) => {
					if (url && url.includes("code=")) {
						await handleCallback(url);
					}
				},
			},
			{
				name: "Disconnect OAuth",
				key: "oauth-disconnect",
				type: "toggle",
				def: false,
				desc: "Toggle to disconnect your Spotify Developer App",
				callback: (value: boolean) => {
					if (value) {
						clearTokens();
						localStorage.setItem("stats:config:use-oauth", "false");
						localStorage.removeItem("stats:config:oauth-callback");
						Spicetify.showNotification("OAuth disconnected", false);
						// Reset the toggle
						localStorage.setItem("stats:config:oauth-disconnect", "false");
					}
				},
				initializeCallback: false,
			},
			{
				name: "OAuth Status",
				key: "oauth-status",
				type: "display",
				def: null,
				desc: "Shows whether Stats currently has a usable access token and whether a refresh token is stored for automatic recovery.",
				displayValue: getOAuthStatusLabel,
			},
			{
				name: "Use Direct Fetch (Experimental)",
				key: "use-direct-fetch",
				type: "toggle",
				def: false,
				desc: "Bypass CosmosAsync and use direct API calls. May help with rate limiting issues.",
				sectionHeader: "Workarounds",
			},
			{
				name: "Last.fm Api Key",
				key: "api-key",
				type: "text",
				def: null,
				placeholder: "Enter API Key",
				desc: `You can get this by visiting www.last.fm/api/account/create and simply entering any name.<br/>You'll need to make an account first, which is a plus.`,
				sectionHeader: "Last.fm Integration",
			},
			{
				name: "Last.fm Username",
				key: "lastfm-user",
				type: "text",
				def: null,
				placeholder: "Enter Username",
			},
			{
				name: "Use Last.fm for Stats",
				key: "use-lastfm",
				type: "toggle",
				def: false,
				desc: "Last.fm charts your stats purely based on the streaming count, whereas Spotify factors in other variables",
			},
			{
				name: "LastFM Only (No Spotify API)",
				key: "lastfm-only",
				type: "toggle",
				def: true,
				desc: "Avoid all Spotify API calls. Stats will use LastFM data only without enrichment. Useful if you're rate-limited.",
			},
			{
				name: "Include MusicBrainz Genre Tags",
				key: "use-musicbrainz-genres",
				type: "toggle",
				def: false,
				desc: "Augment genre analysis with MusicBrainz tags derived from the current timeframe's top tracks and top artists.",
			},
			{
				name: "Artists Page",
				key: "show-artists",
				type: "toggle",
				def: true,
				sectionHeader: "Pages",
			},
			{ name: "Tracks Page", key: "show-tracks", type: "toggle", def: true },
			{
				name: "Albums Page",
				key: "show-albums",
				type: "toggle",
				def: false,
				desc: "Requires Last.fm API key and username",
			},
			{ name: "Genres Page", key: "show-genres", type: "toggle", def: true },
			{ name: "Library Page", key: "show-library", type: "toggle", def: true },
			{
				name: "Charts Page",
				key: "show-charts",
				type: "toggle",
				def: true,
				desc: "Requires Last.fm API key",
			},
		],
		"stats",
	);
}
window.SpicetifyStats = new SpicetifyStats();

(function stats() {
	const {
		PopupModal,
		LocalStorage,
		Topbar,
		Platform: { History },
	} = Spicetify;

	if (!PopupModal || !LocalStorage || !Topbar || !History) {
		setTimeout(stats, 300);
		return;
	}

	const version = localStorage.getItem("stats:version");
	if (!version || version !== STATS_VERSION) {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i) as string;
			if (key.startsWith("stats:") && !key.startsWith("stats:config:") && !key.startsWith("stats:oauth:")) {
				localStorage.removeItem(key);
			}
		}
		localStorage.setItem("stats:version", STATS_VERSION);
	}

	const styleLink = document.createElement("link");
	styleLink.rel = "stylesheet";
	styleLink.href = "/spicetify-routes-stats.css";
	document.head.appendChild(styleLink);

	const playlistEdit = new Topbar.Button("playlist-stats", "visualizer", () => {
		const playlistUri = `spotify:playlist:${History.location.pathname.split("/")[2]}`;
		// @ts-ignore
		PopupModal.display({ title: "Playlist Stats", content: <PlaylistPage uri={playlistUri} />, isLarge: true });
	}, false);
	playlistEdit.element.classList.add("playlist-stats-button");
	playlistEdit.element.classList.toggle("hidden", true);

	function setTopbarButtonVisibility(pathname: string): void {
		const [, type, uid] = pathname.split("/");
		const isPlaylistPage = type === "playlist" && uid;
		playlistEdit.element.classList.toggle("hidden", !isPlaylistPage);
	}
	setTopbarButtonVisibility(History.location.pathname);

	History.listen(({ pathname }: { pathname: string }) => {
		setTopbarButtonVisibility(pathname);
	});
})();
