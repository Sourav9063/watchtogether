# IndexedDB Offline Download Implementation Guide

## Purpose

This document specifies how to add an **in-app offline music library** for
`/music` using IndexedDB and make it reopenable without internet through PWA
app-shell caching.

Current implementation downloads a real device file through:

```text
POST /api/music/download
```

That flow saves `Song-Artist.filetype` through browser download behavior. Page
cannot subsequently enumerate or replay files in user's Downloads folder.

IndexedDB download is different:

- App stores audio bytes in browser-managed storage.
- App lists downloaded tracks under `Downloads`.
- App can play stored audio offline without resolving new YouTube URL.
- App can remove stored bytes and metadata.

IndexedDB stores media, but it does not make website itself load offline. Full
offline support requires:

| Layer | Purpose |
| --- | --- |
| IndexedDB | Store downloaded audio, metadata, lyrics, and optional artwork |
| Service worker cache | Serve `/music` HTML/app shell, JS, CSS, fonts, and icons offline |
| Web app manifest | Provide installable standalone launch entry for `/music` |

Direct device-file download and IndexedDB offline save may coexist as separate
actions:

| Action | Purpose |
| --- | --- |
| `Save Offline` | Store audio inside app with IndexedDB for in-app replay |
| `Download File` | Save named media file in device/browser Downloads location |

Do not claim IndexedDB content is a normal device music file. It is
origin-scoped browser data and can be removed by user clearing site storage.

## Existing Music Architecture

Relevant current files:

```text
src/app/api/music/download/route.js       # controlled media download stream
src/app/api/music/resolve/route.js        # temporary playback source URL
src/components/music/MusicApp.js          # Downloads view and actions
src/components/music/MusicPlayerProvider.js
src/lib/music/library-client.js           # likes/history/albums/playlists + file download
src/lib/music/youtube-extractor.server.js
src/lib/music/lrc.js
src/lib/music/lyrics.server.js
```

Existing design constraints remain:

- Deezer supplies normalized metadata/artwork.
- YouTube resolution runs server-side only.
- LRCLIB supplies synchronized lyrics.
- One `HTMLAudioElement` in `MusicPlayerProvider` owns active playback.
- Server-only keys/resolution implementation never enter browser bundle.
- PWA/service-worker support is not present yet and must be added for offline
  reopening after user closes page.

## Target Behavior

### Save Offline

1. User invokes `Save Offline` for track.
2. Client marks track as downloading.
3. Client POSTs normalized metadata to restricted audio download endpoint.
4. Server resolves source and streams media bytes.
5. Client receives `Blob`.
6. Client optionally fetches lyrics and artwork.
7. Client stores normalized track metadata, audio blob, lyrics, and optional
   artwork in IndexedDB within one consistent operation.
8. Downloads view updates immediately.
9. Notification confirms `Saved for offline playback`.

### Offline Playback

1. Any track selection enters `MusicPlayerProvider.playTrack()`.
2. Provider checks IndexedDB audio store using `track.id`.
3. When blob exists, provider creates `URL.createObjectURL(blob)`.
4. Shared audio element uses object URL as source without `/api/music/resolve`.
5. Provider reads stored lyrics first; network lyrics request is unnecessary
   when local lyrics exist.
6. On track switch or player close, provider revokes object URL.

### Offline Reopen

1. User opens `/music` online after PWA feature is deployed.
2. Service worker caches music app shell and required local/static assets.
3. User saves at least one track into IndexedDB.
4. User closes tab or installed app.
5. User disables network and opens `/music` or installed app again.
6. Service worker serves cached app shell.
7. Downloads view hydrates tracks from IndexedDB.
8. User plays saved track without Deezer, YouTube, or LRCLIB request.

If service worker never cached app shell, IndexedDB audio can play only while
page is already loaded; it cannot by itself make closed website reopen offline.

### Remove Offline

1. User selects `Delete Download` from downloaded track or player action.
2. App deletes track metadata, audio, lyrics, and artwork for ID.
3. Downloads view removes row.
4. If currently playing from object URL, current audio may continue until
   stopped; future playback no longer uses stored blob.

## Important Product Choice

IndexedDB storage and device file download solve different needs. Recommended
UI:

```text
Save Offline        # IndexedDB, available in app Downloads view
Download File       # browser/device file, unavailable for automatic in-app replay
```

For smallest UI, product may replace current `Download to Device` with
`Save Offline` and expose device export later. Do not label an IndexedDB save
as `Download File`.

## Browser Storage Model

### Database

```text
Database name: playtorrio-music-offline-v1
Database version: 1
```

### Object Stores

