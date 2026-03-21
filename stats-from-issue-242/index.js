// Spicetify Statistics — Spotify + Last.fm

// ─── Global Logger (accessible via console: _statsLog, _statsLogDump()) ───
var _statsLog = [];
var _statsLogMax = 300;
function statsLog(level, ...args) {
  const ts = new Date().toISOString().slice(11, 23);
  const msg = args.map(a => typeof a === "object" ? JSON.stringify(a).slice(0, 500) : String(a)).join(" ");
  const entry = "[" + ts + "] [" + level + "] " + msg;
  _statsLog.push(entry);
  if (_statsLog.length > _statsLogMax) _statsLog.shift();
  if (level === "ERROR") console.error("[stats]", ...args);
  else if (level === "WARN") console.warn("[stats]", ...args);
  else console.log("[stats]", ...args);
}
function _statsLogDump() { return _statsLog.join("\n"); }
window._statsLog = _statsLog;
window._statsLogDump = _statsLogDump;
statsLog("INFO", "Stats plugin loading...");

// render is exposed at top scope for Spicetify's module bundler
var render;

var stats = (() => {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: Aliases & Utilities
  // ═══════════════════════════════════════════════════════════════════════════

  const React = Spicetify.React;
  const { useState, useEffect, useCallback, useRef, memo, Fragment } = React;
  const h = React.createElement;

  // Check if value is usable as a React component (function or forwardRef)
  const _isRC = (v) =>
    typeof v === "function" || (v != null && typeof v === "object" && v.$$typeof != null);

  // Lazy ReactQuery lookup
  const _getRQ = () => Spicetify.ReactQuery || Spicetify.reactQuery;

  // Format milliseconds to "Xh Ym" or "Xm"
  function formatDuration(ms) {
    if (!ms || ms <= 0) return "0m";
    const totalMin = Math.floor(ms / 60000);
    const hrs = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    if (hrs > 0) return hrs + "h " + min + "m";
    return min + "m";
  }

  // Format ms to "M:SS"
  function formatTrackDuration(ms) {
    if (!ms) return "0:00";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min + ":" + (sec < 10 ? "0" : "") + sec;
  }

  // Format number with commas
  function formatNumber(n) {
    if (n == null) return "0";
    return Number(n).toLocaleString();
  }

  // Capitalize first letter of each word
  function titleCase(str) {
    if (!str) return "";
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Data Source Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  function getDataSource() {
    return window.StatsConfig?.getDataSource?.() || "spotify";
  }

  function getLastfmUser() {
    return window.StatsConfig?.get("lastfm-user") || "";
  }

  function getLastfmKey() {
    return window.StatsConfig?.get("lastfm-key") || "44654ea047786d90338c17331a5f5d95";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Spotify API Layer
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── LocalStorage Cache for Spotify data ───
  // Caches API responses so the app shows data immediately and reduces API calls.
  // Cache TTL: 15 minutes for most data, 5 minutes for recently played.
  const CACHE_PREFIX = "stats:cache:";
  const CACHE_TTL = 15 * 60 * 1000;      // 15 min for top items
  const CACHE_TTL_RECENT = 5 * 60 * 1000; // 5 min for recently played

  function cacheGet(key) {
    try {
      const raw = Spicetify.LocalStorage.get(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (!entry || !entry.ts || !entry.data) return null;
      const ttl = key.includes("recent") ? CACHE_TTL_RECENT : CACHE_TTL;
      if (Date.now() - entry.ts > ttl) {
        statsLog("INFO", "cache expired: " + key);
        return null;
      }
      statsLog("INFO", "cache hit: " + key + " (age " + Math.round((Date.now() - entry.ts) / 1000) + "s)");
      return entry.data;
    } catch (e) {
      return null;
    }
  }

  function cacheSet(key, data) {
    try {
      Spicetify.LocalStorage.set(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) {
      // Storage quota — silently ignore
    }
  }

  // ─── Request Queue (one at a time, with delay) ───
  let _spotifyQueueBusy = false;
  const _spotifyQueueItems = [];
  const SPOTIFY_MIN_DELAY = 2000;   // 2 seconds between requests
  let _spotifyStartupReady = false;
  const SPOTIFY_STARTUP_DELAY = 3000; // Wait 3s before first API call

  function spotifyFetch(path) {
    return new Promise((resolve, reject) => {
      _spotifyQueueItems.push({ path, resolve, reject });
      _processSpotifyQueue();
    });
  }

  async function _processSpotifyQueue() {
    if (_spotifyQueueBusy) return;
    if (_spotifyQueueItems.length === 0) return;

    _spotifyQueueBusy = true;

    // Startup delay: wait before first ever Spotify call so Spotify's own
    // startup API burst settles and rate limit budget recovers
    if (!_spotifyStartupReady) {
      _spotifyStartupReady = true;
      statsLog("INFO", "spotify startup delay " + SPOTIFY_STARTUP_DELAY + "ms...");
      await new Promise((r) => setTimeout(r, SPOTIFY_STARTUP_DELAY));
    }

    while (_spotifyQueueItems.length > 0) {
      const item = _spotifyQueueItems.shift();
      try {
        const result = await _spotifyFetchWithRetry(item.path, 0);
        item.resolve(result);
      } catch (e) {
        item.reject(e);
      }
      // Delay between consecutive requests
      if (_spotifyQueueItems.length > 0) {
        await new Promise((r) => setTimeout(r, SPOTIFY_MIN_DELAY));
      }
    }

    _spotifyQueueBusy = false;
  }

  async function _spotifyFetchWithRetry(path, retries) {
    const MAX_RETRIES = 3;

    statsLog("INFO", "spotify fetch: " + path + (retries ? " (retry " + retries + ")" : ""));
    const t0 = performance.now();
    let res;
    try {
      res = await Spicetify.CosmosAsync.get("https://api.spotify.com/v1" + path);
    } catch (e) {
      const elapsed = Math.round(performance.now() - t0);
      const msg = e?.message || String(e);
      statsLog("ERROR", "spotify error in " + elapsed + "ms: " + path, msg);
      if ((msg.includes("429") || msg.includes("rate") || msg.includes("Rate")) && retries < MAX_RETRIES) {
        const delay = Math.min((retries + 1) * 10000, 30000);
        statsLog("WARN", "Rate limited (catch), waiting " + delay + "ms before retry " + (retries + 1) + "...");
        await new Promise((r) => setTimeout(r, delay));
        return _spotifyFetchWithRetry(path, retries + 1);
      }
      if (msg.includes("429")) throw new Error("Spotify is rate-limiting requests. Wait a minute, then click Refresh.");
      if (msg.includes("403")) throw new Error("Spotify returned 403 Forbidden. Try restarting Spotify.");
      throw new Error("Could not fetch from Spotify. Check your connection.");
    }
    const elapsed = Math.round(performance.now() - t0);

    // CosmosAsync can return error/status objects without throwing
    if (res && (res.code || res.error || res.status)) {
      const code = Number(res.code || res.status || 0);
      const errMsg = res.error?.message || res.message || ("Spotify error " + code);

      if (code === 429) {
        // Try to read Retry-After from the response
        const retryAfter = Number(res.headers?.["retry-after"] || res["retry-after"] || 0);
        const delay = retryAfter > 0 ? retryAfter * 1000 : Math.min((retries + 1) * 10000, 30000);
        if (retries < MAX_RETRIES) {
          statsLog("WARN", "Rate limited (429), waiting " + delay + "ms before retry " + (retries + 1) + "...");
          await new Promise((r) => setTimeout(r, delay));
          return _spotifyFetchWithRetry(path, retries + 1);
        }
        throw new Error("Spotify is rate-limiting requests. Wait a minute, then click Refresh.");
      }

      // Some valid responses include status: 200 — don't treat as error
      if (code === 200 || res.items !== undefined || res.tracks !== undefined || res.artists !== undefined) {
        // Valid response — continue
      } else {
        statsLog("WARN", "spotify error " + code + ": " + path + " -> " + errMsg);
        throw new Error(errMsg);
      }
    }

    // Empty/invalid response
    if (!res || typeof res !== "object") {
      statsLog("WARN", "spotify empty response: " + path);
      if (retries < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 5000));
        return _spotifyFetchWithRetry(path, retries + 1);
      }
      throw new Error("Spotify returned an empty response. Try again later.");
    }

    statsLog("INFO", "spotify OK " + elapsed + "ms: " + path + " keys=" + Object.keys(res).join(","));
    return res;
  }

  // ─── Spotify Endpoints ───

  function spotifyTopArtists(range, limit) {
    return spotifyFetch("/me/top/artists?time_range=" + range + "&limit=" + (limit || 50));
  }

  function spotifyTopTracks(range, limit) {
    return spotifyFetch("/me/top/tracks?time_range=" + range + "&limit=" + (limit || 50));
  }

  function spotifyRecentlyPlayed(limit) {
    return spotifyFetch("/me/player/recently-played?limit=" + (limit || 50));
  }

  // ─── Spotify Mappers ───

  function mapSpotifyArtist(item, index) {
    return {
      id: item.id,
      name: item.name || "Unknown",
      image: item.images?.[0]?.url || "",
      uri: item.uri || null,
      genres: item.genres || [],
      streams: 0, // Spotify doesn't provide play counts
      playedMs: 0,
      position: index + 1,
    };
  }

  function mapSpotifyTrack(item, index) {
    return {
      id: item.id,
      name: item.name || "Unknown",
      image: item.album?.images?.[0]?.url || "",
      uri: item.uri || null,
      duration: item.duration_ms || 0,
      artists: (item.artists || []).map((a) => ({ name: a.name, id: a.id })),
      album: item.album ? { name: item.album.name, image: item.album.images?.[0]?.url || "" } : null,
      streams: 0,
      playedMs: 0,
      position: index + 1,
      explicit: item.explicit || false,
    };
  }

  function mapSpotifyRecentStream(item) {
    const track = item.track || {};
    const artistName = (track.artists && track.artists[0]?.name) || "";
    return {
      id: track.id || "",
      trackName: track.name || "Unknown",
      artistName,
      playedMs: track.duration_ms || 0,
      endTime: item.played_at ? new Date(item.played_at) : null,
    };
  }

  // Derive albums from top tracks (Spotify has no top albums endpoint)
  function deriveAlbumsFromTracks(tracks) {
    const albumMap = {};
    tracks.forEach((t) => {
      const album = t.album;
      if (!album || !album.id) return;
      if (!albumMap[album.id]) {
        albumMap[album.id] = {
          id: album.id,
          name: album.name || "Unknown",
          image: album.images?.[0]?.url || "",
          uri: album.uri || null,
          artists: (album.artists || []).map((a) => ({ name: a.name })),
          streams: 0,
          playedMs: 0,
          position: 0,
          trackCount: 0,
        };
      }
      albumMap[album.id].trackCount++;
    });
    const sorted = Object.values(albumMap).sort((a, b) => b.trackCount - a.trackCount);
    sorted.forEach((a, i) => {
      a.position = i + 1;
      a.streams = a.trackCount; // Use trackCount as the "count" metric
    });
    return sorted;
  }

  // Derive genres from top artists
  function deriveGenresFromArtists(artists) {
    const genreMap = {};
    artists.forEach((a) => {
      (a.genres || []).forEach((g) => {
        if (!genreMap[g]) genreMap[g] = { tag: g, streams: 0, playedMs: 0, position: 0 };
        genreMap[g].streams++;
      });
    });
    const sorted = Object.values(genreMap).sort((a, b) => b.streams - a.streams);
    sorted.forEach((g, i) => { g.position = i + 1; });
    return sorted;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: Last.fm API Layer
  // ═══════════════════════════════════════════════════════════════════════════

  const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";

  async function lastfmFetch(method, params) {
    const user = getLastfmUser();
    const key = getLastfmKey();
    if (!user) throw new Error("Configure your Last.fm username in Settings to use Last.fm data.");
    if (!key) throw new Error("A Last.fm API key is required. Check Settings.");

    const qs = new URLSearchParams({
      method,
      user,
      api_key: key,
      format: "json",
      ...params,
    });
    const url = LASTFM_BASE + "?" + qs.toString();
    statsLog("INFO", "lastfm fetch: " + method + " " + JSON.stringify(params));
    const t0 = performance.now();
    let res;
    try {
      res = await fetch(url);
    } catch (e) {
      statsLog("ERROR", "lastfm NETWORK ERROR: " + method, e.message || e);
      throw new Error("Could not connect to Last.fm. Check your internet connection.");
    }
    const elapsed = Math.round(performance.now() - t0);
    if (!res.ok) {
      statsLog("WARN", "lastfm " + res.status + " in " + elapsed + "ms: " + method);
      if (res.status === 403) throw new Error("Last.fm: Invalid API key. Check your API key in Settings.");
      if (res.status === 404) throw new Error("Last.fm: User not found. Check your username in Settings.");
      throw new Error("Last.fm error: " + res.status + " " + res.statusText);
    }
    const json = await res.json();
    if (json.error) {
      statsLog("WARN", "lastfm API error: " + json.message);
      throw new Error("Last.fm: " + (json.message || "Unknown error"));
    }
    statsLog("INFO", "lastfm OK " + elapsed + "ms: " + method);
    return json;
  }

  // ─── Last.fm Endpoints ───

  function lastfmTopArtists(period, limit) {
    return lastfmFetch("user.gettopartists", { period, limit: limit || 50 });
  }

  function lastfmTopTracks(period, limit) {
    return lastfmFetch("user.gettoptracks", { period, limit: limit || 50 });
  }

  function lastfmTopAlbums(period, limit) {
    return lastfmFetch("user.gettopalbums", { period, limit: limit || 50 });
  }

  function lastfmTopTags(period, limit) {
    return lastfmFetch("user.gettoptags", { limit: limit || 50 });
  }

  function lastfmRecentTracks(limit) {
    return lastfmFetch("user.getrecenttracks", { limit: limit || 50 });
  }

  function lastfmUserInfo() {
    return lastfmFetch("user.getinfo", {});
  }

  // ─── Last.fm Mappers ───

  function mapLastfmArtist(item, index) {
    const img = item.image ? (item.image.find((i) => i.size === "extralarge") || item.image[item.image.length - 1]) : null;
    return {
      id: item.mbid || item.name,
      name: item.name || "Unknown",
      image: (img && img["#text"]) || "",
      uri: item.url ? null : null, // No Spotify URI from Last.fm
      genres: [],
      streams: parseInt(item.playcount, 10) || 0,
      playedMs: 0,
      position: index + 1,
    };
  }

  function mapLastfmTrack(item, index) {
    const img = item.image ? (item.image.find((i) => i.size === "extralarge") || item.image[item.image.length - 1]) : null;
    return {
      id: item.mbid || item.name,
      name: item.name || "Unknown",
      image: (img && img["#text"]) || "",
      uri: null,
      duration: (parseInt(item.duration, 10) || 0) * 1000, // Last.fm gives seconds
      artists: item.artist ? [{ name: item.artist.name || item.artist["#text"] || "", id: "" }] : [],
      album: null,
      streams: parseInt(item.playcount, 10) || 0,
      playedMs: 0,
      position: index + 1,
      explicit: false,
    };
  }

  function mapLastfmAlbum(item, index) {
    const img = item.image ? (item.image.find((i) => i.size === "extralarge") || item.image[item.image.length - 1]) : null;
    return {
      id: item.mbid || item.name,
      name: item.name || "Unknown",
      image: (img && img["#text"]) || "",
      uri: null,
      artists: item.artist ? [{ name: item.artist.name || item.artist["#text"] || "" }] : [],
      streams: parseInt(item.playcount, 10) || 0,
      playedMs: 0,
      position: index + 1,
    };
  }

  function mapLastfmTag(item, index) {
    return {
      tag: item.name || "unknown",
      streams: parseInt(item.count, 10) || 0,
      playedMs: 0,
      position: index + 1,
    };
  }

  function mapLastfmRecentTrack(item) {
    const img = item.image ? (item.image.find((i) => i.size === "medium") || item.image[0]) : null;
    return {
      id: item.mbid || item.name || "",
      trackName: item.name || "Unknown",
      artistName: item.artist?.["#text"] || item.artist?.name || "",
      playedMs: 0,
      endTime: item.date?.uts ? new Date(parseInt(item.date.uts, 10) * 1000) : null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: Unified Fetch Functions
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Cached Spotify helpers ───
  // These check localStorage first, then fetch from API and cache the result.
  // This means pages show data immediately from cache, even if the API is rate-limited.

  async function _cachedSpotifyTopArtists(range, limit) {
    const key = "sp-artists-" + range;
    const cached = cacheGet(key);
    if (cached) return cached;
    const data = await spotifyTopArtists(range, limit);
    cacheSet(key, data);
    return data;
  }

  async function _cachedSpotifyTopTracks(range, limit) {
    const key = "sp-tracks-" + range;
    const cached = cacheGet(key);
    if (cached) return cached;
    const data = await spotifyTopTracks(range, limit);
    cacheSet(key, data);
    return data;
  }

  async function _cachedSpotifyRecent(limit) {
    const key = "sp-recent";
    const cached = cacheGet(key);
    if (cached) return cached;
    const data = await spotifyRecentlyPlayed(limit);
    cacheSet(key, data);
    return data;
  }

  // ─── Unified Fetch Functions ───

  async function fetchTopArtists(range) {
    const src = getDataSource();
    if (src === "lastfm") {
      const data = await lastfmTopArtists(range);
      return (data?.topartists?.artist || []).map(mapLastfmArtist);
    }
    const data = await _cachedSpotifyTopArtists(range);
    statsLog("INFO", "fetchTopArtists items=" + (data?.items?.length ?? "none"));
    return (data?.items || []).map(mapSpotifyArtist);
  }

  async function fetchTopTracks(range) {
    const src = getDataSource();
    if (src === "lastfm") {
      const data = await lastfmTopTracks(range);
      return (data?.toptracks?.track || []).map(mapLastfmTrack);
    }
    const data = await _cachedSpotifyTopTracks(range);
    statsLog("INFO", "fetchTopTracks items=" + (data?.items?.length ?? "none"));
    return (data?.items || []).map(mapSpotifyTrack);
  }

  async function fetchTopAlbums(range) {
    const src = getDataSource();
    if (src === "lastfm") {
      const data = await lastfmTopAlbums(range);
      return (data?.topalbums?.album || []).map(mapLastfmAlbum);
    }
    // Spotify: derive from top tracks
    const data = await _cachedSpotifyTopTracks(range);
    const rawTracks = data?.items || [];
    return deriveAlbumsFromTracks(rawTracks);
  }

  async function fetchTopGenres(range) {
    const src = getDataSource();
    if (src === "lastfm") {
      const data = await lastfmTopTags(range);
      return (data?.toptags?.tag || []).map(mapLastfmTag);
    }
    // Spotify: derive from top artists
    const data = await _cachedSpotifyTopArtists(range);
    const rawArtists = data?.items || [];
    return deriveGenresFromArtists(rawArtists);
  }

  async function fetchRecentStreams() {
    const src = getDataSource();
    if (src === "lastfm") {
      const data = await lastfmRecentTracks(50);
      const tracks = data?.recenttracks?.track || [];
      // Filter out "now playing" track (has @attr.nowplaying)
      return tracks.filter((t) => !t["@attr"]?.nowplaying).map(mapLastfmRecentTrack);
    }
    const data = await _cachedSpotifyRecent(50);
    return (data?.items || []).map(mapSpotifyRecentStream);
  }

  async function fetchStatsOverview() {
    const src = getDataSource();
    if (src === "lastfm") {
      const data = await lastfmUserInfo();
      const user = data?.user || {};
      return {
        source: "lastfm",
        totalScrobbles: parseInt(user.playcount, 10) || 0,
        artistCount: parseInt(user.artist_count, 10) || 0,
        trackCount: parseInt(user.track_count, 10) || 0,
        albumCount: parseInt(user.album_count, 10) || 0,
        registered: user.registered?.unixtime ? new Date(parseInt(user.registered.unixtime, 10) * 1000) : null,
      };
    }
    // Spotify: get counts from top endpoints (sequential — queued by spotifyFetch)
    const artistData = await _cachedSpotifyTopArtists("long_term", 50);
    const trackData = await _cachedSpotifyTopTracks("long_term", 50);
    const artists = artistData?.items || [];
    const tracks = trackData?.items || [];
    const genres = deriveGenresFromArtists(artists);
    const albums = deriveAlbumsFromTracks(tracks);
    return {
      source: "spotify",
      topArtistCount: artists.length,
      topTrackCount: tracks.length,
      topGenreCount: genres.length,
      topAlbumCount: albums.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: Range Options (per data source)
  // ═══════════════════════════════════════════════════════════════════════════

  const SPOTIFY_RANGES = [
    { id: "short_term", name: "Past 4 Weeks" },
    { id: "medium_term", name: "Past 6 Months" },
    { id: "long_term", name: "All Time" },
  ];

  const LASTFM_RANGES = [
    { id: "7day", name: "7 Days" },
    { id: "1month", name: "1 Month" },
    { id: "3month", name: "3 Months" },
    { id: "6month", name: "6 Months" },
    { id: "12month", name: "12 Months" },
    { id: "overall", name: "All Time" },
  ];

  function getRangeOptions() {
    return getDataSource() === "lastfm" ? LASTFM_RANGES : SPOTIFY_RANGES;
  }

  function getDefaultRange() {
    return getDataSource() === "lastfm" ? LASTFM_RANGES[0] : SPOTIFY_RANGES[0];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: Query Hook (ReactQuery + fallback)
  // ═══════════════════════════════════════════════════════════════════════════

  // Minimal fallback when ReactQuery is unavailable
  function useManualQuery(queryKey, queryFn, options) {
    const [state, setState] = useState({ status: "pending", data: null, error: null });
    const keyStr = JSON.stringify(queryKey);
    const enabled = options?.enabled !== false;

    const refetch = useCallback(async () => {
      if (!enabled) return;
      setState({ status: "pending", data: null, error: null });
      try {
        const result = await queryFn();
        setState({ status: "success", data: result, error: null });
      } catch (e) {
        setState({ status: "error", data: null, error: e });
      }
    }, [keyStr, enabled]);

    useEffect(() => {
      if (enabled) refetch();
    }, [keyStr, enabled]);

    return { ...state, refetch };
  }

  // Clear all Spotify caches (called when user clicks Refresh)
  function clearSpotifyCache() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      statsLog("INFO", "cleared " + keys.length + " cache entries");
    } catch (e) { /* ignore */ }
  }

  function useStatsQuery(queryKey, queryFn, options) {
    const RQ = _getRQ();
    statsLog("INFO", "useStatsQuery key=" + JSON.stringify(queryKey) + " rq=" + (RQ ? "yes" : "fallback"));
    if (RQ && RQ.useQuery) {
      return RQ.useQuery({
        queryKey,
        queryFn,
        retry: (failureCount, error) => {
          // Don't retry rate limit errors at query level (fetch layer handles retries)
          if (error?.message?.includes("rate-limiting") || error?.message?.includes("Rate")) return false;
          return failureCount < 1;
        },
        retryDelay: 5000,
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        ...(options || {}),
      });
    }
    return useManualQuery(queryKey, queryFn, options);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8: Shared UI Components
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── StatusDisplay (loading / error / setup) ───

  function StatusDisplay({ status, error, onRetry, onOpenSettings }) {
    if (status === "pending") {
      return h("div", { className: "stats-status" },
        h("div", { className: "stats-spinner" }),
        h("p", null, "Loading...")
      );
    }
    if (status === "no-user") {
      return h("div", { className: "stats-status" },
        h("svg", { viewBox: "0 0 24 24", width: 48, height: 48, fill: "currentColor", className: "stats-status-icon" },
          h("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" })
        ),
        h("h2", null, "Setup Required"),
        h("p", null, "Configure your Last.fm username in Settings to use Last.fm data."),
        onOpenSettings && h("button", { className: "stats-btn", onClick: onOpenSettings }, "Open Settings")
      );
    }
    if (status === "error") {
      return h("div", { className: "stats-status" },
        h("svg", { viewBox: "0 0 24 24", width: 48, height: 48, fill: "currentColor", className: "stats-status-icon" },
          h("path", { d: "M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0020 0c0-5.5-4.47-10-10-10zm0 18a8 8 0 110-16 8 8 0 010 16z" })
        ),
        h("h2", null, "Something went wrong"),
        h("p", null, error?.message || "An unknown error occurred."),
        onRetry && h("button", { className: "stats-btn", onClick: () => { clearSpotifyCache(); onRetry(); } }, "Retry")
      );
    }
    return null;
  }

  // ─── SettingsButton ───

  function SettingsButton({ onClick }) {
    return h("button", {
      className: "stats-icon-btn",
      onClick,
      "aria-label": "Settings",
      title: "Settings",
    },
      h("svg", { viewBox: "0 0 24 24", width: 16, height: 16, fill: "currentColor" },
        h("path", { d: "M19.14 12.94a7.07 7.07 0 000-1.88l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.04 7.04 0 00-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87a.48.48 0 00.12.61l2.03 1.58a7.07 7.07 0 000 1.88l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.61 3.61 0 0112 15.6z" })
      )
    );
  }

  // ─── RefreshButton ───

  function RefreshButton({ onClick }) {
    const handleClick = () => {
      clearSpotifyCache();
      onClick();
    };
    return h("button", {
      className: "stats-icon-btn",
      onClick: handleClick,
      "aria-label": "Refresh",
      title: "Refresh",
    },
      h("svg", { viewBox: "0 0 16 16", width: 16, height: 16, fill: "currentColor" },
        h("path", { d: "M0 4.75A3.75 3.75 0 013.75 1h8.5A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.02 1.02a.75.75 0 11-1.06 1.06L6.94 12.75l2.83-2.83a.75.75 0 111.06 1.06L9.81 12h2.44a2.25 2.25 0 002.25-2.25v-5A2.25 2.25 0 0012.25 2.5h-8.5A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5z" })
      )
    );
  }

  // ─── PageContainer (header + content) ───

  function PageContainer({ title, controls, children }) {
    return h("section", { className: "stats-page" },
      h("div", { className: "stats-page-header" },
        h("h1", { className: "stats-page-title" }, title),
        h("div", { className: "stats-page-controls" }, controls)
      ),
      h("div", { className: "stats-page-content" }, children)
    );
  }

  // ─── DropdownMenu (time range) ───

  function DropdownMenu({ options, activeOption, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      if (!open) return;
      const close = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("click", close, true);
      return () => document.removeEventListener("click", close, true);
    }, [open]);

    return h("div", { ref, className: "stats-dropdown" + (open ? " stats-dropdown--open" : "") },
      h("button", {
        className: "stats-dropdown-trigger",
        onClick: () => setOpen(!open),
      },
        h("span", null, activeOption.name),
        h("svg", { viewBox: "0 0 16 16", width: 14, height: 14, fill: "currentColor" },
          h("path", { d: "m14 6-6 6-6-6h12z" })
        )
      ),
      open && h("div", { className: "stats-dropdown-menu" },
        options.map((opt) =>
          h("button", {
            key: opt.id,
            className: "stats-dropdown-item" + (opt.id === activeOption.id ? " stats-dropdown-item--active" : ""),
            onClick: () => { onChange(opt); setOpen(false); },
          }, opt.name)
        )
      )
    );
  }

  function useRangeDropdown(storageKey) {
    const source = getDataSource();
    const options = getRangeOptions();
    const stored = Spicetify.LocalStorage?.get(storageKey);
    const initial = options.find((o) => o.id === stored) || options[0];
    const [active, setActive] = useState(initial);

    // Reset selection when source changes and current selection isn't valid
    useEffect(() => {
      const currentOptions = getRangeOptions();
      if (!currentOptions.find((o) => o.id === active.id)) {
        setActive(currentOptions[0]);
        Spicetify.LocalStorage?.set(storageKey, currentOptions[0].id);
      }
    }, [source]);

    const onChange = (opt) => {
      setActive(opt);
      Spicetify.LocalStorage?.set(storageKey, opt.id);
    };
    const dropdown = h(DropdownMenu, { options, activeOption: active, onChange });
    return [dropdown, active];
  }

  // ─── SpotifyCard (grid card for artists/albums) ───

  function SpotifyCard({ name, image, subtitle, badge, uri, type }) {
    const navigate = () => {
      if (uri) {
        Spicetify.Platform?.History?.push("/" + (type || "artist") + "/" + uri.split(":").pop());
      }
    };

    return h("div", { className: "stats-card", onClick: navigate, style: uri ? { cursor: "pointer" } : {} },
      h("div", { className: "stats-card-img-wrap" },
        image ? h("img", {
          className: "stats-card-img" + (type === "artist" ? " stats-card-img--circle" : ""),
          src: image,
          alt: name,
          loading: "lazy",
          onError: (e) => { e.target.style.opacity = "0"; },
        }) : h("div", { className: "stats-card-img stats-card-img--placeholder" + (type === "artist" ? " stats-card-img--circle" : "") }),
        badge != null && h("span", { className: "stats-card-badge" }, badge)
      ),
      h("div", { className: "stats-card-text" },
        h("span", { className: "stats-card-name" }, name),
        subtitle && h("span", { className: "stats-card-sub" }, subtitle)
      )
    );
  }

  // ─── TrackRow (single track in list) ───

  function TrackRow({ track, index, showStreams }) {
    const navigate = () => {
      if (track.uri) Spicetify.Platform?.History?.push("/track/" + track.uri.split(":").pop());
    };
    return h("div", { className: "stats-track-row", onClick: navigate },
      h("span", { className: "stats-track-rank" }, index + 1),
      track.image ? h("img", {
        className: "stats-track-art",
        src: track.image,
        alt: "",
        loading: "lazy",
        onError: (e) => { e.target.style.opacity = "0"; },
      }) : h("div", { className: "stats-track-art stats-track-art--placeholder" }),
      h("div", { className: "stats-track-info" },
        h("span", { className: "stats-track-name" },
          track.explicit && h("span", { className: "stats-track-explicit" }, "E"),
          track.name
        ),
        h("span", { className: "stats-track-artists" },
          (track.artists || []).map((a) => a.name).join(", ")
        )
      ),
      h("span", { className: "stats-track-album" }, track.album?.name || ""),
      showStreams
        ? h("span", { className: "stats-track-streams" }, formatNumber(track.streams))
        : h("span", { className: "stats-track-streams" }),
      h("span", { className: "stats-track-duration" }, formatTrackDuration(track.duration))
    );
  }

  // ─── TrackList (header + rows) ───

  function TrackList({ tracks, showStreams }) {
    const streamsLabel = showStreams ? (getDataSource() === "lastfm" ? "Plays" : "Streams") : "";
    return h("div", { className: "stats-tracklist" },
      h("div", { className: "stats-tracklist-header" },
        h("span", { className: "stats-track-rank" }, "#"),
        h("span", { className: "stats-track-art" }),
        h("span", { className: "stats-track-info" }, "Title"),
        h("span", { className: "stats-track-album" }, "Album"),
        h("span", { className: "stats-track-streams" }, streamsLabel),
        h("span", { className: "stats-track-duration" },
          h("svg", { viewBox: "0 0 16 16", width: 14, height: 14, fill: "currentColor" },
            h("path", { d: "M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" }),
            h("path", { d: "M8 3.25a.75.75 0 01.75.75v3.69l2.28 2.28a.75.75 0 01-1.06 1.06l-2.5-2.5A.75.75 0 017.25 8V4A.75.75 0 018 3.25z" })
          )
        )
      ),
      tracks.map((t, i) => h(TrackRow, { key: t.id || i, track: t, index: i, showStreams }))
    );
  }

  // ─── GenreBar ───

  function GenreBar({ genre, maxStreams }) {
    const pct = maxStreams > 0 ? Math.round((genre.streams / maxStreams) * 100) : 0;
    const label = getDataSource() === "lastfm" ? "tags" : "artists";
    return h("div", { className: "stats-genre-row" },
      h("span", { className: "stats-genre-rank" }, genre.position),
      h("span", { className: "stats-genre-name" }, titleCase(genre.tag)),
      h("div", { className: "stats-genre-bar-wrap" },
        h("div", { className: "stats-genre-bar-fill", style: { width: pct + "%" } })
      ),
      h("span", { className: "stats-genre-value" }, formatNumber(genre.streams))
    );
  }

  // ─── StatCard ───

  function StatCard({ label, value }) {
    return h("div", { className: "stats-stat-card" },
      h("span", { className: "stats-stat-value" }, value),
      h("span", { className: "stats-stat-label" }, label)
    );
  }

  // ─── NavigationBar ───

  function NavigationBar({ pages, activePage, onNavigate }) {
    return h("div", { className: "stats-navbar" },
      pages.map((page) =>
        h("button", {
          key: page,
          className: "stats-nav-chip" + (page === activePage ? " stats-nav-chip--active" : ""),
          onClick: () => onNavigate(page),
        }, page)
      )
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9: Page Components
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Top Artists ───

  function ArtistsPage() {
    const source = getDataSource();
    const [dropdown, range] = useRangeDropdown("stats:artists:range");
    const { status, data, error, refetch } = useStatsQuery(
      ["top-artists", source, range.id],
      () => fetchTopArtists(range.id)
    );

    const controls = h(Fragment, null, dropdown,
      h(RefreshButton, { onClick: refetch }),
      h(SettingsButton, { onClick: () => window.StatsConfig?.launchModal() })
    );

    if (status === "pending" || status === "error") {
      return h(PageContainer, { title: "Top Artists", controls },
        h(StatusDisplay, { status, error, onRetry: refetch })
      );
    }

    const artists = data || [];
    return h(PageContainer, { title: "Top Artists", controls },
      artists.length === 0
        ? h("p", { className: "stats-empty" }, "No artist data for this time range.")
        : h("div", { className: "stats-grid" },
            artists.map((a) =>
              h(SpotifyCard, {
                key: a.id,
                name: a.name,
                image: a.image,
                subtitle: source === "lastfm" ? formatNumber(a.streams) + " plays" : "#" + a.position,
                badge: a.position,
                uri: a.uri,
                type: "artist",
              })
            )
          )
    );
  }

  // ─── Top Tracks ───

  function TracksPage() {
    const source = getDataSource();
    const [dropdown, range] = useRangeDropdown("stats:tracks:range");
    const { status, data, error, refetch } = useStatsQuery(
      ["top-tracks", source, range.id],
      () => fetchTopTracks(range.id)
    );

    const controls = h(Fragment, null, dropdown,
      h(RefreshButton, { onClick: refetch }),
      h(SettingsButton, { onClick: () => window.StatsConfig?.launchModal() })
    );

    if (status === "pending" || status === "error") {
      return h(PageContainer, { title: "Top Tracks", controls },
        h(StatusDisplay, { status, error, onRetry: refetch })
      );
    }

    const tracks = data || [];
    const showStreams = source === "lastfm";
    return h(PageContainer, { title: "Top Tracks", controls },
      tracks.length === 0
        ? h("p", { className: "stats-empty" }, "No track data for this time range.")
        : h(TrackList, { tracks, showStreams })
    );
  }

  // ─── Top Albums ───

  function AlbumsPage() {
    const source = getDataSource();
    const [dropdown, range] = useRangeDropdown("stats:albums:range");
    const { status, data, error, refetch } = useStatsQuery(
      ["top-albums", source, range.id],
      () => fetchTopAlbums(range.id)
    );

    const controls = h(Fragment, null, dropdown,
      h(RefreshButton, { onClick: refetch }),
      h(SettingsButton, { onClick: () => window.StatsConfig?.launchModal() })
    );

    if (status === "pending" || status === "error") {
      return h(PageContainer, { title: "Top Albums", controls },
        h(StatusDisplay, { status, error, onRetry: refetch })
      );
    }

    const albums = data || [];
    return h(PageContainer, { title: "Top Albums", controls },
      albums.length === 0
        ? h("p", { className: "stats-empty" }, "No album data for this time range.")
        : h("div", { className: "stats-grid" },
            albums.map((a) =>
              h(SpotifyCard, {
                key: a.id,
                name: a.name,
                image: a.image,
                subtitle: source === "lastfm"
                  ? (a.artists.map((ar) => ar.name).join(", ") || "") + " \u00B7 " + formatNumber(a.streams) + " plays"
                  : (a.artists.map((ar) => ar.name).join(", ") || "") + " \u00B7 " + a.streams + " tracks in top 50",
                badge: a.position,
                uri: a.uri,
                type: "album",
              })
            )
          )
    );
  }

  // ─── Top Genres ───

  function GenresPage() {
    const source = getDataSource();
    const [dropdown, range] = useRangeDropdown("stats:genres:range");
    const [showAll, setShowAll] = useState(false);
    const { status, data, error, refetch } = useStatsQuery(
      ["top-genres", source, range.id],
      () => fetchTopGenres(range.id)
    );

    const controls = h(Fragment, null, dropdown,
      h(RefreshButton, { onClick: refetch }),
      h(SettingsButton, { onClick: () => window.StatsConfig?.launchModal() })
    );

    if (status === "pending" || status === "error") {
      return h(PageContainer, { title: "Top Genres", controls },
        h(StatusDisplay, { status, error, onRetry: refetch })
      );
    }

    const genres = data || [];
    const visible = showAll ? genres : genres.slice(0, 15);
    const maxStreams = genres.length > 0 ? genres[0].streams : 1;

    return h(PageContainer, { title: "Top Genres", controls },
      genres.length === 0
        ? h("p", { className: "stats-empty" }, "No genre data for this time range.")
        : h("div", { className: "stats-genres" },
            visible.map((g) => h(GenreBar, { key: g.tag, genre: g, maxStreams })),
            genres.length > 15 && h("button", {
              className: "stats-btn stats-btn--ghost",
              onClick: () => setShowAll(!showAll),
              style: { marginTop: "12px" },
            }, showAll ? "Show Less" : "Show All " + genres.length + " Genres")
          )
    );
  }

  // ─── Stats Overview ───

  function StatsPage() {
    const source = getDataSource();
    const needsUser = source === "lastfm" && !getLastfmUser();

    const { status: statsStatus, data: statsData, error: statsError, refetch: statsRefetch } = useStatsQuery(
      ["stats-overview", source],
      () => fetchStatsOverview(),
      { enabled: !needsUser }
    );
    const { data: recentData, refetch: recentRefetch } = useStatsQuery(
      ["recent-streams", source],
      () => fetchRecentStreams(),
      { enabled: !needsUser, staleTime: 30 * 1000 }
    );

    if (needsUser) return h(StatusDisplay, { status: "no-user", onOpenSettings: () => window.StatsConfig?.launchModal() });

    const refreshAll = () => {
      statsRefetch();
      recentRefetch();
    };

    const controls = h(Fragment, null,
      h(RefreshButton, { onClick: refreshAll }),
      h(SettingsButton, { onClick: () => window.StatsConfig?.launchModal() })
    );

    if (statsStatus === "pending" || statsStatus === "error") {
      return h(PageContainer, { title: "Stats", controls },
        h(StatusDisplay, { status: statsStatus, error: statsError, onRetry: statsRefetch })
      );
    }

    const s = statsData || {};
    const recent = recentData || [];

    // Build stat cards based on source
    let statCards;
    if (s.source === "lastfm") {
      statCards = [
        h(StatCard, { key: "scrobbles", label: "Total Scrobbles", value: formatNumber(s.totalScrobbles) }),
        h(StatCard, { key: "artists", label: "Artists", value: formatNumber(s.artistCount) }),
        h(StatCard, { key: "tracks", label: "Tracks", value: formatNumber(s.trackCount) }),
        h(StatCard, { key: "albums", label: "Albums", value: formatNumber(s.albumCount) }),
        s.registered && h(StatCard, { key: "since", label: "Scrobbling Since", value: s.registered.toLocaleDateString(undefined, { year: "numeric", month: "short" }) }),
      ].filter(Boolean);
    } else {
      statCards = [
        h(StatCard, { key: "artists", label: "Top Artists", value: formatNumber(s.topArtistCount) }),
        h(StatCard, { key: "tracks", label: "Top Tracks", value: formatNumber(s.topTrackCount) }),
        h(StatCard, { key: "albums", label: "Top Albums", value: formatNumber(s.topAlbumCount) }),
        h(StatCard, { key: "genres", label: "Top Genres", value: formatNumber(s.topGenreCount) }),
      ];
    }

    return h(PageContainer, { title: "Stats", controls },
      h("div", { className: "stats-overview-grid" }, ...statCards),

      recent.length > 0 && h("div", { className: "stats-recent" },
        h("h2", { className: "stats-section-title" }, "Recently Played"),
        recent.map((stream, i) =>
          h("div", { key: (stream.id || i) + "-" + i, className: "stats-recent-row" },
            h("span", { className: "stats-recent-name" },
              stream.trackName,
              stream.artistName ? h("span", { className: "stats-recent-artist" }, " \u2014 " + stream.artistName) : null
            ),
            h("span", { className: "stats-recent-time" },
              stream.endTime
                ? stream.endTime.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                : ""
            ),
            h("span", { className: "stats-recent-dur" }, formatDuration(stream.playedMs))
          )
        )
      )
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 10: App Shell & Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  const PAGE_MAP = {
    Artists: ArtistsPage,
    Tracks: TracksPage,
    Albums: AlbumsPage,
    Genres: GenresPage,
    Stats: StatsPage,
  };

  const PAGE_CONFIG_MAP = {
    Artists: "artists",
    Tracks: "tracks",
    Albums: "albums",
    Genres: "genres",
    Stats: "stats",
  };

  function App() {
    const [ready, setReady] = useState(false);
    const [activePage, setActivePage] = useState(null);
    statsLog("INFO", "App component mounted");

    // Wait for dependencies
    useEffect(() => {
      let cancelled = false;
      (async () => {
        // Wait for StatsConfig from extension.js
        statsLog("INFO", "Waiting for StatsConfig...");
        let retries = 0;
        while (!window.StatsConfig && retries < 200) {
          await new Promise((r) => setTimeout(r, 50));
          retries++;
        }
        if (!window.StatsConfig) statsLog("WARN", "StatsConfig not found after timeout");
        else statsLog("INFO", "StatsConfig ready, source=" + (window.StatsConfig.getDataSource?.() || "(unknown)"));

        // Wait for Platform.History
        statsLog("INFO", "Waiting for Platform.History...");
        retries = 0;
        while (!Spicetify.Platform?.History && retries < 200) {
          await new Promise((r) => setTimeout(r, 50));
          retries++;
        }
        if (!Spicetify.Platform?.History) statsLog("WARN", "Platform.History not found after timeout");
        else statsLog("INFO", "Platform.History ready");

        if (!cancelled) {
          // Determine initial page
          const path = Spicetify.Platform?.History?.location?.pathname || "";
          const urlPage = path.split("/")[2] || "";
          const storedPage = Spicetify.LocalStorage?.get("stats:active-page") || "Artists";
          const page = Object.keys(PAGE_MAP).find((p) => p === urlPage) || storedPage;
          statsLog("INFO", "App ready, initial page=" + page + " (url=" + urlPage + ", stored=" + storedPage + ")");
          setActivePage(page);
          setReady(true);
        }
      })();
      return () => { cancelled = true; };
    }, []);

    // Listen for history changes
    useEffect(() => {
      if (!ready) return;
      const unlisten = Spicetify.Platform?.History?.listen?.((loc) => {
        const page = (loc.pathname || "").split("/")[2] || "";
        if (PAGE_MAP[page]) {
          setActivePage(page);
        }
      });
      return () => { if (typeof unlisten === "function") unlisten(); };
    }, [ready]);

    const navigate = useCallback((page) => {
      statsLog("INFO", "Navigate -> " + page);
      setActivePage(page);
      Spicetify.LocalStorage?.set("stats:active-page", page);
      Spicetify.Platform?.History?.push?.("/stats/" + page);
    }, []);

    if (!ready) {
      return h("div", { id: "stats-app" },
        h("div", { className: "stats-status" }, h("div", { className: "stats-spinner" }), h("p", null, "Loading..."))
      );
    }

    // Filter pages by config
    const config = window.StatsConfig;
    const visiblePages = Object.keys(PAGE_MAP).filter((p) => {
      const key = PAGE_CONFIG_MAP[p];
      return config ? config.isPageEnabled(key) : true;
    });

    // Ensure activePage is in visible pages
    const currentPage = visiblePages.includes(activePage) ? activePage : visiblePages[0] || "Artists";
    const PageComponent = PAGE_MAP[currentPage];

    return h("div", { id: "stats-app" },
      h(NavigationBar, { pages: visiblePages, activePage: currentPage, onNavigate: navigate }),
      PageComponent ? h(PageComponent, null) : null
    );
  }

  // ─── Export ───
  // Spicetify's bundler wraps index.js into a module that accesses `render` directly.
  // We assign to the outer `var render` so it's available at module scope.
  render = function () {
    return h(App, null);
  };

  return { render };
})();
