# Live Matches Implementation Guide

This document describes how the app's Live Matches feature works and how to recreate the same behavior in a Next.js 15 website.

Primary source file: `lib/screens/live_matches_screen.dart`

## Feature Overview

Live Matches is a grid-based live sports/events browser. It fetches event catalogs from public JSON endpoints, lets the user filter by provider, time mode, and sport/category, then opens the selected stream in an embedded web player.

The current Flutter screen has three provider paths:

| Provider | Current UI status | Purpose |
| --- | --- | --- |
| Streamed.pk | Active | Live/today/all sports matches with source and stream selection |
| PPV.to | Active | PPV/event streams with direct iframe playback |
| CDN Live | Implemented but not exposed in provider bar | Live channels and sports events from `api.cdn-live.tv` |

Important: CDN Live has working data models, fetchers, cards, and player code, but `_buildProviderBar()` only renders Streamed.pk and PPV.to chips. In a Next.js implementation you can either omit CDN Live or expose it as a third provider tab.

## Data Sources

Use a browser-like user agent for upstream requests:

```ts
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
```

### Streamed.pk

Base URL:

```txt
https://streamed.pk
```

Endpoints:

| Endpoint | Used for |
| --- | --- |
| `GET https://streamed.pk/api/matches/live` | Live matches |
| `GET https://streamed.pk/api/matches/all-today` | Today's matches |
| `GET https://streamed.pk/api/matches/all` | All listed matches |
| `GET https://streamed.pk/api/sports` | Sport/category metadata |
| `GET https://streamed.pk/api/stream/<source>/<id>` | Streams for a selected match source |
| `https://streamed.pk/api/images/poster/<homeBadge>/<awayBadge>.webp` | Match poster when both team badges exist |
| `https://streamed.pk/api/images/proxy/<poster>.webp` | Match poster fallback |
| `https://streamed.pk/api/images/badge/<badge>.webp` | Team badge image |

Flow:

1. Load matches from one of the match endpoints based on view mode.
2. Load sports from `/api/sports` in parallel.
3. Build sport tabs only for sports whose `id` appears in the returned matches' `category` field.
4. Display cards in a responsive grid.
5. On card click, inspect `match.sources`.
6. If there is one source, fetch streams immediately.
7. If there are multiple sources, show a source picker first.
8. Fetch stream list with `/api/stream/<source>/<id>`.
9. Show a stream picker with stream number, language, and HD/SD.
10. Open `stream.embedUrl` inside an iframe/web player.

### PPV.to

Endpoint:

```txt
GET https://old.ppv.to/api/streams
```

The response is a JSON object with a `streams` array. Each item in `streams` is a category containing its own `streams` array. The app flattens all nested streams into one list.

Flow:

1. Fetch `https://old.ppv.to/api/streams`.
2. Read `body.streams`.
3. For each category, read `category.streams`.
4. Convert each nested stream into a PPV event item.
5. Build category tabs from unique `category_name` values.
6. Display PPV cards.
7. If `iframe` is missing, show "Stream not yet available".
8. If `iframe` exists, open it in the embedded player.

PPV time label logic:

```ts
function ppvTimeLabel(stream: PpvStream): string {
  if (stream.alwaysLive) return 'Always Live';
  const now = Math.floor(Date.now() / 1000);
  if (now >= stream.startsAt && now <= stream.endsAt) return 'Live Now';
  if (stream.startsAt > now) {
    return new Date(stream.startsAt * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return '';
}
```

### CDN Live

Endpoints:

```txt
GET https://api.cdn-live.tv/api/v1/channels/?user=cdnlivetv&plan=free
GET https://api.cdn-live.tv/api/v1/events/sports/?user=cdnlivetv&plan=free
```

Flow:

1. Fetch channels and sports events in parallel.
2. Channels response contains `channels`.
3. Sports response contains `cdn-live-tv`.
4. The current implementation reads these keys under `cdn-live-tv`: `Soccer`, `NFL`, `NBA`, `NHL`.
5. Build tournament tabs from unique `event.tournament`.
6. In channel mode, display only channels where `status === "online"`.
7. In sports mode, display event cards.
8. If a sports event has one channel, open it directly.
9. If it has multiple channels, show a channel picker.
10. Open the channel `url` in the embedded player.

## TypeScript Models

Use permissive parsing because upstream fields can be missing or change type.

