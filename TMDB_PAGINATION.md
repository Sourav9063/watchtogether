# TMDB Pagination And Cache Design

## Goal

`src/components/tmdbBrowse` should avoid calling TMDB directly from browser UI for every pagination click.

Current design uses three layers:

1. Server component data loading for first visible data.
2. Next.js server fetch cache for TMDB responses.
3. Client in-memory cache plus rolling prefetch for near-future pages.

This keeps first render smaller than preloading many pages, while still warming likely next pages before user clicks them.

## Relevant Files

- `src/components/tmdbBrowse/TmdbBrowse.js`
  - Server component wrapper.
  - Creates initial data promise.
  - Wraps client component in `Suspense`.
- `src/components/tmdbBrowse/TmdbBrowseClient.js`
  - Client component.
  - Reads server promise with React `use`.
  - Owns pagination state, card rendering, client-side cache, and rolling prefetch.
- `src/components/tmdbBrowse/tmdbBrowseData.js`
  - Server-only TMDB fetch logic.
  - Reads TMDB API key from config.
  - Uses `fetch(..., { next: { revalidate } })`.
  - Builds initial data payload.
- `src/components/tmdbBrowse/tmdbBrowseConstants.js`
  - Shared constants and pure helpers.
  - Safe for server and client imports.
- `src/app/api/tmdb/browse/route.js`
  - Server route used by client pagination/prefetch.
  - Proxies allowed TMDB browse endpoints through cached server fetch.

## Constants

```js
export const MAX_TMDB_PAGE = 500;
export const PREFETCH_TMDB_PAGE_COUNT = 3;
export const BROWSE_PAGE_PREFETCH_BATCH_SIZE = 3;
export const TMDB_REVALIDATE_SECONDS = 60 * 60 * 24;
```

Meaning:

- `MAX_TMDB_PAGE = 500`
  - TMDB caps many list endpoints at 500 pages.
  - UI clamps total page count to avoid invalid page requests.
- `PREFETCH_TMDB_PAGE_COUNT = 3`
  - Server initial payload includes pages `1,2,3`.
  - Keeps first render reasonable.
- `BROWSE_PAGE_PREFETCH_BATCH_SIZE = 3`
  - Client warms next three pages when user reaches each third page.
  - Page `3` warms `4,5,6`.
  - Page `6` warms `7,8,9`.
  - Page `9` warms `10,11,12`.
- `TMDB_REVALIDATE_SECONDS = 86400`
  - TMDB fetch responses are cached by Next for 1 day.

## Initial Render Flow

`TmdbBrowse.js` is a server component:

```js
export default function TmdbBrowse() {
  const initialDataPromise = getTmdbBrowseInitialData();

  return (
    <Suspense fallback={<TmdbBrowseFallback />}>
      <TmdbBrowseClient initialDataPromise={initialDataPromise} />
    </Suspense>
  );
}
```

Important behavior:

- `getTmdbBrowseInitialData()` starts on server.
- `TmdbBrowseClient` receives the unresolved promise.
- `TmdbBrowseClient` calls `use(initialDataPromise)`.
- While promise is pending, Suspense shows fallback.
- When promise resolves, client receives initial media data and genre lists.

Current initial fetches:

- Movie genre list.
- TV genre list.
- Pages `1,2,3` for each fixed browse section:
  - Popular Movies.
  - Top Rated Movies.
  - Popular TV Shows.
  - Top Rated TV Shows.
- Pages `1,2,3` for default first movie genre.

Total uncached server requests on first cold render:

```txt
2 genre list requests
+ 4 fixed sections * 3 pages
+ 1 default genre section * 3 pages
= 17 TMDB requests
```

Those requests happen in parallel through `Promise.all`.

## Why Not Prefetch 10 Pages Initially

Prefetching pages `1-10` initially would mean:

```txt
2 genre list requests
+ 4 fixed sections * 10 pages
+ 1 default genre section * 10 pages
= 52 TMDB requests
```

Problems:

- Cold first render waits for slowest request.
- RSC payload becomes larger.
- Browser receives many pages user may never view.
- More memory held in client data object.

Current design starts with pages `1,2,3`, then warms more pages only when user pagination indicates intent.

## Cache Key Shape

Cache keys are created with:

```js
createTmdbBrowseKey(endpoint, mediaType, genreId, page)
```

Current key format:

```txt
{endpoint}:{mediaType}:{genreId}:page-{page}
```

Examples:

```txt
/movie/popular:movie::page-1
/movie/popular:movie::page-2
/tv/top_rated:tv::page-1
/discover/movie:movie:28:page-1
```

Why key includes all fields:

- `endpoint` separates `/movie/popular` from `/movie/top_rated`.
- `mediaType` keeps normalized card behavior explicit.
- `genreId` separates discovery pages.
- `page` separates each paginated response.

## Server Fetch Cache

All TMDB fetches go through `fetchTmdbBrowse`:

