# `/music` Page System Guide

## Purpose

`/music` is Sync Play's PlayTorrio-style music experience. It provides:

- Trending-track browsing and pagination.
- Track and album search.
- Album track pages and related-track discovery.
- YouTube-resolved full-track audio playback.
- LRCLIB synchronized lyrics.
- Liked songs, listening history, saved albums, and user playlists.
- Browser/device file downloads named from track metadata.
- Responsive cinematic UI with mini player and full player overlay.

Catalog metadata and artwork come from Deezer. Audio comes from a YouTube match
resolved on server. Lyrics come from LRCLIB. This is not official integration
with any provider; terms, rights, and production traffic risk must be reviewed
before public use.

## Repository Implementation

Project is existing Next.js 15 App Router JavaScript application. Music feature
follows repository conventions: JavaScript files and CSS Modules, not separate
TypeScript/Tailwind/Zustand stack.

```text
src/app/music/
  layout.js                         # Poppins font boundary
  loading.js                        # page loading background
  page.js                           # server page shell and metadata

src/app/api/music/
  trending/route.js                 # normalized trending tracks
  search/route.js                   # normalized tracks and albums
  album/[albumId]/route.js          # album plus normalized tracks
  related/[trackId]/route.js        # related normalized tracks
  lyrics/route.js                   # parsed synchronized lyrics
  resolve/route.js                  # temporary playback source resolution
  download/route.js                 # restricted audio download stream

src/components/music/
  MusicApp.js                       # feature views and interactive UI
  MusicApp.module.css               # cinematic responsive design
  MusicPlayerProvider.js            # one browser Audio owner and playback state

src/lib/music/
  catalog.server.js                 # Deezer proxy fetch, cache, normalization
  youtube-extractor.server.js       # YouTube search and InnerTube resolution
  lyrics.server.js                  # LRCLIB fetch
  lrc.js                            # synced lyric parser
  library-client.js                 # persisted user library and device download
  validation.js                     # route input validation helpers
```

`next.config.js` allows Deezer artwork from `cdn-images.dzcdn.net`.

## Page Composition

`src/app/music/page.js` renders `<MusicApp />`. `MusicApp` wraps all music UI
inside `MusicPlayerProvider`, so browsing between internal music views does
not tear down playback.

### Desktop

At widths above `900px`, page uses:

- `260px` left sidebar.
- Search bar and active content pane on right.
- Bottom-centered mini player after track selection.

Sidebar links are:

1. Home
2. Liked Songs
3. History
4. Downloads
5. Playlists
6. Albums

Sidebar bottom shows current track when playback item exists.

### Mobile

At widths up to `900px`, sidebar disappears. Page renders:

- Greeting header with music logo.
- Full-width search bar.
- Home chips: Liked, History, Downloads, Playlists, Albums.
- Floating mini player and trending pagination at bottom.

### Internal Views

`MusicExperience` keeps view selection as client state:

| View | Contents |
| --- | --- |
| `home` | Trending grid and page navigation |
| `search` | Tracks list or albums grid tab |
| `liked` | Locally persisted liked-song rows |
| `history` | Locally persisted recently played unique-song rows |
| `downloads` | Device download explanation and download behavior |
| `playlists` | Locally persisted playlist list and creation |
| `playlist` | Playlist hero and track rows |
| `albums` | Saved album cards |
| `album` | Album hero and fetched album tracks |

## Normalized Data

Browser UI works with normalized objects rather than raw Deezer responses.

```js
MusicTrack = {
  id: String,
  title: String,
  artist: String,
  album: String,
  cover: String,
  duration: Number
}

MusicAlbum = {
  id: String,
  title: String,
  artist: String,
  cover: String,
  nbTracks: Number
}

MusicPlaylist = {
  id: String,
  name: String,
  tracks: MusicTrack[]
}

LyricLine = {
  startTimeMs: Number,
  text: String
}
```

`catalog.server.js` applies these mapping rules:

- IDs become strings.
- Missing artist becomes `Unknown Artist`.
- Missing track title becomes `Unknown Title`.
- Missing album title becomes empty string.
- Artwork preference is `cover_xl`, `cover_big`, `cover_medium`,
  `cover_small`.
- Duration becomes non-negative integer seconds.

## Catalog Flow

Client never calls Deezer or configured proxy directly.

`catalog.server.js` calls:

```text
DEEZER_PROXY_BASE_URL
  required: server-only proxy base URL accepting encoded Deezer destination
```