```ts
export type StreamedMatch = {
  id: string;
  title: string;
  category: string;
  date: number;
  poster?: string | null;
  popular: boolean;
  teams?: {
    home?: { name?: string; badge?: string };
    away?: { name?: string; badge?: string };
  };
  sources: StreamedSource[];
};

export type StreamedSource = {
  source: string;
  id: string;
};

export type StreamedStream = {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
};

export type Sport = {
  id: string;
  name: string;
};

export type PpvStream = {
  id: number;
  name: string;
  tag: string;
  poster?: string | null;
  uriName: string;
  startsAt: number;
  endsAt: number;
  alwaysLive: boolean;
  category: string;
  iframe?: string | null;
  allowPastStreams: boolean;
};

export type CdnChannel = {
  name: string;
  code: string;
  url: string;
  image: string;
  status: string;
  viewers: number;
};

export type CdnSportEvent = {
  gameID: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamIMG: string;
  awayTeamIMG: string;
  time: string;
  tournament: string;
  country: string;
  countryIMG: string;
  status: string;
  start: string;
  end: string;
  channels: CdnChannel[];
};
```

Normalize upstream data at your API boundary:

```ts
function asString(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : Number(value) || fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
```

## Next.js 15 Architecture

Recommended structure:

```txt
app/
  live-matches/
    page.tsx
    LiveMatchesClient.tsx
    components/
      ProviderTabs.tsx
      ModeTabs.tsx
      SportTabs.tsx
      MatchCard.tsx
      PpvCard.tsx
      CdnChannelCard.tsx
      CdnSportCard.tsx
      SourceDialog.tsx
      StreamDialog.tsx
      IframePlayer.tsx
  api/
    live-matches/
      streamed/
        matches/route.ts
        sports/route.ts
        streams/route.ts
      ppv/
        streams/route.ts
      cdn/
        channels/route.ts
        sports/route.ts
lib/
  live-matches/
    types.ts
    normalize.ts
    upstream.ts
```

Use route handlers as an upstream proxy. Do not call these upstream APIs directly from browser components. Server route handlers let you:

- Add the browser-like user agent consistently.
- Avoid CORS problems.
- Normalize inconsistent payloads.
- Hide provider changes behind your own stable API.
- Add rate limits, caching, and error handling.

## Route Handler Examples

### Streamed matches

`app/api/live-matches/streamed/matches/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://streamed.pk';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MODE_TO_ENDPOINT = {
  live: '/api/matches/live',
  today: '/api/matches/all-today',
  all: '/api/matches/all',
} as const;

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode') ?? 'live';
  const endpoint =
    MODE_TO_ENDPOINT[mode as keyof typeof MODE_TO_ENDPOINT] ??
    MODE_TO_ENDPOINT.live;

  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { 'user-agent': USER_AGENT },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}
```

### Streamed stream resolver

`app/api/live-matches/streamed/streams/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://streamed.pk';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get('source');
  const id = req.nextUrl.searchParams.get('id');

  if (!source || !id) {
    return NextResponse.json({ error: 'Missing source or id' }, { status: 400 });
  }

  const res = await fetch(
    `${BASE}/api/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
    {
      headers: { 'user-agent': USER_AGENT },
      cache: 'no-store',
    },
  );

  if (!res.ok) return NextResponse.json([]);

  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}
```

### PPV streams

`app/api/live-matches/ppv/streams/route.ts`

```ts
import { NextResponse } from 'next/server';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET() {
  const res = await fetch('https://old.ppv.to/api/streams', {
    headers: { 'user-agent': USER_AGENT },
    cache: 'no-store',
  });

  if (!res.ok) return NextResponse.json([]);

  const body = await res.json();
  const categories = Array.isArray(body?.streams) ? body.streams : [];
  const streams = categories.flatMap((category: any) =>
    Array.isArray(category?.streams) ? category.streams : [],
  );

  return NextResponse.json(streams);
}
```

### CDN sports

`app/api/live-matches/cdn/sports/route.ts`

```ts
import { NextResponse } from 'next/server';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET() {
  const res = await fetch(
    'https://api.cdn-live.tv/api/v1/events/sports/?user=cdnlivetv&plan=free',
    {
      headers: { 'user-agent': USER_AGENT },
      cache: 'no-store',
    },
  );

  if (!res.ok) return NextResponse.json([]);

  const body = await res.json();
  const data = body?.['cdn-live-tv'] ?? {};
  const keys = ['Soccer', 'NFL', 'NBA', 'NHL'];
  const events = keys.flatMap((key) => (Array.isArray(data[key]) ? data[key] : []));

  return NextResponse.json(events);
}
```

## Client State Model

The Flutter screen keeps these pieces of state:

```ts
type Provider = 'streamed' | 'ppv' | 'cdnLive';
type ViewMode = 'live' | 'today' | 'all';

