import "server-only";
import dns from "dns";
import { createHash } from "crypto";

dns.setDefaultResultOrder("ipv4first");

const FALLBACK_API_KEY = process.env.YOUTUBE_INNERTUBE_FALLBACK_KEY;
const CONFIG_TTL_MS = 3 * 60 * 60 * 1000;
const VIDEO_ID_TTL_MS = 12 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;
const YOUTUBE_ORIGIN = "https://www.youtube.com";
const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function parseDataSyncId(dataSyncId) {
  if (!dataSyncId) return {};
  const [first, second] = dataSyncId.split("||");
  if (second) {
    return { delegatedSessionId: first, userSessionId: second };
  }
  return { userSessionId: first };
}

function getYoutubeApiAuthHeaders(cookie, playerConfig) {
  if (!cookie) return {};
  const identityCookies = [
    ["SAPISIDHASH", "SAPISID"],
    ["SAPISID1PHASH", "__Secure-1PAPISID"],
    ["SAPISID3PHASH", "__Secure-3PAPISID"],
  ];
  const timestamp = Math.floor(Date.now() / 1000);
  const authorization = identityCookies
    .map(([authName, cookieName]) => {
      const value = new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`).exec(
        cookie,
      )?.[1];
      if (!value) return null;
      const authPrefix = playerConfig.userSessionId
        ? `${playerConfig.userSessionId} `
        : "";
      const hash = createHash("sha1")
        .update(`${authPrefix}${timestamp} ${value} ${YOUTUBE_ORIGIN}`)
        .digest("hex");
      const authSuffix = playerConfig.userSessionId ? "_u" : "";
      return `${authName} ${timestamp}_${hash}${authSuffix}`;
    })
    .filter(Boolean)
    .join(" ");
  if (!authorization) return { Cookie: cookie };
  return {
    Authorization: authorization,
    Cookie: cookie,
    ...(playerConfig.delegatedSessionId
      ? { "X-Goog-PageId": playerConfig.delegatedSessionId }
      : {}),
    ...(playerConfig.delegatedSessionId || playerConfig.sessionIndex !== null
      ? { "X-Goog-AuthUser": String(playerConfig.sessionIndex || 0) }
      : {}),
    "X-Origin": YOUTUBE_ORIGIN,
    ...(playerConfig.loggedIn
      ? { "X-YouTube-Bootstrap-Logged-In": "true" }
      : {}),
  };
}

const CLIENTS = [
  {
    key: "android_vr",
    id: "28",
    version: "1.56.21",
    requiresVisitorData: true,
    userAgent:
      "com.google.android.apps.youtube.vr.oculus/1.56.21 (Linux; U; Android 12; en_US; Quest 3; Build/SQ3A.220605.009.A1) gzip",
    context: {
      clientName: "ANDROID_VR",
      clientVersion: "1.56.21",
      deviceMake: "Oculus",
      deviceModel: "Quest 3",
      osName: "Android",
      osVersion: "12",
      platform: "MOBILE",
      androidSdkVersion: 32,
      hl: "en",
      gl: "US",
    },
  },
  {
    key: "android",
    id: "3",
    version: "20.10.35",
    userAgent:
      "com.google.android.youtube/20.10.35 (Linux; U; Android 14; en_US) gzip",
    context: {
      clientName: "ANDROID",
      clientVersion: "20.10.35",
      osName: "Android",
      osVersion: "14",
      platform: "MOBILE",
      androidSdkVersion: 34,
      hl: "en",
      gl: "US",
    },
  },
  {
    key: "ios",
    id: "5",
    version: "20.10.1",
    userAgent:
      "com.google.ios.youtube/20.10.1 (iPhone16,2; U; CPU iOS 17_4 like Mac OS X)",
    context: {
      clientName: "IOS",
      clientVersion: "20.10.1",
      deviceModel: "iPhone16,2",
      osName: "iPhone",
      osVersion: "17.4.0.21E219",
      platform: "MOBILE",
      hl: "en",
      gl: "US",
    },
  },
  {
    key: "web",
    id: "1",
    version: "2.20240228.06.00",
    userAgent: DESKTOP_USER_AGENT,
    context: {
      clientName: "WEB",
      clientVersion: "2.20240228.06.00",
      osName: "Windows",
      osVersion: "10.0",
      platform: "DESKTOP",
      hl: "en",
      gl: "US",
    },
  },
  {
    key: "mweb",
    id: "2",
    version: "2.20260522.01.00",
    userAgent: "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36",
    context: {
      clientName: "MWEB",
      clientVersion: "2.20260522.01.00",
      osName: "Android",
      osVersion: "6.0",
      platform: "MOBILE",
      hl: "en",
      gl: "US",
    },
  },
];

const videoIds = new Map();
const streams = new Map();
let config;
let configPromise;

function getApiKey(scrapedApiKey) {
  const apiKey = scrapedApiKey || FALLBACK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing YOUTUBE_INNERTUBE_FALLBACK_KEY and YouTube configuration key",
    );
  }
  return apiKey;
}

async function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function keepBounded(cache, maxEntries) {
  while (cache.size > maxEntries) {
    cache.delete(cache.keys().next().value);
  }
}

async function searchVideoId(title, artist) {
  const key = `${title}|${artist}`.toLowerCase();
  const existing = videoIds.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.videoId;
  videoIds.delete(key);

  const query = `${title} ${artist} lyrics`;

  try {
    const playerConfig = await ensureConfig(false);
    const apiResponse = await timedFetch(
      `https://www.youtube.com/youtubei/v1/search?key=${encodeURIComponent(playerConfig.apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: YOUTUBE_ORIGIN,
          "User-Agent": DESKTOP_USER_AGENT,
          ...getYoutubeApiAuthHeaders(process.env.YOUTUBE_COOKIE, playerConfig),
        },
        body: JSON.stringify({
          query,
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20240228.06.00",
              hl: "en",
              gl: "US",
            },
          },
        }),
      },
    );
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      const items =
        data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ||
        data.contents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
      if (items) {
        const videoId = items.find((i) => i.videoRenderer)?.videoRenderer?.videoId;
        if (videoId) {
          videoIds.set(key, {
            videoId,
            expiresAt: Date.now() + VIDEO_ID_TTL_MS,
          });
          keepBounded(videoIds, 200);
          return videoId;
        }
      }
    }
  } catch {
    // Fall back to HTML scraping if API fails
  }

  const encodedQuery = encodeURIComponent(query);
  const cookie = process.env.YOUTUBE_COOKIE || "CONSENT=YES+20210329-01-0;";
  const response = await timedFetch(
    `https://www.youtube.com/results?search_query=${encodedQuery}`,
    {
      headers: {
        "User-Agent": DESKTOP_USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: cookie,
      },
    },
  );
  if (!response.ok) throw new Error(`YouTube search returned ${response.status}`);
  const html = await response.text();
  const match = /"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/.exec(html);
  if (!match) return null;
  videoIds.set(key, {
    videoId: match[1],
    expiresAt: Date.now() + VIDEO_ID_TTL_MS,
  });
  keepBounded(videoIds, 200);
  return match[1];
}

