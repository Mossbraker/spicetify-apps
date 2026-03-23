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
- Throttled playlist scanning (5 concurrent, 200 max) with progress indicator and auto-load setting
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
- **Clickable Spotify top tracks**: Each track row navigates to the Spotify track page on click (modal closes automatically)
- **Linked Last.fm tracks**: Last.fm Global Top Tracks rows are `<a>` elements linking to Last.fm track pages in a new tab
- **"Your Top Scrobbled Tracks" section**: New shelf (requires Last.fm API key + username) showing per-track user scrobble counts, fetched via `track.getInfo?username=X` and sorted by plays
- **Settings reorganisation**: Last.fm Integration at top, OAuth section consolidated (Status before Disconnect, Use Direct Fetch folded in), Diagnostics at bottom

### Library: Custom Album Sorting (#76)
- Adds "Custom Order" sort option to the Albums page with drag-and-drop reorder modal
- Persists order in localStorage via `CustomOrderStore` (EventTarget pattern matching CollectionsWrapper)
- Dual-query strategy: `useInfiniteQuery` for standard sorts, `useQuery` for custom sort
- Reconciliation with short-circuit guard to prevent infinite loops
- Full filter integration (All/Albums/Local Albums works correctly with custom sort)
- Reorder button hidden during loading and when text filter is active

### Library: Item counts (#135)
- Adds togglable item count display to all Library pages (Albums, Artists, Playlists, Collections, Shows)
- Gated behind "Show Item Count" setting (enabled by default)

### Library: Artist → Album drill-down (#202)
- When enabled, clicking an artist shows their saved albums from your library instead of navigating to the Spotify artist page
- Gated behind "Artist → Albums View" setting (disabled by default)
- Includes keyboard accessibility (Enter/Space to activate, focus-visible styles)

### Library: Release Year sort (#76)
- Adds "Release Year" sort option to the Albums page (relies on API sort order)

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
- **TrackRow**: Changes ContextMenu `menu` prop from a JSX element instance (`<MenuWrapper />`) to a function reference via `useMemo`, avoiding the crash path where ContextMenu tries to render a `forwardRef` wrapper as a React child
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

🤖 Generated with [Claude Code](https://claude.com/claude-code)