type LiveMatchesState = {
  provider: Provider;
  viewMode: ViewMode;
  sportFilter: string; // "all" means no category filter
  loading: boolean;
  error: string | null;

  sports: Sport[];
  streamedMatches: StreamedMatch[];
  ppvStreams: PpvStream[];
  cdnChannels: CdnChannel[];
  cdnSports: CdnSportEvent[];
  cdnShowChannels: boolean;
};
```

Behavior:

- Initial provider is `streamed`.
- Initial Streamed view mode is `live`.
- Initial sport filter is `all`.
- Switching provider resets `sportFilter` to `all` and reloads.
- Switching Streamed view mode resets `sportFilter` to `all` and reloads.
- Refresh re-runs the active provider load.
- Loading and error states replace the grid.

## Filtering Logic

Streamed:

```ts
const filteredStreamed =
  sportFilter === 'all'
    ? streamedMatches
    : streamedMatches.filter((match) => match.category === sportFilter);
```

Streamed sport tabs:

```ts
const presentIds = new Set(streamedMatches.map((match) => match.category));
const visibleSports = sports.filter((sport) => presentIds.has(sport.id));
```

PPV:

```ts
const ppvCategories = Array.from(
  new Set(ppvStreams.map((stream) => stream.category).filter(Boolean)),
);

const filteredPpv =
  sportFilter === 'all'
    ? ppvStreams
    : ppvStreams.filter((stream) => stream.category === sportFilter);
```

CDN Sports:

```ts
const cdnTournamentTabs = Array.from(
  new Set(cdnSports.map((event) => event.tournament).filter(Boolean)),
);

const filteredCdnSports =
  sportFilter === 'all'
    ? cdnSports
    : cdnSports.filter((event) => event.tournament === sportFilter);
```

CDN channels:

```ts
const onlineChannels = cdnChannels.filter((channel) => channel.status === 'online');
```

## Streamed.pk Card and Selection Flow

Match card fields:

- Background image:
  - If both `homeBadge` and `awayBadge` exist, use `https://streamed.pk/api/images/poster/<homeBadge>/<awayBadge>.webp`.
  - Else if `poster` exists, use `https://streamed.pk/api/images/proxy/<poster>.webp`.
  - Else show a plain card.
- Team badges use `https://streamed.pk/api/images/badge/<badge>.webp`.
- Show title centered.
- Show category badge top-left.
- Show live badge top-right.
- On hover, show play icon overlay.

Source selection:

```ts
async function openMatch(match: StreamedMatch) {
  if (!match.sources.length) {
    toast('No sources available for this match');
    return;
  }

  if (match.sources.length === 1) {
    await loadStreamsForSource(match, match.sources[0]);
    return;
  }

  openSourceDialog(match.sources);
}
```

Stream loading:

```ts
async function loadStreamsForSource(match: StreamedMatch, source: StreamedSource) {
  const qs = new URLSearchParams({ source: source.source, id: source.id });
  const res = await fetch(`/api/live-matches/streamed/streams?${qs}`);
  const streams = (await res.json()) as StreamedStream[];

  if (!streams.length) {
    toast('No streams found for this source');
    return;
  }

  openStreamDialog(match, streams);
}
```

Stream picker:

- Title: `Stream <streamNo> · <language>`.
- Badge: `HD` if `hd === true`, otherwise `SD`.
- On selection, route to a player page or open a player modal with `embedUrl`.

## PPV Card and Selection Flow

PPV card fields:

- Background image from `poster` if present.
- Main title from `name`.
- Subtitle from `tag`.
- Category badge from `category`.
- Time badge from `timeLabel`.
- If `iframe` is missing, show "Not yet available".
- On hover with `iframe`, show play icon overlay.

Open behavior:

```ts
function openPpvStream(stream: PpvStream) {
  if (!stream.iframe) {
    toast('Stream not yet available for this event');
    return;
  }

  openPlayer({
    title: stream.name,
    providerLabel: 'PPV.to',
    embedUrl: stream.iframe,
  });
}
```

## CDN Live Flow

To enable CDN Live in Next.js, add a third provider tab/chip:

```tsx
<button onClick={() => setProvider('cdnLive')}>CDN Live</button>
```

Then copy the implemented behavior:

