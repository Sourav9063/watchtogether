import "server-only";

const PROXY_BASE = process.env.DEEZER_PROXY_BASE_URL;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 5;
const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map();

function text(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function artwork(item) {
  return (
    text(item?.cover_xl) ||
    text(item?.cover_big) ||
    text(item?.cover_medium) ||
    text(item?.cover_small)
  );
}

export function normalizeTrack(item, albumOverride) {
  const album = albumOverride || item?.album || {};
  return {
    id: String(item?.id || ""),
    title: text(item?.title, "Unknown Title"),
    artist: text(item?.artist?.name, "Unknown Artist"),
    album: text(album?.title),
    cover: artwork(album),
    duration: Math.max(0, Math.round(number(item?.duration))),
  };
}

export function normalizeAlbum(item) {
  return {
    id: String(item?.id || ""),
    title: text(item?.title, "Unknown Album"),
    artist: text(item?.artist?.name, "Unknown Artist"),
    cover: artwork(item),
    nbTracks: Math.max(0, Math.round(number(item?.nb_tracks))),
  };
}

function getCached(key) {
  const cached = responseCache.get(key);
  if (!cached || cached.expiresAt < Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCached(key, value) {
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  if (responseCache.size > 80) {
    responseCache.delete(responseCache.keys().next().value);
  }
  return value;
}

async function fetchDeezer(targetUrl) {
  if (!PROXY_BASE) {
    throw new Error("Missing DEEZER_PROXY_BASE_URL server environment variable");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${PROXY_BASE}${encodeURIComponent(targetUrl)}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Catalog provider returned ${response.status}`);
    }
    const body = await response.json();
    if (!body || typeof body !== "object") {
      throw new Error("Catalog provider returned invalid data");
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function withRetry(loader, allowEmpty = false) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const result = await loader();
      if (allowEmpty || result.length || attempt === MAX_RETRIES) return result;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
  }
  if (lastError) throw lastError;
  return [];
}

export async function getTrendingTracks(index, limit) {
  const key = `trending:${index}:${limit}`;
  const cached = getCached(key);
  if (cached) return cached;
  const tracks = await withRetry(async () => {
    const data = await fetchDeezer(
      `https://api.deezer.com/chart/0/tracks?index=${index}&limit=${limit}`,
    );
    return Array.isArray(data.data)
      ? data.data.map((item) => normalizeTrack(item)).filter((item) => item.id)
      : [];
  });
  return setCached(key, tracks);
}

export async function searchMusic(query) {
  const encoded = encodeURIComponent(query);
  const [tracks, albums] = await Promise.all([
    withRetry(async () => {
      const data = await fetchDeezer(`https://api.deezer.com/search?q=${encoded}`);
      return Array.isArray(data.data)
        ? data.data.map((item) => normalizeTrack(item)).filter((item) => item.id)
        : [];
    }, true),
    withRetry(async () => {
      const data = await fetchDeezer(
        `https://api.deezer.com/search/album?q=${encoded}`,
      );
      return Array.isArray(data.data)
        ? data.data.map((item) => normalizeAlbum(item)).filter((item) => item.id)
        : [];
    }, true),
  ]);
  return { tracks, albums };
}

export async function getAlbum(albumId) {
  const key = `album:${albumId}`;
  const cached = getCached(key);
  if (cached) return cached;
  const result = await withRetry(async () => {
    const data = await fetchDeezer(`https://api.deezer.com/album/${albumId}`);
    if (!data.id || !data.tracks || !Array.isArray(data.tracks.data)) return [];
    const album = normalizeAlbum(data);
    const tracks = data.tracks.data
      .map((item) => normalizeTrack(item, data))
      .filter((item) => item.id);
    return [{ album, tracks }];
  });
  if (!result.length) throw new Error("Album not found");
  return setCached(key, result[0]);
}

export async function getRelatedTracks(trackId) {
  return withRetry(async () => {
    const data = await fetchDeezer(
      `https://api.deezer.com/track/${trackId}/related`,
    );
    return Array.isArray(data.data)
      ? data.data.map((item) => normalizeTrack(item)).filter((item) => item.id)
      : [];
  }, true);
}
