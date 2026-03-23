import React from "react";
import PlaylistPage from "../pages/playlist";
import ArtistPage from "../pages/artist";
import { version as STATS_VERSION } from "../../package.json";
import ConfigWrapper from "@shared/config/config_wrapper";
import { startAuthFlow, handleCallback, clearTokens, getConnectionStatus } from "../api/oauth";

const getOAuthStatusLabel = () => {
	const { connected, expiresAt } = getConnectionStatus();
	const hasRefreshToken = Boolean(localStorage.getItem("stats:oauth:refresh_token"));

	if (!connected && !hasRefreshToken) return "Disconnected";
	if (!connected && hasRefreshToken) return "Offline \u2014 auto-reconnect available";
	if (!expiresAt) return hasRefreshToken ? "Connected" : "Connected (no refresh token)";

	const expiresText = expiresAt.toLocaleString();
	return hasRefreshToken
		? `Connected \u00B7 expires ${expiresText}`
		: `Connected \u00B7 expires ${expiresText} (no refresh token)`;
};

// contruct global class for stats methods
class SpicetifyStats {
	ConfigWrapper = new ConfigWrapper(
		[
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
				name: "OAuth Status",
				key: "oauth-status",
				type: "display",
				def: null,
				desc: "Shows whether Stats currently has a usable access token and whether a refresh token is stored for automatic recovery.",
				displayValue: getOAuthStatusLabel,
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
				name: "Use Direct Fetch (Experimental)",
				key: "use-direct-fetch",
				type: "toggle",
				def: false,
				desc: "Bypass CosmosAsync and use direct API calls. May help with rate limiting issues.",
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
			{
				name: "Show Artist Stats Button",
				key: "show-artist-stats-button",
				type: "toggle",
				def: true,
				desc: "Show a button on artist pages to open the Artist Stats popup.",
				sectionHeader: "Artist Stats",
			},
			{
				name: "Button Position",
				key: "artist-stats-button-order",
				type: "slider",
				min: -3,
				max: 5,
				step: 1,
				def: 0,
				desc: "Controls where the Artist Stats button appears in the artist page action bar. Lower values move it left, higher values move it right.",
			},
			{
				name: "Auto-Load Playlist Appearances",
				key: "auto-load-playlist-appearances",
				type: "toggle",
				def: true,
				desc: "Automatically scan your playlists for this artist when viewing Artist Stats. Disable to show a manual load button instead.",
			},
			{
				name: "Show Debug Console",
				key: "show-debug-console",
				type: "toggle",
				def: false,
				desc: "Show recent request logs, delayed enrichment work, and cache diagnostics inside Stats.",
				sectionHeader: "Diagnostics",
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
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith("stats:") && !key.startsWith("stats:config:") && !key.startsWith("stats:oauth:")) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach((key) => localStorage.removeItem(key));
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

	// Artist stats topbar button kept as fallback only (hidden by default)
	const artistStats = new Topbar.Button("artist-stats", "chart-down", () => {
		const artistUri = `spotify:artist:${History.location.pathname.split("/")[2]}`;
		// @ts-ignore
		PopupModal.display({ title: "Artist Stats", content: <ArtistPage uri={artistUri} />, isLarge: true });
	}, false);
	artistStats.element.classList.add("artist-stats-button");
	artistStats.element.classList.toggle("hidden", true);
	// Ensure topbar fallback button is clickable — belt-and-suspenders click handler
	artistStats.element.addEventListener("click", () => {
		const parts = History.location.pathname.split("/");
		if (parts[1] === "artist" && parts[2]) {
			openArtistStats(parts[2]);
		}
	});

	function openArtistStats(artistId: string): void {
		const artistUri = `spotify:artist:${artistId}`;
		// @ts-ignore
		PopupModal.display({ title: "Artist Stats", content: <ArtistPage uri={artistUri} />, isLarge: true });
	}

	function removeInjectedArtistButton(): void {
		document.getElementById("stats-artist-inject-btn")?.remove();
	}

	let currentTargetArtistId: string | null = null;

	function tryInjectArtistButton(artistId: string, attempt: number): void {
		if (artistId !== currentTargetArtistId) return;
		const config = window.SpicetifyStats?.ConfigWrapper?.Config;
		if (config?.["show-artist-stats-button"] === false) {
			return;
		}

		// Strategy 1: direct container selectors
		const SELECTORS = [
			'[data-testid="action-bar-row"]',
			'[data-testid="action-bar"]',
			".main-actionBar-ActionBarRow",
			".main-actionBar-ActionBar",
			".main-actionButtons",
		];
		let actionBar: Element | null = SELECTORS.reduce<Element | null>(
			(found, sel) => found ?? document.querySelector(sel), null,
		);

		// Strategy 2: find Follow/Following button and use its parent row
		if (!actionBar) {
			const followBtn = document.querySelector(
				'button[data-testid="follow-button"], button[data-testid="following-button"]',
			);
			if (followBtn?.parentElement) {
				actionBar = followBtn.parentElement;
			}
		}

		// Strategy 3: find the more/options button ("...") and use its parent row
		if (!actionBar) {
			const moreBtn = document.querySelector(
				'button[data-testid="more-button"]',
			);
			if (moreBtn?.parentElement) {
				actionBar = moreBtn.parentElement;
			}
		}

		if (!actionBar) {
			if (attempt < 10) {
				setTimeout(() => tryInjectArtistButton(artistId, attempt + 1), 300);
			} else {
				// Fallback: use Topbar button
				artistStats.element.classList.remove("hidden");
			}
			return;
		}

		// Remove any stale injected button before adding new one
		removeInjectedArtistButton();

		const btn = document.createElement("button");
		btn.id = "stats-artist-inject-btn";
		btn.className = "stats-artist-inject-btn";
		btn.type = "button";
		btn.setAttribute("aria-label", "Artist Stats");

		const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgEl.setAttribute("viewBox", "0 0 16 16");
		svgEl.setAttribute("aria-hidden", "true");
		svgEl.innerHTML = (Spicetify as any).SVGIcons?.["chart-down"] ?? "";

		const textEl = document.createElement("span");
		textEl.textContent = "Artist Stats";

		btn.appendChild(svgEl);
		btn.appendChild(textEl);

		const orderValue = config?.["artist-stats-button-order"] ?? 0;
		btn.style.order = String(orderValue);

		btn.addEventListener("click", () => openArtistStats(artistId));

		actionBar.appendChild(btn);
	}

	function handleNavigation(pathname: string): void {
		const [, type, uid] = pathname.split("/");
		const isPlaylistPage = type === "playlist" && Boolean(uid);
		const isArtistPage = type === "artist" && Boolean(uid);

		currentTargetArtistId = isArtistPage ? uid : null;

		// Playlist stats Topbar button
		playlistEdit.element.classList.toggle("hidden", !isPlaylistPage);

		// Artist stats: hide Topbar fallback and remove injected button first
		artistStats.element.classList.add("hidden");
		removeInjectedArtistButton();

		if (isArtistPage) {
			tryInjectArtistButton(uid, 0);
		}
	}

	// MutationObserver: re-attempt injection when action bar appears in DOM
	// (mirrors the sort-play extension's approach for reliable detection)
	const actionBarObserver = new MutationObserver((mutations) => {
		if (!currentTargetArtistId) return;
		if (document.getElementById("stats-artist-inject-btn")) return;
		const hasRelevantNode = mutations.some((m) =>
			Array.from(m.addedNodes).some((n) =>
				n instanceof Element &&
				(n.classList?.contains("main-actionBar-ActionBarRow") ||
				 n.querySelector?.(".main-actionBar-ActionBarRow") ||
				 n.querySelector?.('[data-testid="action-bar-row"]')),
			),
		);
		if (hasRelevantNode) {
			tryInjectArtistButton(currentTargetArtistId, 0);
		}
	});
	actionBarObserver.observe(document.body, { childList: true, subtree: true });

	handleNavigation(History.location.pathname);

	History.listen(({ pathname }: { pathname: string }) => {
		handleNavigation(pathname);
	});
})();