- Fetch `/api/live-matches/cdn/channels`.
- Fetch `/api/live-matches/cdn/sports`.
- Show a sub-toggle for `Channels` and `Sports`.
- In Channels view, show only online channels.
- In Sports view, filter by tournament tabs.
- If an event has no channels, show "No channels available for this event".
- If an event has one channel, open it.
- If an event has multiple channels, show a channel picker.

## Embedded Player Behavior

Flutter uses `InAppWebView` with:

- JavaScript enabled.
- Inline media playback allowed.
- Media playback without user gesture.
- No default error page.
- Multiple windows disabled.
- Fullscreen enter/exit hooks.
- Navigation interception for links that leave the embed host.

The navigation interception behavior is specific:

1. Determine the original embed host from `embedUrl`.
2. For every navigation, if the target URL does not contain the embed host:
   - Fire a background HTTP GET to the target URL.
   - Include a desktop Chrome user agent.
   - Include `Referer: <embedUrl>`.
   - Cancel the actual webview navigation.
3. If the target URL is still on the embed host, allow it.

In a browser-based Next.js site you cannot intercept cross-origin iframe navigations with the same control as `InAppWebView`. Use a sandboxed iframe first:

```tsx
export function IframePlayer({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <iframe
      src={embedUrl}
      title={title}
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowFullScreen
      referrerPolicy="origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
      className="h-full w-full bg-black"
    />
  );
}
```

Tradeoffs:

- Omitting `allow-popups` blocks many ad popups but may break some embed players.
- Adding `allow-popups` improves compatibility but allows external windows.
- Cross-origin iframe internals cannot be inspected or controlled from React.
- If an embed refuses to play inside a sandbox, provide an "Open player" fallback that opens the embed URL in a new tab.

## UI Layout Notes

The Flutter grid chooses column count from viewport width:

- Streamed and PPV: `floor(width / 300)`, clamped to `1..6`.
- CDN channels: `floor(width / 280)`, clamped to `1..6`.

In CSS, reproduce that with responsive grid tracks:

```css
.match-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
```

Card heights:

- Streamed card: about `190px`.
- PPV card: about `200px`.
- CDN channel card: about `160px`.
- CDN sport card: about `200px`.

## Error and Empty States

Use these states:

- Loading: centered spinner.
- Fetch error: centered error icon/text and Retry button.
- Streamed empty: "No matches right now".
- PPV empty: "No streams available".
- CDN channels empty: "No channels available".
- CDN sports empty: "No sports events available".
- Match has no sources: toast/snackbar.
- Source has no streams: toast/snackbar.
- PPV event has no iframe: toast/snackbar.
- CDN event has no channels: toast/snackbar.

## Caching and Refresh

Live sports data changes frequently. Recommended defaults:

- Match lists: `cache: 'no-store'` or `revalidate: 30`.
- Stream lists: `cache: 'no-store'`.
- PPV list: `cache: 'no-store'` or `revalidate: 30`.
- CDN channels/events: `cache: 'no-store'` or `revalidate: 30`.
- Images can use normal browser/CDN caching.

Keep a visible Refresh button that reloads the active provider.

## Implementation Checklist

1. Create TypeScript models and normalization helpers.
2. Create server route handlers for Streamed matches, sports, and streams.
3. Create server route handler for PPV streams and flatten nested categories.
4. Optionally create CDN Live route handlers and expose a provider tab.
5. Build the `LiveMatchesClient` component with provider, mode, category, loading, and error state.
6. Build provider tabs: Streamed.pk, PPV.to, optionally CDN Live.
7. Build Streamed mode tabs: Live, Today, All.
8. Build dynamic sport/category tabs.
9. Build responsive cards for Streamed, PPV, CDN channels, and CDN sports.
10. Build source and stream selection dialogs.
11. Build an iframe player page or modal.
12. Add sandbox/open-in-new-tab fallback for embeds that do not work inside an iframe.
13. Add refresh, retry, empty states, and toast messages.

## Minimal User Flow Summary

Streamed.pk:

```txt
Load matches + sports
→ filter sports to categories present in matches
→ user selects match
→ user selects source if needed
→ fetch streams for source/id
→ user selects stream
→ iframe opens stream.embedUrl
```

PPV.to:

```txt
Load PPV categories
→ flatten category.streams
→ user selects event
→ if iframe exists, iframe opens stream.iframe
```

CDN Live:

```txt
Load channels + sports events
→ user selects Channels or Sports
→ Channels: open channel.url
→ Sports: select event, then channel if multiple
→ iframe opens channel.url
```
