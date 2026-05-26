import "server-only";

import { parseLrc } from "./lrc";

const REQUEST_TIMEOUT_MS = 10000;

export async function getLyrics({ trackName, artistName, albumName, duration }) {
  const params = new URLSearchParams({
    track_name: trackName,
    artist_name: artistName,
    album_name: albumName,
    duration: String(duration),
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Lyrics provider returned ${response.status}`);
    const data = await response.json();
    return parseLrc(data?.syncedLyrics);
  } finally {
    clearTimeout(timeout);
  }
}
