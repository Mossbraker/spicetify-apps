## Summary

- Adds optional Spotify OAuth PKCE flow with user-provided credentials to bypass rate limiting as I previously mentioned [here](https://github.com/harbassan/spicetify-apps/issues/236#issuecomment-3786780852) in #236 (requires user to supply their own Spotify developer API - setup is detailed in `projects/stats/README.md`)
- Hardens both Stats and Library against current Spotify client instability (429s, React #<span></span>31 crashes, wrapper breakage)
- Keeps Last.fm as a first-class, standalone data source when Spotify endpoints are degraded
- Adds a Last.fm-only mode so the app remains usable without Spotify enrichment
- Adds CI workflows for build validation and releases
- Addresses all automated review feedback across multiple review rounds
- Fixes Library Albums tab not working #232
- Fixes React #310 hooks violation in both Stats and Library apps #244

## New features & enhancements

### Stats: Artist Stats page (#78)
- Adds a popup modal on artist pages showing comprehensive artist data
- Overview stats: monthly listeners, followers, world rank, album/single counts
- Genre chart from Last.fm tags with graceful degradation when not configured
- Throttled playlist scanning (5 concurrent) with progress indicator and auto-load setting
- Spotify top 10 tracks, Last.fm global top 50 tracks (button-loaded)
- Discography shelves (albums, singles/EPs) and related artists
- Extracts `usePopupQuery` hook from playlist.tsx for shared reuse
- Estimated listening time calculation from user scrobbles + average track duration

### Stats: Artist Stats page — UI improvements
- **Button injection**: Replaces the tiny topbar icon with a pill button (icon + "Artist Stats" label) injected directly into the artist page action bar; falls back to the topbar button if the action bar is absent
- **Button position**: Configurable via a slider setting (order values −3 to 5) so users can fine-tune placement in the action bar
- **Auto-load setting**: New toggle to auto-scan playlists on open vs. showing a manual "Load" button
- **Modal layout**: Stats overview split into two rows — artist-level stats (listeners, followers, rank, albums, singles) and a user-level row (your scrobbles + estimated listening time) separated by a subtle divider; only shown when user data exists
- **Modal polish**: Reduced top whitespace and softened border radius (12px)
- **Playlist Appearances**: Collapsed to 6 cards initially; "Show all N playlists" / "Show fewer" toggle for long lists; playlist card images fetched and displayed
- **Track list toggles**: Last.fm Global Top Tracks and Your Top Scrobbled Tracks sections collapsed to 10 items initially with "Show all N tracks" / "Show fewer" toggle
- **Clickable Spotify top tracks**: Each track row navigates to the Spotify track page on click (modal closes automatically)
- **Linked Last.fm tracks**: Last.fm Global Top Tracks rows are `<a>` elements linking to Last.fm track pages in a new tab
- **"Your Top Scrobbled Tracks" section**: New shelf (requires Last.fm API key + username) showing per-track user scrobble counts, fetched via `track.getInfo?username=X` and sorted by plays
- **Settings reorganisation**: Last.fm Integration at top, OAuth section consolidated (Status before Disconnect, Use Direct Fetch folded in), Diagnostics at bottom

### Stats: Artist Stats page — Bug fixes and polish (recent)
- **Context menus**: Right-click and three-dot button on tracks in the main Stats Tracks tab show a custom context menu (Play, Add to queue, Go to song/artist/album, Copy song link) using `RightClickMenu` + `Menu`/`MenuItem` JSX element pattern; "Copy song link" copies `https://open.spotify.com/track/{id}` (web URL, not `spotify:` URI) for Spotify tracks; Last.fm tracks use "Copy link" which copies the Last.fm URL verbatim
- **Context menu approach**: `Spicetify.ReactComponent.TrackMenu` is undefined at runtime (Spicetify CLI extraction bug — see `docs/SPICETIFY_LIMITATIONS.md`), so native Spotify track context menu is not available from custom components
- **Last.fm Global Top Tracks album art**: Enriches tracks missing album art via batched `track.getInfo` calls (concurrency=5) to fetch actual album images instead of showing letter fallback
- **"Following" button sizing**: Fixes the injected Artist Stats button affecting the flex layout of Spotify's native action bar buttons via `align-self: center` CSS
- **Prefer Spotify Links** *(not exposed — deferred)*: `resolveTrackUri()` utility and `searchAndNavigate` fallback are implemented; the UI settings toggle has been removed until the feature covers all link types (main Stats pages, SpotifyCard, TrackRow)
- **Search fallback**: `resolveTrackUri()` utility for background URI resolution with `cosmosCache` and CosmosAsync fallback
- **TDZ crash fix**: Fixed `ReferenceError: Cannot access 'k' before initialization` caused by `useEffect` referencing `data` variable (from `usePopupQuery`) before its declaration — moved the effect after hook call order
- **Modal context menu crash**: Removed `RightClickMenu`/`Menu`/`MenuItem` from `ArtistTrackRow` in the popup modal — PopupModal renders outside the main React provider tree, missing `StableUseNavigateProvider` and `PlatformProvider` (see `docs/SPICETIFY_LIMITATIONS.md`)
- **Auto-load settings**: Separate toggles for auto-loading Last.fm top tracks and user scrobbled tracks
- **Search rate limiting**: `isSuppressedSpotifyError` helper to catch 403/429 errors and fall back gracefully
- **Config gating**: MutationObserver and 5-second fallback timer are only attached when `show-artist-stats-button` is enabled; observer and timers are cleaned up when navigating artist-to-artist with the feature disabled
- **Deduplicated overview fetch**: `openArtistStats` pre-populates an overview cache so ArtistPage skips the redundant GraphQL call (was fetched twice — once for the modal title, once by the page)
- **Bounded artist caches**: Module-level caches for artist data, playlists, Last.fm tracks, and user tracks now prune expired entries and enforce a 50-entry cap on each write to prevent unbounded memory growth over long sessions
- **lastfm-only clarification**: Updated toggle description and README to clarify that "LastFM Only" only gates public Spotify Web API calls — Artist Stats uses Spicetify's internal GraphQL and is exempt
- **SVG injection safety**: Replaced `innerHTML` with `document.createElementNS` for the save icon SVG in the reorder modal header
- **Drag-and-drop off-by-one fix**: Fixed reorder modal placing items one position too far when dragging downward (adjusted insertion index to account for post-splice shift)

### Stats & Library: Performance and rate-limit fixes (code review)
- **External fetch caching (Stats)**: Added in-memory cache with 30-min TTL and 200-entry cap for all non-Spotify API requests (Last.fm, MusicBrainz) at the `apiFetch` level, preventing redundant requests when navigating back and forth between pages
- **GitHub release check caching (both apps)**: Added `sessionStorage`-backed cache with 1-hour TTL for the GitHub releases API check, preventing unauthenticated GitHub API rate limit exhaustion (60 req/hr)
- **GitHub release check null safety (both apps)**: Added null-guard on `release.name` in `processReleases` — GitHub API can return `name: null`, which would crash the update check
- **Custom Order client-side pagination (Library)**: Albums in Custom Order sort are now rendered in pages of 200 with a LoadMoreCard, preventing DOM thread lock-up for users with large libraries (previously rendered all items at once)
- **Top bar transparency (both apps)**: Fixed scroll-driven grey header overlay appearing in Library and Stats apps by also targeting Spotify's inner background child elements with transparent overrides
- **Colorful folder icons (Library)**: Replaced the plain grey folder SVG fallback with a Spotify-green gradient folder icon for playlist folders (both in the card grid and the sidebar)
- **Sidebar folder injection fix (Library)**: Fixed `return` → `continue` bug in `injectFolderImages` that caused the loop to abort instead of skipping a single folder in compact view
- **Playlist artwork from RootlistAPI (Library)**: Supplemented `LibraryAPI.getContents()` (which returns empty `images` arrays) with a hybrid image-fetching strategy: bulk `RootlistAPI.getContents({ flatten: true })` for already-resolved images, then per-playlist `PlaylistAPI.getMetadata()` fallback (batched in groups of 10) for remaining items. Module-level deduplication cache prevents re-fetching on pagination and navigation. Cards render immediately with images appearing progressively (no flickering).
- **Custom order local album filter (Library)**: Filtered `customOrderStore.reconcile()` to standard albums only (`type === "album"`), excluding local album URIs from persisted custom order to match the reorder modal's filter
- **Header alignment fix (Library)**: Fixed page header controls (dropdowns, search bar) left-aligning when the header wraps to two lines by adding `margin-left: auto` to `.header-right`
- **SVG gradient ID fix (Library)**: Replaced inline `<linearGradient id="folderGrad">` in folder card SVGs with `fill="currentColor"` + CSS `color: #1db954` to avoid duplicate DOM IDs when multiple folder cards render
- **Playlist image flicker fix (shared)**: SpotifyCard now layers the fallback initials behind the `<img>` with opacity crossfade — the fallback stays visible until `onLoad` fires, eliminating the visible DOM-swap flash when images arrive asynchronously
- **Live config callbacks (Stats)**: "Show Artist Stats Button" toggle now immediately removes/re-inserts the button when toggled (cleans up observer, timers, and fallback); "Button Position" slider updates the button's CSS order live without requiring navigation
- **Bounded playlist image cache (Library)**: Module-level `fetchedImageUris` and `imageCache` now use FIFO eviction (max 2000 entries) to prevent unbounded memory growth over long sessions
- **Lazy track artwork loading (Stats)**: Changed `loading="eager"` to `loading="lazy"` on track artwork images in `ArtistTrackRow` and `TrackRow` to defer off-screen image fetches

### Library: Custom Album Sorting (#76)
- Adds "Custom Order" sort option to the Albums page with drag-and-drop reorder modal
- Persists order in localStorage via `CustomOrderStore` (EventTarget pattern matching CollectionsWrapper)
- Dual-query strategy: `useInfiniteQuery` for standard sorts, `useQuery` for custom sort
- Reconciliation with short-circuit guard to prevent infinite loops
- Full filter integration (All/Albums/Local Albums works correctly with custom sort)
- Reorder button hidden during loading and when text filter is active
- Guards against `undefined` data when switching between custom and standard sorts (both directions)
- Belt-and-suspenders guard in `fetchAlbums` prevents invalid sort order reaching `LibraryAPI.getContents`
- Skips redundant text filtering of local albums in custom-order mode (already filtered by fetchLocalAlbums)
- Firefox drag-and-drop compatibility via `dataTransfer.setData` payload

### Library: Item counts (#135)
- Adds togglable item count display to all Library pages (Albums, Artists, Playlists, Collections, Shows)
- Gated behind "Show Item Count" setting (enabled by default)

### Library: Artist → Album drill-down (#202)
- When enabled, clicking an artist shows their saved albums from your library instead of navigating to the Spotify artist page
- Gated behind "Artist → Albums View" setting (disabled by default)
- Includes keyboard accessibility (Enter/Space to activate, focus-visible styles)

### Library: Release Year sort (#76)
- Adds "Release Year" sort option to the Albums page (relies on API sort order)
- Adds `collectionSort` handler for sort order "3" so local album merge sorting works correctly — local albums sort to the end alphabetically (they lack release year metadata)

### Library: Local albums fix (#243/#232)
- Fixes local albums not rendering in the Albums tab by using CustomCard for non-Spotify album types
- Updates AlbumItem type to include `"localalbum"` variant for proper type safety
- Fixes `isValidAlbum` filtering out local albums (local artists don't have Spotify URIs)
- Fixes CustomCard (`<button>`) sizing mismatch with SpotifyCard (`<a>`) via CSS reset

### Stats: Playlist frequency charts (#77)
- Enables artist and album frequency chart shelves on the playlist analysis page
- Conditionally rendered only when data exists

### React #310 fix (both apps)
- Moves `useEffect` calls above conditional early returns in both `app.tsx` files
- Fixes "Rendered more hooks than during the previous render" crash

### Code quality
- Adds React `key` props to all list-rendered card elements across Library and Stats pages
- Removes dead `.stats-item-count` CSS class
- Adds focus-visible styles for artist drill-down wrapper and back button
- Fixes `PageContainer` children type from `ReactElement | ReactElement[]` to `ReactNode`
- Fixes Collections page type narrowing for `CollectionChild` union (accesses `items`/`image` safely)

## Context

Both apps had become unreliable on current Spotify desktop clients:

1. **Stats** was failing due to aggressive Spotify-side rate limiting (`429`, `400`, `403`) on the built-in CosmosAsync request path.
2. Both **Stats** and **Library** were crashing on current clients due to fragile Spicetify React wrapper usage triggering the React #<span></span>31 error pattern. #244

## Stats changes

### React #31 and #310 mitigation

Replaces broken Spicetify React wrapper components with app-owned UI to avoid the React #31 ("Objects are not valid as a React child") crash pattern, and fixes the React #310 ("Rendered more hooks than during the previous render") hooks violation:

- **NavigationBar** (shared, used by Stats on every page): Removes `ReactDOM.createPortal` and `Spicetify.ReactComponent.Chip` entirely — navigation chips are now plain `<button>` elements rendered inline
- **StatCard**: Replaces `TextComponent` wrapper (x2) with plain `<div>` elements
- **Shelf**: Replaces `TextComponent` wrapper with a plain `<h2>`
- **RefreshButton**: Replaces `IconComponent` and `ButtonTertiary` wrappers with plain `<svg>` and `<button>` elements
- **TrackRow**: Uses `RightClickMenu` + custom `Menu`/`MenuItem` for context menus (native `TrackMenu` is unavailable — see `docs/SPICETIFY_LIMITATIONS.md`); passes menu as JSX element, not function component
- **SortDropdownMenu** (shared): Replaces `ContextMenu`, `Menu`, `MenuItem`, `TextComponent`, and `IconComponent` wrappers with a native `<select>` and plain `<button>` with inline SVG

### OAuth, direct fetch, and rate-limit handling

- Adds Spotify Authorization Code with PKCE support so users can supply their own Spotify developer app credentials
- Secures the OAuth flow with CSRF state parameter validation and sessionStorage for ephemeral auth values (code_verifier, state)
- Fixes token refresh race condition with a deduplication guard so concurrent 401s don't trigger parallel refresh attempts
- Adds `fetchWithRetry` utility with exponential backoff, `Retry-After` header support, and configurable retry limits
- Adds endpoint suppression so repeated failures don't hammer the same broken Spotify endpoints
- Adds an optional direct fetch path to bypass CosmosAsync when that helps
- Adds a Stats debug console for request and rendering diagnostics (gated behind enabled flag to prevent memory leaks)

### Last.fm-first resilience

- Keeps Last.fm support as a first-class data source
- Adds a Last.fm-only mode so the app remains usable without Spotify enrichment
- Adds optional MusicBrainz genre augmentation with proper `User-Agent` header (dynamically versioned)
- Replaces sequential genre enrichment loops with a concurrency pool (5 concurrent requests) for Last.fm and MusicBrainz lookups

### Charts artwork fallback improvements

- Preserves Last.fm artwork for chart albums when Spotify enrichment is unavailable
- Adds artist artwork fallback via Last.fm `artist.getTopAlbums`
- Adds track artwork fallback via Last.fm `track.getInfo`
- Filters known Last.fm placeholder images so fake artwork is not treated as a cache hit

### Caching improvements

- Adds a bounded localStorage-backed persistent cache for Spotify search enrichment results
- Chart query keys now incorporate OAuth and direct-fetch flags so toggling settings invalidates stale cached data
- Implements LRU cache eviction and suppression TTL capping
- Fixes localStorage iteration bug during cache purge
- Prunes stale persisted `search-*` `400` suppressions on load

### Code quality

- Replaces `any` types with proper interfaces across both API modules and types
- Converts `.then()` chains to `async/await` in API modules
- Fixes `oauthFetch` 401 silent fall-through with explicit throw
- Fixes `checkForUpdates` crash on empty releases array

## Library changes

### React #31 mitigation

Replaces the riskiest wrapper-based paths with simpler, app-owned UI:

- Native controls instead of problematic menu primitives
- Plain card markup instead of higher-level wrapper cards
- Explicit route handling instead of relying on wrapper behavior

### Safer cards and navigation

- Replaces Library card rendering with plain HTML card markup
- Replaces the old Load More card text wrapper path with simpler HTML
- Converts Spotify URIs (`spotify:album:{id}`) into explicit client routes (`/album/{id}`) before navigation
- Fixes blank-page and wrong-route failures after card clicks

### Safer control paths

- Replaces the shared sort dropdown with a native `select` plus direction toggle
- Simplifies the Add button flow with proper ARIA attributes (`aria-expanded`, `aria-controls`, `aria-haspopup`), Escape key handling, and focus management
- Adds Escape-to-close support for PopupModal dialogs (TextInputDialog)
- Fixes AddButton return type annotation (was incorrectly typed as `HTMLButtonElement`)

### Security: SVG sanitization

- Removes `dangerouslySetInnerHTML` from 6 SVG components (back button, expand button, folder fallback, leading icon, searchbar, add button menu icons)
- Adds `sanitizeSvgPaths` utility using an allowlist approach — only safe SVG elements and attributes are rendered

### Other

- Updates the app root to use `window.SpicetifyLibrary`
- Adds a Library debug console (gated behind enabled flag)
- Shows page: fetches saved shows from `/v1/me/shows`, falls back to `LibraryAPI.getContents` on 429, then to last cached response
- Fixes Card Size slider not rendering (replaces Spotify-internal CSS classes with standalone `<input type="range">`)
- Fixes page header overflow on pages with many controls (Playlists) via `flex-wrap`

## Accessibility

- Render album name as `<span>` instead of `<a>` when no `albumUri` exists (Last.fm tracks) to avoid inaccessible href-less anchors
- Track artwork images use `aria-hidden="true"` with empty `alt` (decorative pattern)

## Infrastructure

- Removes `projects/*/dist/` and `releases/` from git tracking (local copies preserved)
- Updates `.gitignore` to ignore build artifacts, release zips, `.claude/`, and editor-specific configs
- Fixes root workspace paths from `["stats", "library"]` to `["projects/stats", "projects/library"]`
- Regenerates clean `package-lock.json`
- Adds build validation CI workflow (push/PR triggers, matrix build for both apps)
- Adds release CI workflow (tag-triggered, builds app, creates GitHub Release with zip)

## Documentation

- `docs/STATS_IMPLEMENTATION_NOTES.md` — Stats architecture decisions and resilience strategy
- `docs/LIBRARY_IMPLEMENTATION_NOTES.md` — Library recovery strategy and tradeoffs
- `docs/RATE_LIMIT_RESEARCH.md` — Rate limiting research and OAuth setup instructions
- `docs/SPICETIFY_LIMITATIONS.md` — Known Spicetify platform constraints (TrackMenu, PopupModal providers, ContextMenu prop patterns)

## Testing

Validated locally with:

- `cd projects/stats && npm run build-local`
- `cd projects/library && npm run build-local`

Both builds complete successfully.

## Test plan

- [ ] Verify Stats loads and displays top tracks/artists with OAuth enabled
- [ ] Verify Stats falls back to Last.fm-only mode when Spotify endpoints are suppressed
- [ ] Verify chart artwork shows Last.fm fallbacks when Spotify enrichment is unavailable
- [ ] Verify Stats playlist page shows artist and album frequency charts
- [ ] Verify Library cards navigate correctly (no blank pages)
- [ ] Verify Library Add button opens/closes with keyboard (Enter, Escape)
- [ ] Verify toggling OAuth/direct-fetch settings refreshes data (not stale cache)
- [ ] Verify Library item counts appear on all pages with "Show Item Count" enabled
- [ ] Verify item counts hide when "Show Item Count" is disabled
- [ ] Verify Artist → Albums view shows saved albums when enabled
- [ ] Verify clicking an artist navigates to Spotify artist page when drill-down is disabled
- [ ] Verify local albums render correctly in Albums tab (same card size as regular albums)
- [ ] Verify Release Year sort option works on Albums page
- [ ] Verify Card Size slider is visible and functional in Library Settings
- [ ] Verify PopupModal dialogs close on Escape key
- [ ] Verify Playlists page header wraps without overflow
- [ ] Verify CI build workflow passes on push
- [ ] Verify Artist Stats topbar button appears/hides on artist pages (fallback only)
- [ ] Verify Artist Stats pill button is injected into the artist page action bar
- [ ] Verify button position slider moves the button left/right in the action bar
- [ ] Verify "Show Artist Stats Button" toggle hides/shows the injected button
- [ ] Verify Artist Stats popup shows overview stats, genres, top tracks, discography
- [ ] Verify artist-level stats row and user-level stats row render separately (user row hidden when no scrobble data)
- [ ] Verify Artist Stats Last.fm integration (scrobbles, genre tags, global top tracks)
- [ ] Verify Artist Stats graceful degradation without Last.fm
- [ ] Verify Artist Stats playlist scanning with progress indicator
- [ ] Verify Playlist Appearances collapses to 6 cards with "Show all N playlists" toggle
- [ ] Verify playlist cards display cover images
- [ ] Verify clicking a Spotify top track navigates to the track page (modal closes)
- [ ] Verify Last.fm Global Top Tracks rows link to Last.fm in a new tab
- [ ] Verify "Your Top Scrobbled Tracks" section appears with Last.fm key + username configured
- [ ] Verify "Your Top Scrobbled Tracks" hidden without Last.fm username
- [ ] Verify Stats Settings section order: Last.fm → OAuth → Pages → Artist Stats → Diagnostics
- [ ] Verify OAuth Status row displays full multi-line text without overflow
- [ ] Verify Custom Order sort option in Library Albums dropdown
- [ ] Verify reorder modal drag-and-drop and save/reset functionality
- [ ] Verify custom order persists across page reloads
- [ ] Verify filter dropdown works correctly with custom sort
- [ ] Verify switching between custom and standard sorts preserves state
- [ ] Verify right-click on tracks in Stats Tracks tab shows context menu (Play, Add to queue, Go to song/artist/album, Copy song link); verify "Copy song link" copies `https://open.spotify.com/track/{id}` web URL
- [ ] Verify three-dot button on tracks in Stats Tracks tab shows the same context menu
- [ ] Verify right-click in Artist Stats modal does NOT crash (no context menu, but no error)
- [ ] Verify Last.fm Global Top Tracks show album art (not letter fallback)
- [ ] ~~Verify "Prefer Spotify Links" toggle in settings~~ (toggle removed — not yet exposed)
- [ ] ~~Verify clicking Last.fm track links inside the Artist Stats modal navigates to Spotify (when toggle is on)~~ (toggle removed — deferred)
- [ ] ~~Verify link replacement across main Stats pages (top tracks, artists, charts)~~ (not yet implemented)
- [ ] Verify "Following" button on artist pages is not missized when Artist Stats button is present
- [ ] Verify Artist Stats modal opens without TDZ crash ("Cannot access 'k' before initialization")
- [ ] Verify switching between Custom Order and standard sorts does not crash (both directions)
- [ ] Verify Release Year sort works with local albums included (local albums sort to end)
- [ ] Verify disabling "Show Artist Stats Button" prevents observer/fallback from running on artist pages
- [ ] Verify Last.fm Global Top Tracks collapses to 10 items with "Show all N tracks" toggle
- [ ] Verify Your Top Scrobbled Tracks collapses to 10 items with "Show all N tracks" toggle
- [ ] Verify Artist Stats works correctly with "LastFM Only" enabled (internal GraphQL exempt)
- [ ] Verify Last.fm API responses are cached at the fetch level (navigate away and back — no duplicate requests)
- [ ] Verify GitHub update check does not fire on every tab switch (check sessionStorage for cache entry)
- [ ] Verify Custom Order albums renders in pages of 200 with a "Load More" card for large libraries
- [ ] Verify Custom Order page resets when switching sort options or typing in search
- [ ] Verify update check does not crash when GitHub API returns releases with null names
- [ ] Verify drag-and-drop reorder places items at the correct position when dragging downward
- [ ] Verify keyboard arrow reorder (ArrowUp/ArrowDown) still works correctly in reorder modal
- [ ] Verify no grey header overlay appears when scrolling in Library or Stats pages
- [ ] Verify playlist folder cards show green gradient folder icon instead of grey
- [ ] Verify sidebar folder icons show green gradient when no custom image is set
- [ ] Verify playlists display actual cover artwork (collages) without needing to scroll the left sidebar first
- [ ] Verify page header controls align to the right when the header wraps to two lines
- [ ] Verify multiple folder cards don't produce duplicate SVG gradient IDs in the DOM
- [ ] Verify Playlists tab does NOT flicker when playlist images load (cards show initials, then fade in artwork)
- [ ] Verify toggling "Show Artist Stats Button" OFF while on an artist page immediately removes the injected button
- [ ] Verify toggling "Show Artist Stats Button" ON while on an artist page immediately inserts the button
- [ ] Verify adjusting "Button Position" slider while on an artist page moves the button live
- [ ] Verify Artist Stats button and track artwork images use lazy loading (no eager preload)

## Known limitations

- None at this time.

## Future work

The following features are planned but not yet implemented (see `docs/superpowers/plans/` for details):

- **Convert Artist Stats modal to page** (`plan-G-modal-to-page.md`) — Move the Artist Stats popup from `PopupModal.display()` to a proper Stats app route (`/stats/artist/:id`). This unblocks full context menu support, router context, and back/forward navigation in the Artist Stats view.
- **Enhanced custom context menu** (`plan-H-enhanced-context-menu.md`) — Expand the custom `Menu`/`MenuItem` context menu with additional items (Play Next, Save to/Remove from Liked Songs, Go to song radio, Copy Spotify URI). Blocked on Plan G for Artist Stats context menus.
- **Listeners by city** (`add listeners by city to Artists Stats m.md`) — Add a "Listeners by City" section to the Artist Stats view showing geographic listener data.
- **Context menus across all tabs** (`Add context menu to all tabs of both the.md`) — Add right-click context menus to all tabs in both the Stats and Library apps, not just the Stats Tracks tab.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