async function fetchConfig(forced) {
  const configuredDataSyncId = process.env.YOUTUBE_DATASYNC_ID;
  try {
    const cookie = process.env.YOUTUBE_COOKIE;
    const response = await timedFetch(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&hl=en",
      {
        headers: {
          "User-Agent": DESKTOP_USER_AGENT,
          "Accept-Language": "en-US,en;q=0.9",
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
    );
    if (response.ok) {
      const html = await response.text();
      const apiKey = /"INNERTUBE_API_KEY":"([^"]+)"/.exec(html)?.[1];
      const visitorData = /"VISITOR_DATA":"([^"]+)"/.exec(html)?.[1];
      const loggedIn =
        Boolean(configuredDataSyncId) || /"LOGGED_IN":true/.test(html);
      const dataSyncId =
        configuredDataSyncId ||
        (loggedIn ? /"DATASYNC_ID":"([^"]+)"/.exec(html)?.[1] : null);
      const sessionIndexMatch = /"SESSION_INDEX":(?:"(\d+)"|(\d+))/.exec(
        html,
      );
      return {
        apiKey: getApiKey(apiKey),
        visitorData,
        ...parseDataSyncId(dataSyncId),
        sessionIndex: Number(
          sessionIndexMatch?.[1] || sessionIndexMatch?.[2] || 0,
        ),
        loggedIn,
        forced,
        expiresAt: Date.now() + CONFIG_TTL_MS,
      };
    }
  } catch {
    // Fallback context still gives non-VR clients a chance to resolve audio.
  }
  return {
    apiKey: getApiKey(),
    visitorData: null,
    ...parseDataSyncId(configuredDataSyncId),
    sessionIndex: configuredDataSyncId ? 0 : null,
    loggedIn: Boolean(configuredDataSyncId),
    forced,
    expiresAt: Date.now() + CONFIG_TTL_MS,
  };
}

