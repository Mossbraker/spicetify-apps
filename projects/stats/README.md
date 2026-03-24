# Spicetify Stats

### A custom app that shows you your top artists, tracks, genres and an analysis of your whole library, including individual playlists.

---

### Top Artists

![preview](previews/top_artists.png)

---

### Top Tracks

![preview](previews/top_tracks.png)

---

### Top Genres

![preview](previews/top_genres.png)

---

### Library Analysis

![preview](previews/library_analysis.png)

---

### Playlist Analysis

![preview](previews/playlist_analysis.png)

---

### Top Albums (works with Last.fm Sync only)

![preview](previews/top_albums.png)

---

### Last.fm Daily Charts

![preview](previews/top_charts.png)

---

### Artist Stats

- Toggleable "Artist Stats" button on artist pages that surfaces user scrobble count, total listening time, playlist inclusions, top tracks, top genres, discography, and related artists.

---
### Automatic Installation (Linux)

```sh
sh <(curl -s https://raw.githubusercontent.com/harbassan/spicetify-apps/refs/heads/main/projects/stats/install.sh)
```

### Automatic Installation (Windows, Powershell)

```ps1
iwr -useb "https://raw.githubusercontent.com/harbassan/spicetify-apps/refs/heads/main/projects/stats/install.ps1" | iex
```

### Manual Installation

Download the zip file in the [latest release](https://github.com/harbassan/spicetify-apps/releases?q=stats&expanded=true), rename the unzipped folder to `stats`, then place that folder into your `CustomApps` folder in the `spicetify` directory and you're all done. If everything's correct, the structure should be similar to this:

```
📦spicetify\CustomApps
 ┣ 📂marketplace
 ┣ etc...
 ┗ 📂stats
 ┃ ┣ 📜cache.js
 ┃ ┣ 📜debug.js
 ┃ ┣ 📜extension.js
 ┃ ┣ 📜index.js
 ┃ ┣ 📜manifest.json
 ┃ ┣ 📜optional_enrichment.js
 ┃ ┗ 📜style.css
```

Finally, run these commands to apply:

```powershell
spicetify config custom_apps stats
spicetify apply
```

That's it. Enjoy.

For more help on installing visit the [Spicetify Docs](https://spicetify.app/docs/advanced-usage/custom-apps#installing).

For the best experience, you should set up Last.fm and OAuth in the Stats app settings.

### Optional OAuth Setup

Stats can use your own Spotify Developer app for Spotify Web API requests. This is optional, but recommended if the built-in Spotify session is being rate-limited.

1. Go to <https://developer.spotify.com/dashboard> and create an app.
2. Give it any name and description.
3. Add `http://127.0.0.1:5173/callback` as a Redirect URI in the app settings.
4. If Spotify asks which APIs you want to use, select `Web API`.
5. Copy the app's `Client ID` from the Spotify dashboard.
6. Open Spotify, open the `Statistics` app, and open the app settings.
7. Paste the client ID into `Spotify Client ID`.
8. Toggle `Use OAuth` on.
9. Your browser will open and ask you to log in to Spotify and authorize the app.
10. After authorizing, Spotify will redirect to a URL starting with `http://127.0.0.1:5173/callback?code=...`.
11. Copy that entire URL from the browser address bar and paste it into `Paste Callback URL` in the Stats settings.
12. You should see a `Successfully connected to Spotify!` notification.
13. Use the refresh button in the app to trigger a fresh fetch.

Notes:

- Use `127.0.0.1`, not `localhost`, for the redirect URI.
- OAuth status is shown in the settings modal.
- If you see a failed connection notification or the status row reports that no usable token is available, toggle `Use OAuth` off and on again and repeat the PKCE flow.

### Data Sources And Limitations

Stats does not use one single source for everything.

- `Top Artists` and `Top Tracks`: Spotify by default. If `Use Last.fm for Stats` is enabled, or Spotify top endpoints are temporarily suppressed and Last.fm is configured, these pages can use Last.fm data instead.
- `Top Genres`: built from the current timeframe's top tracks and top artists. Spotify artist genres are used first, then Last.fm artist tags as fallback, and optionally MusicBrainz tags.
- `Top Albums`: Last.fm-backed.
- `Charts`: Last.fm-backed global chart data.
- `Library Analysis` and `Playlist Stats`: built from your Spotify library and playlist contents, then enriched with Spotify metadata and audio features when those endpoints are available.

Known limitations:

- Spotify may still return `429` or `403` even when OAuth is configured.
- Spotify audio-features and artist metadata endpoints can be unavailable for some users or sessions; when this happens, some metrics are shown as `Unavailable` and genre/artwork enrichment may be reduced.
- Last.fm is required for `Top Albums` and `Charts`, and strongly recommended if you want fallback behavior when Spotify is rate-limited.
- MusicBrainz is optional and may temporarily cool down after `429` or `503` responses.

### Settings Reference

- `Use OAuth`: uses your Spotify Developer app instead of relying entirely on the built-in Spotify session.
- `OAuth Status`: shows whether a usable access token is present and whether a refresh token is available for automatic recovery.
- `Use Direct Fetch (Experimental)`: bypasses `CosmosAsync` and uses direct Spotify Web API requests with the internal Spotify token. This can sometimes help when the built-in request path behaves badly, but it is not guaranteed and is still subject to Spotify limits.
- `Use Last.fm for Stats`: prefer Last.fm as the main source for top artists and tracks.
- `LastFM Only (No Spotify API)`: avoid Spotify API calls for Stats pages and use Last.fm-only conversions without Spotify enrichment.
- `Include MusicBrainz Genre Tags`: augments genre analysis with MusicBrainz tags derived from the current timeframe's top tracks and top artists.
- Page toggles: show or hide individual Stats pages.

### Uninstallation

To uninstall the app, run these commands:

```powershell
spicetify config custom_apps stats-
spicetify apply
```

If you want to remove the app completely, just delete the `stats` folder after running the above commands.

---

If you have any questions or issues regarding the app, open an issue on this repo. While doing so, please specify your spicetify version and installation method.

If you like the app, I'd be really grateful if you liked the repo ❤️.