```js
const response = await fetch(getTmdbUrl(endpoint, params), {
  next: { revalidate: TMDB_REVALIDATE_SECONDS },
});
```

This is Next.js data cache behavior:

- Cache key is based on final request URL and fetch options.
- Same TMDB URL can reuse cached response.
- Cache remains fresh for 1 day.
- After 1 day, Next may revalidate and refresh data.

This reduces TMDB API calls across:

- Server initial renders.
- API route calls.
- Background prefetch calls.
- Multiple users hitting same deployment.

## API Route

Client never calls TMDB directly for browse pagination.

Client calls:

```txt
/api/tmdb/browse?endpoint=/movie/popular&page=3
```

Route:

```js
export const revalidate = 86400;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "";
  const page = Math.min(
    Math.max(Number(searchParams.get("page") || 1), 1),
    MAX_TMDB_PAGE,
  );
  const genreId = searchParams.get("genreId") || "";
  const data = await fetchTmdbBrowse(endpoint, {
    page,
    with_genres: genreId,
  });

  return Response.json(data);
}
```

Important details:

- `revalidate` must be a literal number in route segment config.
- `page` is clamped to `1..MAX_TMDB_PAGE`.
- `endpoint` is allowlisted in `tmdbBrowseData.js`.
- API route delegates TMDB fetch to `fetchTmdbBrowse`, so 1-day cache still applies.

## Endpoint Allowlist

`fetchTmdbBrowse` rejects unknown endpoints:

```js
const allowedEndpoints = new Set([
  ...mediaSections.map((section) => section.endpoint),
  "/genre/movie/list",
  "/genre/tv/list",
  "/discover/movie",
  "/discover/tv",
]);
```

Reason:

- Browser sends `endpoint` query param to local API route.
- Without allowlist, browser could ask server to proxy arbitrary TMDB endpoints.
- Current scope only needs browse sections, genre lists, and discover endpoints.

## Client Initial Data Read

`TmdbBrowseClient` receives server promise:

```js
const { genres, initialMediaByKey } = use(initialDataPromise);
```

This is React 19 `use`.

Behavior:

- If promise is pending, component suspends.
- Suspense boundary from server component shows fallback.
- Once resolved, `genres` and `initialMediaByKey` become available.

## Client Page Resolution

Each `TmdbMediaSection` owns its own page state:

```js
const [page, setPage] = useState(1);
```

For current page, it checks initial server payload:

```js
const initialData =
  initialMediaByKey[
    createTmdbBrowseKey(endpoint, mediaType, genreId, page)
  ];
```

If `initialData` exists:

- No API call.
- Section updates from prefetched payload.
- Pages `1,2,3` load immediately.

If `initialData` does not exist:

- Client calls `/api/tmdb/browse`.
- Response gets stored in client in-memory cache.

## Client In-Memory Cache

Client cache:

```js
const browseMediaCache = new Map();
```

`fetchBrowseMedia` checks cache before network:

```js
const cacheKey = createTmdbBrowseKey(endpoint, "request", genreId, page);
const cachedData = browseMediaCache.get(cacheKey);

if (cachedData) {
  return cachedData;
}
```

After local API response:

```js
browseMediaCache.set(cacheKey, data);
```

Scope:

- Current browser tab only.
- Lost on full page reload.
- Useful for repeated navigation inside same session.
- Separate from Next server cache.

Note:

- Client request cache uses `"request"` as the second key segment.
- Initial payload cache uses actual `mediaType`.
- This is acceptable because they are separate stores:
  - `initialMediaByKey` object from server payload.
  - `browseMediaCache` Map in browser.

## Rolling Prefetch

Rolling prefetch runs in `TmdbMediaSection`:

```js
useEffect(() => {
  if (page % BROWSE_PAGE_PREFETCH_BATCH_SIZE !== 0) {
    return;
  }

  const nextPages = Array.from(
    { length: BROWSE_PAGE_PREFETCH_BATCH_SIZE },
    (_, index) => page + index + 1,
  ).filter((nextPage) => nextPage <= totalPages);

  nextPages.forEach((nextPage) => {
    fetchBrowseMedia(endpoint, nextPage, genreId, controller.signal).catch(...);
  });
}, [endpoint, genreId, page, totalPages]);
```

Current behavior:

- Page `1`: no rolling prefetch.
  - Pages `2,3` already came from initial server payload.
- Page `2`: no rolling prefetch.
- Page `3`: prefetch page `4`, page `5`, and page `6`.
- Page `4`: no rolling prefetch.
  - Page `5` and page `6` should already be warmed if page `3` prefetch completed.
- Page `6`: prefetch page `7`, page `8`, and page `9`.

This matches user intent:

```txt
page 1,2,3 cached initially
when page 3 is called page 4,5,6 called and cached
```

## Cache Layers Summary

Layer 1: Initial server payload

- Contains pages `1,2,3`.
- Available immediately after Suspense resolves.
- Sent to browser with RSC payload.

Layer 2: Next fetch cache