async function ensureConfig(forceRefresh = false) {
  if (!forceRefresh && config && config.expiresAt > Date.now()) return config;
  if (configPromise) return configPromise;
  configPromise = fetchConfig(forceRefresh)
    .then((nextConfig) => {
      config = nextConfig;
      return nextConfig;
    })
    .finally(() => {
      configPromise = null;
    });
  return configPromise;
}

async function fetchPlayer(videoId, playerConfig, client) {
  const response = await timedFetch(
    `https://www.youtube.com/youtubei/v1/player?key=${encodeURIComponent(playerConfig.apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: YOUTUBE_ORIGIN,
        "User-Agent": client.userAgent,
        "X-YouTube-Client-Name": client.id,
        "X-YouTube-Client-Version": client.version,
        ...(playerConfig.visitorData
          ? { "X-Goog-Visitor-Id": playerConfig.visitorData }
          : {}),
        ...getYoutubeApiAuthHeaders(process.env.YOUTUBE_COOKIE, playerConfig),
      },
      body: JSON.stringify({
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
        context: { client: client.context },
        playbackContext: {
          contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS" },
        },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`YouTube player ${client.key} returned ${response.status}`);
  }
  return response.json();
}

function expiryFromUrl(url) {
  try {
    const seconds = Number(new URL(url).searchParams.get("expire"));
    return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
  } catch {
    return null;
  }
}

function chooseAudio(streamingData) {
  const audio = Array.isArray(streamingData?.adaptiveFormats)
    ? streamingData.adaptiveFormats.filter((format) =>
        String(format.mimeType || "").startsWith("audio/"),
      )
    : [];
  const formats = audio.length
    ? audio
    : Array.isArray(streamingData?.formats)
      ? streamingData.formats
      : [];
  return formats
    .filter((format) => typeof format.url === "string" && format.url)
    .map((format) => ({
      audioUrl: format.url,
      bitrate: Number(format.bitrate || format.averageBitrate || 0),
      expiresAt: expiryFromUrl(format.url),
    }))
    .sort((left, right) => right.bitrate - left.bitrate)[0];
}

async function resolveStream(videoId, forceRefresh = false) {
  const cached = streams.get(videoId);
  if (!forceRefresh && cached && cached.cacheUntil > Date.now()) return cached;
  streams.delete(videoId);

  const playerConfig = await ensureConfig(forceRefresh);
  for (const client of CLIENTS) {
    if (client.requiresVisitorData && !playerConfig.visitorData) {
      console.error(`[YouTube Extractor] Skipping client ${client.key} because visitorData is missing`);
      continue;
    }
    try {
      const response = await fetchPlayer(videoId, playerConfig, client);
      const candidate = chooseAudio(response.streamingData);
      if (candidate) {
        const stream = {
          ...candidate,
          cacheUntil:
            (candidate.expiresAt || Date.now() + 4 * 60 * 60 * 1000) - 60000,
        };
        streams.set(videoId, stream);
        keepBounded(streams, 100);
        return stream;
      } else {
        console.error(`[YouTube Extractor] Client ${client.key} returned no audio formats for ${videoId}. Playability:`, response.playabilityStatus?.status);
      }
    } catch (e) {
      console.error(`[YouTube Extractor] Client ${client.key} failed for ${videoId}:`, e.message);
    }
  }
  if (!forceRefresh) return resolveStream(videoId, true);
  return null;
}

export async function resolveAudioTrack({ id, title, artist }, forceRefresh = false) {
  const videoId = await searchVideoId(title, artist);
  if (!videoId) {
    console.error("[YouTube Extractor] searchVideoId returned null for", { title, artist });
    return null;
  }
  const stream = await resolveStream(videoId, forceRefresh);
  if (!stream) {
    console.error("[YouTube Extractor] resolveStream returned null for videoId", videoId);
    return null;
  }
  return {
    trackId: id,
    videoId,
    audioUrl: stream.audioUrl,
    ...(stream.expiresAt ? { expiresAt: stream.expiresAt } : {}),
  };
}