| Store | Key | Value | Required |
| --- | --- | --- | --- |
| `tracks` | `track.id` | normalized metadata plus saved fields | yes |
| `audio` | `track.id` | playable `Blob` | yes |
| `lyrics` | `track.id` | `LyricLine[]` | optional |
| `artwork` | `track.id` | cover `Blob` | optional |

### Track Record

```js
{
  id: "3135556",
  title: "Yellow",
  artist: "Coldplay",
  album: "Parachutes",
  cover: "https://cdn-images.dzcdn.net/...",
  duration: 266,
  localBlobId: "3135556",
  mimeType: "audio/mp4",
  byteLength: 5238124,
  downloadedAt: 1770000000000
}
```

`localBlobId` signals local availability in UI but is not filesystem path.

### Lyrics Record

```js
[
  {
    startTimeMs: 12400,
    text: "Look at the stars"
  }
]
```

### Artwork Record

Artwork blob is optional. Keeping original Deezer URL in metadata is enough
when online. Storing artwork gives full visual fidelity while offline.

## Storage Utility Module

Add:

```text
src/lib/music/offline-client.js
```

This is client-only because IndexedDB exists in browser:

```js
"use client";
```

Avoid putting IndexedDB calls inside server routes or server components.

### API Contract

Export functions similar to:

```js
getDownloadedTracks(): Promise<MusicTrack[]>
getOfflineTrack(trackId): Promise<MusicTrack | undefined>
getOfflineAudio(trackId): Promise<Blob | undefined>
getOfflineLyrics(trackId): Promise<LyricLine[] | undefined>
getOfflineArtwork(trackId): Promise<Blob | undefined>

saveOfflineTrack({
  track,
  audioBlob,
  lyrics?,
  artworkBlob?
}): Promise<MusicTrack>

removeOfflineTrack(trackId): Promise<void>
hasOfflineAudio(trackId): Promise<boolean>
getOfflineStorageUsage(): Promise<{ usage?: number, quota?: number }>
```

### Native IndexedDB Skeleton

No extra dependency is required. Native wrapper shape:

```js
const DB_NAME = "playtorrio-music-offline-v1";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("tracks")) {
        db.createObjectStore("tracks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio");
      }
      if (!db.objectStoreNames.contains("lyrics")) {
        db.createObjectStore("lyrics");
      }
      if (!db.objectStoreNames.contains("artwork")) {
        db.createObjectStore("artwork");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

`idb` package can reduce ceremony if adding dependency is accepted, but native
IndexedDB matches current repository preference for minimal dependency churn.

### Atomic Save

Audio metadata and blob must not diverge. Save required fields in same
read/write transaction:

```js
const transaction = db.transaction(["tracks", "audio"], "readwrite");
transaction.objectStore("tracks").put(record);
transaction.objectStore("audio").put(audioBlob, track.id);
```

Lyrics/artwork can either:

- Join same transaction when already fetched, or
- Save in later optional transactions after audio save succeeds.

Downloads view should only list entries that have corresponding non-empty
audio blob. If a crash creates orphan metadata, remove invalid record during
library hydration.

### Atomic Delete

Delete all stores in one transaction:

```js
const transaction = db.transaction(
  ["tracks", "audio", "lyrics", "artwork"],
  "readwrite",
);
transaction.objectStore("tracks").delete(trackId);
transaction.objectStore("audio").delete(trackId);
transaction.objectStore("lyrics").delete(trackId);
transaction.objectStore("artwork").delete(trackId);
```

## Audio Retrieval Endpoint

Current `POST /api/music/download` already satisfies controlled binary fetch:

```json
{
  "id": "<track-id>",
  "title": "<title>",
  "artist": "<artist>"
}
```

Route behavior:

1. Validate track metadata.
2. Rate-limit request by source IP.
3. Call server-only `resolveAudioTrack()`.
4. Fetch resolved temporary media URL on server.
5. Stream response with audio MIME type.

For IndexedDB save, client does not need `Content-Disposition`; it reads:

```js
const audioBlob = await response.blob();
```

Keep current attachment headers for device-file download compatibility, or
create explicit alias:

```text
POST /api/music/offline
```

Alias is useful only when behavior/rate limits diverge. Do not create arbitrary
URL proxy accepting media destination URL from browser.

## PWA And Full Offline Application Support

### Requirement

IndexedDB implementation must include PWA/service worker support. Completion
condition:

```text
After one online visit and Save Offline action, user can close /music, disable
internet, reopen /music or installed app, view Downloads, and play saved track.
```

Without cached application shell, only already-open page can play IndexedDB
audio offline. That is partial offline playback, not full offline support.

### Recommended Files

Use existing Next.js App Router JavaScript structure:

```text
public/
  manifest.webmanifest
  icons/music-192.png
  icons/music-512.png
  icons/music-maskable-512.png       # optional
  sw.js                              # generated or maintained worker

