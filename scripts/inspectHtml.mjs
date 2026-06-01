/**
 * Inspects static HTML from an authorized URL or local HTML file.
 *
 * Usage:
 *   node scripts/inspectHtml.mjs https://example.com/watch
 *   node scripts/inspectHtml.mjs https://example.com/watch --fetch-scripts
 *   node scripts/inspectHtml.mjs ./page.html
 *
 * This is a structural parser. It does not execute JavaScript, bypass access
 * controls, deobfuscate player code, or extract protected stream manifests.
 */

import fs from "fs";
import path from "path";

const TARGET = process.argv[2];
const SHOULD_FETCH_SCRIPTS = process.argv.includes("--fetch-scripts");
const TIMEOUT_MS = 12000;
const MEDIA_EXTENSION_PATTERN = /\.(m3u8|mpd|mp4|m4s|ts|webm|mkv|mov)(?:[?#]|$)/i;
const URL_PATTERN = /https?:\/\/[^\s"'<>\\)]+|\/\/[^\s"'<>\\)]+/gi;
const PATH_PATTERN = /["'`]((?:\/api\/|\/ajax\/|\/embed\/|\/player\/|\/watch\/|\/tv\/|\/movie\/)[^"'`]*)["'`]/gi;
const PLAYER_MARKERS = [
  ["HLS marker", /\bm3u8\b|\bhls\.js\b|\bhls\b/i],
  ["DASH marker", /\bmpd\b|\bdash\.js\b|\bdash\b/i],
  ["Direct media marker", MEDIA_EXTENSION_PATTERN],
  ["JW Player marker", /\bjwplayer\b/i],
  ["Shaka marker", /\bshaka\b/i],
  ["Video.js marker", /\bvideojs\b|\bvideo\.js\b/i],
  ["Iframe/embed marker", /\biframe\b|\bembed\b/i],
  ["PostMessage marker", /\bpostmessage\b/i],
  ["Provider/server selector marker", /\bprovider\b|\bserver\b|\bsource\b/i],
];

if (!TARGET) {
  console.error("Usage: node scripts/inspectHtml.mjs <url-or-html-file>");
  process.exit(1);
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value = "") {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function parseAttributes(raw = "") {
  const attrs = {};
  const attrPattern =
    /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = attrPattern.exec(raw))) {
    const [, name, doubleQuoted, singleQuoted, bare] = match;
    attrs[name.toLowerCase()] = decodeHtml(doubleQuoted ?? singleQuoted ?? bare ?? "");
  }

  return attrs;
}

function parseTags(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  const tags = [];
  let match;

  while ((match = pattern.exec(html))) {
    tags.push(parseAttributes(match[1]));
  }

  return tags;
}

function parsePairedTags(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const tags = [];
  let match;

  while ((match = pattern.exec(html))) {
    tags.push({
      attrs: parseAttributes(match[1]),
      body: match[2],
    });
  }

  return tags;
}

function extractJsonScript(html, id) {
  const pattern = new RegExp(
    `<script\\b(?=[^>]*\\bid=["']${id}["'])[^>]*>([\\s\\S]*?)<\\/script>`,
    "i",
  );
  const match = html.match(pattern);
  if (!match) return null;

  try {
    return JSON.parse(decodeHtml(match[1]));
  } catch {
    return null;
  }
}

function compactRows(rows, limit = 20) {
  const visible = rows.slice(0, limit);
  const hidden = rows.length - visible.length;
  return { visible, hidden };
}

function printRows(title, rows, formatRow, limit) {
  const { visible, hidden } = compactRows(rows, limit);
  console.log(`\n${title}: ${rows.length}`);

  for (const row of visible) {
    console.log(`  - ${formatRow(row)}`);
  }

  if (hidden > 0) {
    console.log(`  ... ${hidden} more`);
  }
}

function getBaseUrl(source) {
  return /^https?:\/\//i.test(source) ? source : undefined;
}

function parseUrl(value, baseUrl) {
  if (!value) return null;

  try {
    return new URL(value, baseUrl);
  } catch {
    return null;
  }
}

function isUsefulUrl(parsed) {
  if (!parsed || !/^https?:$/i.test(parsed.protocol)) return false;
  const host = parsed.hostname.toLowerCase();

  if (host === "localhost") return true;
  if (!host.includes(".")) return false;
  if (/[,;(){}[\]`]/.test(host)) return false;
  if (host.startsWith(".") || host.endsWith(".")) return false;

  return true;
}

function redactUrl(value, baseUrl) {
  const parsed = parseUrl(value, baseUrl);

  if (!isUsefulUrl(parsed)) return value || "";

  const mediaMatch = parsed.pathname.match(MEDIA_EXTENSION_PATTERN);
  if (mediaMatch) {
    return `${parsed.origin}/[media:${mediaMatch[1].toLowerCase()}]`;
  }

  parsed.username = "";
  parsed.password = "";
  parsed.search = parsed.search ? "?[query-redacted]" : "";
  parsed.hash = parsed.hash ? "#[hash-redacted]" : "";

  return parsed.toString();
}

function collectDomainEvidence(groups, baseUrl) {
  const evidence = new Map();

  for (const [role, values] of Object.entries(groups)) {
    for (const value of values) {
      const parsed = parseUrl(value, baseUrl);
      if (!isUsefulUrl(parsed)) continue;

      const key = parsed.origin;
      const current = evidence.get(key) ?? {
        origin: key,
        roles: new Set(),
        count: 0,
        examples: [],
      };

      current.roles.add(role);
      current.count += 1;

      if (current.examples.length < 3) {
        current.examples.push(redactUrl(value, baseUrl));
      }

      evidence.set(key, current);
    }
  }

  return [...evidence.values()]
    .map((item) => ({
      ...item,
      roles: [...item.roles].sort(),
    }))
    .sort((a, b) => b.count - a.count || a.origin.localeCompare(b.origin));
}

function scanEvidenceText(text, baseUrl) {
  const urls = new Set();
  const paths = new Set();
  const markers = [];
  let match;

  while ((match = URL_PATTERN.exec(text))) {
    const url = match[0].startsWith("//") ? `https:${match[0]}` : match[0];
    const parsed = parseUrl(url, baseUrl);
    if (isUsefulUrl(parsed)) urls.add(redactUrl(url, baseUrl));
  }

  while ((match = PATH_PATTERN.exec(text))) {
    paths.add(redactUrl(match[1], baseUrl));
  }

  for (const [label, pattern] of PLAYER_MARKERS) {
    const found = text.match(pattern);
    if (found) markers.push(label);
  }

  return {
    urls: [...urls].sort(),
    paths: [...paths].sort(),
    markers,
  };
}

function classifyOrigin(origin) {
  const host = parseUrl(origin)?.hostname ?? origin;
  const labels = [];

  if (/backend|api|db|users|ip/i.test(host)) labels.push("backend/API");
  if (/proxy|cors|workers\.dev|vercel\.app/i.test(host)) labels.push("proxy/CORS");
  if (/subs|opensubtitles|trailers/i.test(host)) labels.push("metadata/subtitle");
  if (/video|flix|stream|smashy|file|onifile|weather/i.test(host)) labels.push("video/provider");
  if (/cloudflare|turnstile/i.test(host)) labels.push("anti-bot");
  if (/disable-devtool/i.test(origin)) labels.push("anti-inspection");

  return labels.length > 0 ? labels.join(",") : "reference";
}

function findNestedKeys(value, interestingKeys, pathParts = [], results = []) {
  if (!value || typeof value !== "object") return results;

  if (Array.isArray(value)) {
    value.forEach((item, index) => findNestedKeys(item, interestingKeys, [...pathParts, `[${index}]`], results));
    return results;
  }

  for (const [key, item] of Object.entries(value)) {
    const nextPath = [...pathParts, key];
    if (interestingKeys.has(key.toLowerCase())) {
      results.push({
        path: nextPath.join("."),
        type: Array.isArray(item) ? "array" : typeof item,
        value: typeof item === "string" ? item.slice(0, 160) : undefined,
      });
    }
    findNestedKeys(item, interestingKeys, nextPath, results);
  }

  return results;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/javascript,text/plain,*/*",
        "User-Agent": "Mozilla/5.0 HTML structure inspector",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      url: response.url,
      text: await response.text(),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function inspectScripts(scripts, baseUrl) {
  if (!SHOULD_FETCH_SCRIPTS || !baseUrl) return [];

  const base = new URL(baseUrl);
  const scriptUrls = scripts
    .map((item) => parseUrl(item.src, baseUrl))
    .filter((item) => item && item.origin === base.origin)
    .map((item) => item.toString());
  const uniqueScriptUrls = [...new Set(scriptUrls)];
  const results = [];

  for (const scriptUrl of uniqueScriptUrls) {
    const fetched = await fetchText(scriptUrl);
    const evidence = scanEvidenceText(fetched.text, fetched.url);

    results.push({
      url: redactUrl(fetched.url, baseUrl),
      status: fetched.status,
      bytes: Buffer.byteLength(fetched.text, "utf-8"),
      markers: evidence.markers,
      urls: evidence.urls,
      paths: evidence.paths,
    });
  }

  return results;
}

async function readTarget(target) {
  if (/^https?:\/\//i.test(target)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(target, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "Mozilla/5.0 HTML structure inspector",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      const html = await response.text();
      return {
        html,
        source: response.url,
        status: response.status,
        contentType: response.headers.get("content-type") ?? "",
      };
    } finally {
      clearTimeout(timer);
    }
  }

  const filePath = path.resolve(process.cwd(), target);
  return {
    html: fs.readFileSync(filePath, "utf-8"),
    source: filePath,
    status: "file",
    contentType: "text/html",
  };
}

function summarizePlayback({ iframes, videos, audios, sources, scripts, html }) {
  const scriptText = scripts
    .map((script) => `${script.src ?? ""} ${script.body ?? ""}`)
    .join("\n")
    .toLowerCase();
  const lowerHtml = html.toLowerCase();

  const signals = [
    ["HTML5 media elements", videos.length > 0 || audios.length > 0 || sources.length > 0],
    ["Embedded player iframe", iframes.length > 0],
    ["HLS player/runtime reference", /\bhls\.js\b|\bhls\b|m3u8/.test(scriptText) || lowerHtml.includes(".m3u8")],
    ["DASH player/runtime reference", /\bdash\.js\b|\bdash\b|mpd/.test(scriptText) || lowerHtml.includes(".mpd")],
    ["Video.js reference", /videojs|video\.js/.test(scriptText)],
    ["JW Player reference", /jwplayer/.test(scriptText)],
    ["Shaka Player reference", /shaka/.test(scriptText)],
    ["React/Next.js application shell", /_next\/static|__next_data__/.test(lowerHtml)],
  ].filter(([, present]) => present);

  console.log("\nPlayback shape:");

  if (signals.length === 0) {
    console.log("  - No static playback markers found. Page may build player after client-side JavaScript runs.");
    return;
  }

  for (const [label] of signals) {
    console.log(`  - ${label}`);
  }
}

const { html, source, status, contentType } = await readTarget(TARGET);
const baseUrl = getBaseUrl(source);
const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
const meta = parseTags(html, "meta");
const links = parseTags(html, "link");
const scripts = parsePairedTags(html, "script").map(({ attrs, body }) => ({
  src: attrs.src,
  type: attrs.type,
  body,
}));
const iframes = parseTags(html, "iframe");
const videos = parseTags(html, "video");
const audios = parseTags(html, "audio");
const sources = parseTags(html, "source");
const tracks = parseTags(html, "track");
const forms = parseTags(html, "form");
const nextData = extractJsonScript(html, "__NEXT_DATA__");
const scriptEvidence = await inspectScripts(scripts, baseUrl);
const scriptDomainEvidence = collectDomainEvidence(
  {
    scriptReference: scriptEvidence.flatMap((item) => item.urls),
    scriptPath: scriptEvidence.flatMap((item) => item.paths),
  },
  baseUrl,
);
const domainEvidence = collectDomainEvidence(
  {
    iframe: iframes.map((item) => item.src),
    script: scripts.map((item) => item.src),
    stylesheet: links.map((item) => item.href),
    video: videos.map((item) => item.src),
    poster: videos.map((item) => item.poster),
    audio: audios.map((item) => item.src),
    source: sources.map((item) => item.src),
    track: tracks.map((item) => item.src),
    form: forms.map((item) => item.action),
  },
  baseUrl,
);

console.log(`Source: ${source}`);
console.log(`Status: ${status}`);
console.log(`Content-Type: ${contentType}`);
console.log(`Bytes: ${Buffer.byteLength(html, "utf-8")}`);
console.log(`Title: ${titleMatch ? stripHtml(titleMatch[1]) : "(none)"}`);

printRows(
  "Metadata",
  meta.filter((item) => item.name || item.property || item.content),
  (item) => `${item.name || item.property || "(meta)"} = ${item.content || ""}`,
  20,
);

printRows(
  "Stylesheets/preloads",
  links.filter((item) => item.href),
  (item) => `${item.rel || "link"} ${redactUrl(item.href, baseUrl)}`,
  20,
);

printRows(
  "Scripts",
  scripts,
  (item) => (item.src ? redactUrl(item.src, baseUrl) : `(inline ${item.type || "script"}, ${item.body.length} chars)`),
  30,
);

printRows(
  "Iframes",
  iframes,
  (item) => `${item.src ? redactUrl(item.src, baseUrl) : "(no src)"}${item.allow ? ` allow="${item.allow}"` : ""}`,
  20,
);

printRows(
  "Video elements",
  videos,
  (item) =>
    `${item.src ? redactUrl(item.src, baseUrl) : "(no src)"}${
      item.poster ? ` poster="${redactUrl(item.poster, baseUrl)}"` : ""
    }`,
  20,
);

printRows("Audio elements", audios, (item) => (item.src ? redactUrl(item.src, baseUrl) : "(no src)"), 20);
printRows(
  "Source elements",
  sources,
  (item) => `${item.type || "(unknown type)"} ${item.src ? redactUrl(item.src, baseUrl) : "(no src)"}`,
  30,
);
printRows(
  "Track elements",
  tracks,
  (item) => `${item.kind || "track"} ${item.src ? redactUrl(item.src, baseUrl) : "(no src)"}`,
  20,
);
printRows(
  "Forms",
  forms,
  (item) => `${item.method || "GET"} ${item.action ? redactUrl(item.action, baseUrl) : "(current page)"}`,
  20,
);

printRows(
  "Referenced domains",
  domainEvidence,
  (item) => `${item.origin} roles=${item.roles.join(",")} count=${item.count} example=${item.examples[0]}`,
  30,
);

if (nextData) {
  console.log("\nNext.js data:");
  console.log(`  - buildId: ${nextData.buildId || "(none)"}`);
  console.log(`  - page: ${nextData.page || "(none)"}`);
  console.log(`  - query keys: ${Object.keys(nextData.query || {}).join(", ") || "(none)"}`);
  console.log(`  - prop keys: ${Object.keys(nextData.props || {}).join(", ") || "(none)"}`);

  const keys = findNestedKeys(
    nextData,
    new Set(["id", "tmdbid", "imdbid", "title", "season", "episode", "type", "slug", "providers", "server", "servers"]),
  ).slice(0, 30);

  printRows(
    "Next.js interesting props",
    keys,
    (item) => `${item.path} (${item.type})${item.value ? ` = ${item.value}` : ""}`,
    30,
  );
}

printRows(
  SHOULD_FETCH_SCRIPTS ? "Fetched script evidence" : "Fetched script evidence (skipped; add --fetch-scripts)",
  scriptEvidence,
  (item) =>
    `${item.status} ${item.bytes} bytes ${item.url} markers=${
      item.markers.length > 0 ? item.markers.join(",") : "none"
    } urls=${item.urls.length} paths=${item.paths.length}`,
  40,
);

for (const item of scriptEvidence.filter((script) => script.urls.length > 0 || script.paths.length > 0)) {
  printRows(`Script references from ${item.url}`, [...item.urls, ...item.paths], (value) => value, 20);
}

printRows(
  "Referenced domains from fetched scripts",
  scriptDomainEvidence,
  (item) =>
    `${item.origin} category=${classifyOrigin(item.origin)} roles=${item.roles.join(",")} count=${item.count} example=${item.examples[0]}`,
  40,
);

summarizePlayback({ iframes, videos, audios, sources, scripts, html });

console.log(
  `\nLimit: ${SHOULD_FETCH_SCRIPTS ? "HTML plus same-origin scripts" : "static HTML only"}. Report redacts queries, hashes, credentials, and direct media URLs.`,
);