Each Deezer destination URL is encoded into proxy query. Server helper uses
request timeout, up to five attempts with incremental delay, and short memory
cache for trending/album responses.

### Routes

| Client request | Upstream purpose | Response |
| --- | --- | --- |
| `GET /api/music/trending?index=0&limit=20` | chart tracks | `{ tracks, index, limit }` |
| `GET /api/music/search?q=yellow` | track search plus album search | `{ tracks, albums }` |
| `GET /api/music/album/123` | album detail | `{ album, tracks }` |
| `GET /api/music/related/123` | related tracks | `{ tracks }` |

Validation rejects:

- Empty or overlong search strings.
- Non-numeric album and track IDs.
- Negative/invalid pagination.
- Trending limits above `20`.

## Playback Flow

### Single Audio Owner

`MusicPlayerProvider.js` owns one `HTMLAudioElement`, created once on mount:

```js
const audio = new Audio();
audio.preload = "metadata";
```

Cards, rows, mini player, and full player send commands to provider. They do
not construct their own audio elements.

### Selecting Track

Calling `playTrack(track, queue)` performs this sequence:

1. Increment generation counter, cancelling older asynchronous track request.
2. Pause/reset existing audio.
3. Store supplied queue and locate selected index.
4. Immediately expose selected metadata to mini/full player.
5. Set `playSequence`; history observer stores selected track.
6. Fetch lyrics in parallel.
7. POST metadata to `/api/music/resolve`.
8. Ignore result when newer selection changed generation counter.
9. Assign temporary audio URL to shared `Audio` and attempt playback.
10. Show source/autoplay errors in player when playback cannot start.

Stream source URLs are cached only in provider memory and server extractor
memory; they are not persisted in `localStorage`.

### Server Audio Resolution

`youtube-extractor.server.js` runs only on server:

1. Search YouTube HTML for `"<title> <artist> lyrics"`.
2. Read first usable eleven-character video ID.
3. Fetch InnerTube configuration/visitor data from watch page.
4. Query ordered InnerTube clients: Android VR, Android, iOS.
5. Prefer highest-bitrate direct `audio/*` format URL.
6. Fall back to direct progressive format only when audio-only format absent.
7. Parse `expire` timestamp for source expiration.

Caches:

| Item | Lifetime |
| --- | --- |
| InnerTube config | 3 hours |
| Search query to video ID | 12 hours |
| Video ID to stream URL | URL expiration minus 60 seconds, or temporary fallback |

`POST /api/music/resolve` rate-limits requests by client IP and returns:

```json
{
  "trackId": "123",
  "videoId": "abcdefghijk",
  "audioUrl": "https://temporary-media-url",
  "expiresAt": 1770000000000
}
```

When active source fails once, provider requests fresh resolution before
displaying playback failure.

### Controls

Provider implements:

- Play/pause and seek.
- Previous track wrapping to queue end.
- Next track; end stops unless loop-all enabled.
- Shuffle without repeats in current cycle.
- Loop modes: `none`, `all`, `one`.
- Media Session metadata and operating-system media controls when supported.

Audio browser events keep UI state current: buffering, playing, pause,
position, duration, ended, and errors.

## Lyrics Flow

For selected track, provider fetches:

```text
GET /api/music/lyrics
  ?trackName=<title>
  &artistName=<artist>
  &albumName=<album>
  &duration=<seconds>
```

Server calls LRCLIB and parses synchronized lines from:

```text
[mm:ss.xx] lyric text
```

Full-player Lyrics tab:

- Shows loading while request runs.
- Shows explicit empty state when no synchronized lyrics exist.
- Highlights most recent line at or before current audio position.
- Smoothly scrolls active lyric toward center.
- Seeks playback when lyric line is clicked.

## User Library

`library-client.js` persists serializable library state in:

```text
localStorage key: playtorrio-music-library-v1
```

Stored values:

```js
{
  liked: MusicTrack[],
  history: MusicTrack[],
  albums: MusicAlbum[],
  playlists: MusicPlaylist[]
}
```

### Likes

Like action toggles track by `id`. Liked view uses row list and supports
play/shuffle.

### History

Every `playTrack()` selection writes track to history, even when same current
song is selected again. Algorithm is:

```js
history = [playedTrack, ...history.filter((track) => track.id !== playedTrack.id)]
  .slice(0, 100);
```

Result:

- History contains unique track IDs.
- Most recently selected song is first.
- Replaying old song removes old position and moves it to top.
- At most 100 tracks are retained.

### Albums

Album save action toggles normalized album in local library. Opening saved or
search-result album requests current track metadata from `/api/music/album/:id`.