- Created by server fetch to TMDB.
- Shared between server component and API route.
- Cached for 1 day.
- Survives browser reloads.

Layer 3: Client Map cache

- Created by client pagination/prefetch responses.
- Avoids repeated local API calls in same tab.
- Lost on reload.

## Request Examples

Cold first render:

```txt
GET TMDB /genre/movie/list
GET TMDB /genre/tv/list
GET TMDB /movie/popular?page=1
GET TMDB /movie/popular?page=2
GET TMDB /movie/popular?page=3
GET TMDB /movie/top_rated?page=1
GET TMDB /movie/top_rated?page=2
GET TMDB /movie/top_rated?page=3
GET TMDB /tv/popular?page=1
GET TMDB /tv/popular?page=2
GET TMDB /tv/popular?page=3
GET TMDB /tv/top_rated?page=1
GET TMDB /tv/top_rated?page=2
GET TMDB /tv/top_rated?page=3
GET TMDB /discover/movie?page=1&with_genres={firstMovieGenreId}
GET TMDB /discover/movie?page=2&with_genres={firstMovieGenreId}
GET TMDB /discover/movie?page=3&with_genres={firstMovieGenreId}
```

User opens page `3`:

```txt
No request for page 3 if initial payload has it.
Background request /api/tmdb/browse?...page=4
Background request /api/tmdb/browse?...page=5
Background request /api/tmdb/browse?...page=6
```

User opens page `4`:

```txt
Uses client Map if page 3 background prefetch completed.
Falls back to /api/tmdb/browse?...page=4 if prefetch did not complete.
```

User opens page `6`:

```txt
Uses client Map if available.
Background request /api/tmdb/browse?...page=7
Background request /api/tmdb/browse?...page=8
Background request /api/tmdb/browse?...page=9
```

## Suspense Behavior

Suspense only handles initial server promise consumption:

```js
const { genres, initialMediaByKey } = use(initialDataPromise);
```

Suspense fallback does not replace each section during later client pagination fetches.

Later pagination fetches use normal client state:

```js
status = "loading" | "success" | "error"
```

The visible loading text was removed. During a client fetch:

- Buttons can be disabled while `status === "loading"`.
- Existing cards remain until next data arrives or error occurs.

## Error Handling

Server TMDB fetch returns an object instead of throwing:

```js
{
  error: "TMDB request failed: 500",
  results: [],
  total_pages: 1
}
```

Client converts that into section state:

```js
{
  error: Error,
  rawItems: [],
  status: "error",
  totalPages: 1
}
```

Reason:

- One failed TMDB section should not crash whole page.
- UI can show per-section error.
- Suspense boundary stays for data loading, not error display.

## Tradeoffs

Current design favors balanced performance:

- Fast enough first render:
  - 12 cold requests instead of 52.
- Low repeated TMDB calls:
  - Next fetch cache for 1 day.
- Good pagination responsiveness:
  - Next two pages warmed at likely navigation points.

Costs:

- More code than simple `useEffect(fetch)` per section.
- Initial payload includes pages `2,3`, which user may not click.
- Rolling prefetch can issue unused page requests if user stops at page `3`.
- Client cache is memory-only, not persistent.

## If We Need To Tune Prefetch Later

Current values:

```js
export const PREFETCH_TMDB_PAGE_COUNT = 3;
export const BROWSE_PAGE_PREFETCH_BATCH_SIZE = 3;
```

Examples:

- Initial pages `1-3`, then warm next `3`:

```js
export const PREFETCH_TMDB_PAGE_COUNT = 3;
export const BROWSE_PAGE_PREFETCH_BATCH_SIZE = 3;
```

- Initial pages `1,2`, then warm next `4`:

```js
export const PREFETCH_TMDB_PAGE_COUNT = 2;
export const BROWSE_PAGE_PREFETCH_BATCH_SIZE = 4;
```

Be careful:

- Higher initial prefetch slows cold render and increases RSC payload.
- Higher rolling batch increases background traffic.
- TMDB rate limits and deployment cache behavior should be considered before increasing values.

## If We Need Faster Cold Render Later

Reduce server initial payload:

```js
export const PREFETCH_TMDB_PAGE_COUNT = 1;
```

Then page `2` is not in initial payload.

Alternative:

- Keep page `1` in Suspense.
- Trigger page `2` prefetch after mount.
- This minimizes server wait but makes first next click depend on background fetch timing.

## Current Best Mental Model

```txt
Server render:
  Fetch page 1, 2, and 3 for each section.
  Cache TMDB URLs for 1 day.
  Send initial data to client.

Client page 1:
  Uses server payload.

Client page 2:
  Uses server payload.

Client page 3:
  Uses server payload.
  Starts warming page 4, 5, and 6.

Client page 4:
  Uses client cache if warmed.

Client page 6:
  Uses client cache if warmed.
  Starts warming page 7, 8, and 9.

Every local API fetch:
  Hits server route.
  Server route uses same 1-day TMDB fetch cache.
```