src/components/music/
  MusicServiceWorkerRegistration.js  # registration/readiness/update UI

src/app/
  layout.js or music/layout.js        # manifest and theme-color metadata
```

Two implementation choices:

| Choice | Benefit | Cost |
| --- | --- | --- |
| Workbox/Next-compatible PWA plugin | Reliable precache manifest for hashed Next assets | Adds dependency and config |
| Narrow custom `public/sw.js` | Minimal dependency surface | Must carefully version assets and updates |

Workbox-style generated asset manifest is preferable for production because
Next build chunk filenames are hashed and change between releases.

### Manifest

Manifest should launch music UI standalone:

```json
{
  "name": "Sync Play Music",
  "short_name": "Music",
  "start_url": "/music",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0b0b12",
  "theme_color": "#0b0b12",
  "icons": [
    {
      "src": "/icons/music-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/music-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Expose manifest and theme color through Next metadata or corresponding document
links.

### Service Worker Registration

Register worker from a client component in music boundary:

```js
useEffect(() => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
    // Surface offline setup failure when Save Offline UX depends on it.
  });
}, []);
```

Do not report full offline readiness until worker controls page and one or
more offline track blobs have been saved.

### Cache Policy

Cache app code, not temporary streaming media:

| Request | Policy |
| --- | --- |
| `/music` navigation shell | Network-first with cached fallback, or app-shell fallback |
| `/_next/static/**` JS/CSS/font chunks | Precache/cache-first by build version |
| Manifest and local install icons | Cache-first |
| Saved-track artwork | Store blob in IndexedDB for reliable offline rendering |
| Deezer artwork not downloaded | Optional stale-while-revalidate |
| Trending/search/album/related APIs | Network-only; show offline message |
| Resolve/lyrics/download APIs | Network-only |
| Resolved temporary YouTube URLs | Never cache in service worker |
| Offline audio blobs | Keep in IndexedDB; use blob object URLs for playback |

Temporary stream URLs expire and may contain access tokens. Do not put them in
PWA app-shell cache.

### Offline UX

When app shell loads offline:

- Route immediately exposes Downloads view and saved playback.
- Home/search/related displays offline notice rather than repeated network
  retry noise.
- Local library state in `localStorage` still renders.
- Non-downloaded selection reports `This song is not saved offline`.
- Stored artwork and lyrics render if saved in IndexedDB.

`navigator.onLine` may improve messaging but is not authoritative; all
requests and local playback need failure handling.

### Service Worker Updates

New deployment must update app-shell caches without removing offline media:

- Version Cache Storage names by application build.
- Activate new worker and delete obsolete static caches.
- Do not delete `playtorrio-music-offline-v1` IndexedDB during asset cleanup.
- Expose `Update available` UI or safely reload when new worker is ready.

### Limits

- User must successfully load/cache app while online before offline reopen.
- Browser/site-storage clearing removes both cache and IndexedDB content.
- Browser may evict data under storage pressure, especially without persistent
  storage grant.
- Offline discovery and non-saved playback remain unavailable unless separately
  cached by product design.

## Integrating Library State

`library-client.js` currently persists liked songs, history, albums, and
playlists in localStorage. Do not store audio blobs there.

Add runtime offline state:

```js
const [downloads, setDownloads] = useState([]);
const [downloadingIds, setDownloadingIds] = useState([]);
const [downloadMessage, setDownloadMessage] = useState(null);
```

On hook initialization:

```js
getDownloadedTracks().then(setDownloads);
```

### Save Function

Add:

```js
downloadTrack(track)
```

Suggested flow:

```js
async function downloadTrack(track) {
  markDownloading(track.id);
  try {
    const response = await fetch("/api/music/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: track.id,
        title: track.title,
        artist: track.artist,
      }),
    });

    if (!response.ok) throw new Error("Unable to download audio");

    const audioBlob = await response.blob();
    if (!audioBlob.size) throw new Error("Downloaded audio is empty");

    const lyrics = await fetchLyricsIfAvailable(track);
    const storedTrack = await saveOfflineTrack({ track, audioBlob, lyrics });

    setDownloads((current) => [
      storedTrack,
      ...current.filter((item) => item.id !== storedTrack.id),
    ]);
  } finally {
    clearDownloading(track.id);
  }
}
```

If same track already exists, choose one behavior explicitly:

- Replace existing audio with newly resolved media and move entry to top.
- Show `Already downloaded` and leave existing record untouched.

Replacement is preferable when temporary extraction/player format behavior may
improve over time.

### Remove Function

Add:

```js
deleteDownload(track)
```

After `removeOfflineTrack(track.id)`, remove from `downloads` state and show
confirmation toast.

## Integrating Player

Modify:

```text
src/components/music/MusicPlayerProvider.js
```

### Object URL Ownership

Provider owns active local object URL:

```js
const objectUrlRef = useRef(null);

function revokeObjectUrl() {
  if (objectUrlRef.current) {
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }
}
```

Call before switching tracks, when closing player, and during unmount cleanup.

### Offline-First `playTrack`

Before calling `/api/music/resolve`:

```js
const offlineAudio = await getOfflineAudio(track.id);
if (generation !== generationRef.current) return;

if (offlineAudio instanceof Blob && offlineAudio.size > 0) {
  const objectUrl = URL.createObjectURL(offlineAudio);
  objectUrlRef.current = objectUrl;
  audio.src = objectUrl;
  audio.load();
  updateState({ sourceUrl: `offline:${track.id}` });
  await audio.play();
  return;
}
```

Important:

- Keep generation cancellation check after IndexedDB read.
- Do not store object URLs in persistent state.
- If local blob is corrupt/unplayable, display offline playback error and
  offer delete/re-download; avoid silently deleting user content.

### Offline Lyrics

When selected track begins:

```js
const savedLyrics = await getOfflineLyrics(track.id);
if (savedLyrics?.length) {
  updateState({ lyrics: savedLyrics, lyricsLoading: false });
  return;
}
```

When online lyrics load for a downloaded track, save them into `lyrics` store
for future offline playback.

### Offline Artwork

Optional enhancement:

- Create artwork object URL for stored cover blob.
- Revoke it when track changes.
- Pass it to mini/full player `<img>` rather than `next/image`, because blob
  URLs are not ordinary remote optimized image inputs.

This is optional; offline playback does not depend on artwork.

## UI Changes

Modify:

```text
src/components/music/MusicApp.js
src/components/music/MusicApp.module.css
```

### Downloads View

Replace informational-only Downloads view with actual `TrackList`:

```text
Downloads
<count> songs offline

[downloaded track rows...]
```

Empty state:

```text
No downloads yet
Songs saved offline will appear here.
```

Display storage notice:

```text
Offline songs are saved in browser storage on this device and may be cleared
when site data is removed.
```

### Track Actions

For ordinary track:

```text
Like Song / Remove from Liked
Add to Playlist
Save Offline
Download File            # optional existing device-file action
```

For downloaded track:

```text
Delete Download
Download File            # optional export
```

### Full Player Action

Download button should show state:

| State | Icon/action |
| --- | --- |
| Not stored | download icon, `Save Offline` |
| Downloading | spinner, disabled |
| Stored | cyan download/check or delete affordance |

When two download modes exist, use menu for both actions rather than
overloading one icon ambiguously.

### Loading And Errors

Show status toast for:

- `Saving "<title>" for offline playback...`
- `"<title>" saved offline.`
- `Unable to save offline audio.`
- `Offline storage quota exceeded.`
- `"<title>" removed from downloads.`

## Quota And Persistence

IndexedDB capacity is browser-controlled. Large audio files can exhaust
storage. Before save, optionally query:

```js
const estimate = await navigator.storage?.estimate?.();
```

When available:

```js
{
  usage: estimate.usage,
  quota: estimate.quota
}
```

Recommended behavior:

- Store `byteLength` in track record.
- Display approximate total stored size in Downloads view.
- Catch quota errors (`QuotaExceededError`) and present clear message.
- Do not automatically remove older downloads without user confirmation.

Optional persistence request:

```js
await navigator.storage?.persist?.();
```

Browser may reject request. Feature must continue working without persistence
guarantee and UI must not claim permanent storage.

## Online/Offline Behavior

`navigator.onLine` is advisory only. Do not use it as sole availability test.

Expected behavior:

| Situation | Result |
| --- | --- |
| Page remains open, downloaded song, no network | Plays stored blob |
| PWA shell cached, page reopened offline, downloaded song | `/music` opens and plays stored blob |
| PWA shell not cached, page reopened offline | Site cannot reliably open even if audio blob exists |
| Non-downloaded song, no network | Shows audio resolution failure |
| Downloaded song with stored lyrics | Lyrics render offline |
| Downloaded song without stored lyrics, no network | Plays audio and shows no lyrics/unavailable state |
| Deleted download, network available | Falls back to server resolution |

## Migration From Current Device Downloads

Current app does not store browser-downloaded file handles or IndexedDB
metadata. Existing downloaded device files cannot be automatically imported.

Possible future import:

1. User selects local audio file via `<input type="file">` or File System
   Access API.
2. User matches/imports metadata.
3. App stores selected file blob in IndexedDB.

Do not scan Downloads directory automatically; browsers do not allow it
without explicit user permission.

## Security And Legal Constraints

- Audio resolution remains server-only.
- Offline endpoint must accept normalized track identity, not arbitrary URL.
- Apply rate limiting to offline binary endpoint.
- Do not log resolved stream URLs.
- Stored IndexedDB media is accessible only to this site origin, not protected
  DRM storage.
- Confirm provider terms, copyright/licensing, and user download rights before
  deploying feature publicly.
- Serverless media proxying carries bandwidth and request-duration cost.
- Service worker must never cache resolved temporary media URLs or server-only
  configuration.
- PWA app-shell cache contains public application/static assets only.

## Implementation Steps

### Phase 1: Storage Utility

1. Add `src/lib/music/offline-client.js`.
2. Create four IndexedDB stores.
3. Implement read/save/delete/has methods.
4. Add orphan cleanup validation for records without audio blobs.

### Phase 2: PWA App Shell

1. Add manifest, install icons, theme-color metadata, and standalone `/music`
   launch target.
2. Add Workbox-generated or carefully versioned service worker.
3. Cache `/music` navigation shell and required hashed local/static assets.
4. Register worker in music client boundary and expose readiness/update state.
5. Keep music APIs and temporary media URLs network-only.
6. Verify worker updates clean static caches without clearing IndexedDB tracks.

### Phase 3: Download State And UI

1. Hydrate `downloads` list in `library-client.js`.
2. Add `downloadTrack()` and `deleteDownload()`.
3. Replace Downloads informational view with actual track rows.
4. Add action menu and full-player offline save/delete state.
5. Keep or rename direct device file download explicitly.

### Phase 4: Playback

1. Check local audio before online resolve in provider.
2. Manage local object URL lifecycle.
3. Load local lyrics before LRCLIB call.
4. Verify queue/loop/shuffle continue with local and online tracks mixed.

### Phase 5: Hardening

1. Add quota messaging and optional size display.
2. Validate delete while currently playing.
3. Test refresh/reload persistence.
4. Test close-and-reopen flow with network disabled.
5. Test PWA worker update without loss of saved tracks.

## Test Checklist

### Storage Unit Tests

- Database upgrade creates expected stores.
- `saveOfflineTrack()` writes metadata and audio blob.
- `getDownloadedTracks()` returns normalized records sorted newest first.
- `removeOfflineTrack()` clears all stores for ID.
- Empty/missing blob metadata is excluded or repaired.
- Quota failure becomes user-readable error.

### Player Tests

- Downloaded track is played from blob URL without `/api/music/resolve`.
- Object URL is revoked when selecting another track.
- Object URL is revoked on provider cleanup.
- Online track still resolves normally.
- Stored lyrics load before network call.

### UI Tests

- Save Offline progress state disables duplicate click.
- Saved song appears in Downloads view.
- Delete Download removes row.
- Download File retains device-file naming behavior if both actions exist.
- Status toast reports success/error.
- Offline screen sends user to Downloads without retrying unavailable catalog.

### PWA Tests

- Manifest launches `/music` with install icons and cinematic theme color.
- Service worker registers and controls `/music` after online setup.
- `/music` and required static assets render from cache with network disabled.
- Resolve/download/lyrics URLs and temporary media URLs are not placed into
  app-shell cache.
- Service worker version upgrade keeps IndexedDB audio/metadata intact.

### Manual Browser Test

1. Open `/music` online.
2. Wait for offline-shell readiness or install PWA.
3. Choose song and `Save Offline`.
4. Confirm song appears in Downloads.
5. Close music tab or installed app.
6. Disable network.
7. Reopen `/music` or installed app.
8. Confirm music shell loads and Downloads view is available.
9. Play saved song without network.
10. Remove saved song and verify offline playback is no longer available.
11. Clear site storage and confirm app communicates empty Downloads state.

## Recommended Final UX

Expose both choices only when product needs both:

```text
Save Offline       Stored inside app for offline replay
Download File      Saved to device Downloads folder
```

IndexedDB-based save is correct implementation for reliable in-app offline
playback. Browser file download is correct implementation for obtaining
visible device file. PWA service worker caching is required in addition to
IndexedDB for user to close and reopen music app while offline. These features
should remain separately named and separately explained.