### Playlists

User can create named playlists, add tracks through action dialog, remove
tracks from playlist details, and delete playlist. Playlist content persists
in same local storage record.

## Device Downloads

Downloads intentionally do not use IndexedDB. User requested real device files.

### User Flow

1. User chooses `Download to Device` in track action dialog or full player.
2. Browser POSTs normalized track metadata to `/api/music/download`.
3. Route resolves known track audio server-side through same YouTube resolver.
4. Route fetches resolved audio and streams it as an attachment response.
5. Client creates temporary object URL and triggers browser download.
6. Browser saves file to configured download location or prompts user.

### Filename

Route sanitizes title and artist and generates:

```text
Song-Artist.filetype
```

Extension maps from media response MIME type:

| MIME type contains | Extension |
| --- | --- |
| `webm` | `.webm` |
| `mpeg` or `mp3` | `.mp3` |
| `ogg` | `.ogg` |
| `wav` | `.wav` |
| other audio media | `.m4a` |

### Browser Limit

Application cannot enumerate, delete, or automatically replay arbitrary files
from device Downloads folder. That requires user-selected File System Access
permissions or separate in-app storage. Downloads view therefore explains file
location rather than claiming in-app offline library.

`/api/music/download` is restricted: it accepts track metadata, performs its
own resolution, rate-limits requests, and does not act as arbitrary URL proxy.

## Full Player And Modal Behavior

Selecting mini player opens full-player overlay.

Tabs:

| Tab | Function |
| --- | --- |
| Art | cover, title, artist, album |
| Lyrics | synchronized lyric scrolling and seek |
| Related | fetch related Deezer tracks and replace playback queue on selection |

Overlay controls include like, device download, seek, shuffle, previous,
play/pause, next, and loop.

Clicking or touching outside modal closes overlay only. Backdrop closes on
completed click, not initial pointer-down, so underlying track card is not
triggered as overlay disappears. Collapse control uses SVG icon.

## Styling

Music UI uses Poppins from `src/app/music/layout.js` and CSS Module tokens:

```css
--music-bg: #0b0b12;
--music-card: #15151e;
--music-tint: #1f1f2e;
--music-primary: #7c4dff;
--music-primary-light: #9c6fff;
--music-accent: #00e5ff;
--music-pink: #ff4081;
--music-amber: #ffc107;
--music-text: #ffffff;
--music-muted: rgba(255, 255, 255, 0.42);
```

Artwork components use `next/image`; failed art displays music-note fallback.
Music component styles override global generic `button` rules where necessary
to retain left-aligned track rows and cards.

## Configuration

Server environment variables:

```bash
DEEZER_PROXY_BASE_URL=<server-only-deezer-proxy-base-url>
YOUTUBE_INNERTUBE_FALLBACK_KEY=<server-only-optional-key>
```

`DEEZER_PROXY_BASE_URL` is required for catalog requests.
`YOUTUBE_INNERTUBE_FALLBACK_KEY` is used when a YouTube watch-page response
does not yield an InnerTube API key. Do not prefix either with `NEXT_PUBLIC_`.
Browser bundle must not receive InnerTube extraction configuration or server
proxy settings.

## Security And Operations

- All provider calls originate in server route handlers.
- Catalog, lyrics, resolve, and download routes validate supplied input.
- Music resolve and download endpoints have in-memory IP rate limiting.
- Server does not log temporary stream URLs.
- Download endpoint is restricted to resolved tracks and not arbitrary media
  destinations.
- In-memory caches are per server process; distributed deployments need
  shared cache/rate-limiter for consistent operation.
- Direct media sourcing and device download require rights/provider-policy
  review before production release.

## Verification

Use repository commands:

```bash
npm run lint
npm run build
npm run dev
```

Manual `/music` checks:

1. Load trending tracks and paginate.
2. Search track and album; open album detail.
3. Select tracks rapidly; newest selected track must remain active.
4. Exercise mini player and full-player controls.
5. Verify Lyrics highlight and click-to-seek where lyrics exist.
6. Open Related tab and play related item.
7. Like song, save album, create playlist, reload page, verify persistence.
8. Play song twice after another song; verify History moves replayed song to
   first row without duplicate.
9. Download song; verify device file uses `Song-Artist.filetype` naming.
10. Open player overlay and click backdrop; verify modal closes without
    selecting track underneath.

Known existing repository condition: `npm run lint` currently reports hook
warnings in non-music files. Music changes should not add new warnings.
