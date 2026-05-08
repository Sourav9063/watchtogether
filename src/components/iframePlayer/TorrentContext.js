"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import config from "@/config";
import { createDataContext } from "@/helper/createContext";

const DEFAULT_STREMIO_ADDON_URL =
  process.env.NEXT_PUBLIC_STREMIO_ADDON_URL || "";
const tmdbExternalIdCache = new Map();
const TORRENT_QUERY_KEYS = ["f", "m"];

const [TorrentDataProvider, useTorrent] = createDataContext({
  name: "TorrentContext",
  errorMessage: "useTorrent must be used within a TorrentProvider",
});

function getStremioStreamBaseUrl(value) {
  const baseUrl = value
    .trim()
    .replace(/\/manifest\.json$/i, "")
    .replace(/\/$/, "");

  if (!baseUrl) return "";
  if (baseUrl.endsWith("/stream")) return baseUrl;

  return `${baseUrl}/stream`;
}

function getStremioType(type) {
  if (type === "movie") return "movie";
  if (type === "tv" || type === "anime") return "series";
  return "";
}

function getIframePageKey(iframeUrl) {
  if (!iframeUrl?.type || !iframeUrl?.id) return "";
  if (iframeUrl.type === "movie") return `movie:${iframeUrl.id}`;

  return `${iframeUrl.type}:${iframeUrl.id}:${iframeUrl.season || 1}:${
    iframeUrl.episode || 1
  }`;
}

function createStremioStreamUrl(addonBaseUrl, iframeUrl, imdbId) {
  const baseUrl = getStremioStreamBaseUrl(addonBaseUrl);
  const type = getStremioType(iframeUrl?.type);
  const id = imdbId || "";

  if (!baseUrl || !type || !id) return "";

  if (type === "movie") {
    return `${baseUrl}/movie/${encodeURIComponent(id)}.json`;
  }

  return `${baseUrl}/series/${id}:${iframeUrl.season || 1}:${
    iframeUrl.episode || 1
  }.json`;
}

async function getTmdbExternalId(iframeUrl, signal) {
  const type = iframeUrl?.type === "movie" ? "movie" : "tv";
  const id = iframeUrl?.id;

  if (!id || !config.tmdbApiKey) return "";

  const cacheKey = `${type}-${id}`;
  const cachedId = tmdbExternalIdCache.get(cacheKey);

  if (cachedId) return cachedId;

  const response = await fetch(
    `https://api.themoviedb.org/3/${type}/${id}/external_ids?api_key=${config.tmdbApiKey}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`TMDB external id failed: ${response.status}`);
  }

  const data = await response.json();
  const imdbId = data.imdb_id || "";

  if (imdbId) {
    tmdbExternalIdCache.set(cacheKey, imdbId);
  }

  return imdbId;
}

function createMagnetFromInfoHash(infoHash, sources = []) {
  const trackers = sources
    .filter((source) => source?.startsWith("tracker:"))
    .map((source) => source.replace(/^tracker:/, ""))
    .filter(Boolean);

  return `magnet:?xt=urn:btih:${infoHash}${trackers
    .map((tracker) => `&tr=${encodeURIComponent(tracker)}`)
    .join("")}`;
}

function getInitialSharedStream() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const magnetURI = params.get("m") || "";

  if (!magnetURI) return null;

  const filename = params.get("f") || "";
  const title = filename || "Torrent stream";

  return {
    id: `shared-${magnetURI}-${filename}`,
    name: title,
    title,
    displayTitle: title,
    filename,
    fileIdx: undefined,
    magnetURI,
    provider: "",
    shouldShowFilename: false,
    size: "",
    titleLines: [title],
    torrentUrl: "",
  };
}

function writeTorrentQueryParams(stream) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  TORRENT_QUERY_KEYS.forEach((key) => params.delete(key));

  if (stream) {
    if (stream.filename) params.set("f", stream.filename);
    if (stream.magnetURI) params.set("m", stream.magnetURI);
  }

  const queryString = params.toString();
  const nextUrl = `${window.location.pathname}${
    queryString ? `?${queryString}` : ""
  }${window.location.hash}`;

  window.history.replaceState(null, "", nextUrl);
}

function preservePlayableStream(current) {
  if (current?.magnetURI || current?.torrentUrl) return current;
  return null;
}

function normalizeTorrentStream(stream, index) {
  const infoHash = stream.infoHash || stream.infohash || "";
  const torrentUrl =
    !infoHash && /\.torrent($|\?)/i.test(stream.url || "") ? stream.url : "";

  if (!infoHash && !torrentUrl) return null;

  const name = stream.name || `Stream ${index + 1}`;
  const title = stream.title || stream.description || name;
  const filename = stream.behaviorHints?.filename || "";
  const titleLines = title
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const statsLineIndex = titleLines.findIndex((line) => /👤|💾|⚙️/.test(line));
  const statsLine = statsLineIndex >= 0 ? titleLines[statsLineIndex] : "";
  const peerMatch = statsLine.match(/👤\s*([^\s]+)/);
  const sizeMatch = statsLine.match(/💾\s*([\d.]+)\s*([A-Za-z]+)/);
  const providerMatch = statsLine.match(/⚙️\s*(.+)$/);
  const titleLine = titleLines.find((line, lineIndex) => {
    if (lineIndex === statsLineIndex) return false;
    if (filename && line === filename) return false;
    return true;
  });
  const titleBaseName = filename.replace(/\.[^.]+$/, "");
  const shouldShowFilename =
    filename &&
    filename !== titleLine &&
    !titleLine?.includes(titleBaseName) &&
    !titleBaseName.includes(titleLine || "");

  return {
    id: `${infoHash || torrentUrl}-${stream.fileIdx ?? index}`,
    name,
    title,
    displayTitle: titleLine || filename || name,
    filename,
    fileIdx: stream.fileIdx,
    magnetURI: infoHash
      ? createMagnetFromInfoHash(infoHash, stream.sources || [])
      : "",
    peerCount: peerMatch?.[1] || "",
    provider: providerMatch?.[1] || "",
    shouldShowFilename,
    size: sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2]}` : "",
    titleLines,
    torrentUrl,
  };
}

export function TorrentProvider({ children, iframeUrl }) {
  const [isTorrentEnabled, setIsTorrentEnabled] = useState(true);
  const [streams, setStreams] = useState([]);
  const [selectedStream, setSelectedStreamState] =
    useState(getInitialSharedStream);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const stremioType = getStremioType(iframeUrl?.type);
  const pageKey = getIframePageKey(iframeUrl);

  const setSelectedStream = useCallback(
    (stream) => {
      setSelectedStreamState(
        stream
          ? {
              ...stream,
              pageKey,
            }
          : null,
      );
    },
    [pageKey],
  );

  const selectedStreamTitle = useMemo(() => {
    if (!selectedStream) return "";

    return [selectedStream.name, selectedStream.filename || selectedStream.title]
      .filter(Boolean)
      .join(" - ");
  }, [selectedStream]);

  const playerStream = useMemo(() => {
    if (!isTorrentEnabled || !selectedStream) return null;

    return {
      file: selectedStream.filename,
      magnetURI: selectedStream.magnetURI,
      title: selectedStreamTitle,
      torrentUrl: selectedStream.torrentUrl,
    };
  }, [isTorrentEnabled, selectedStream, selectedStreamTitle]);

  useEffect(() => {
    if (!isTorrentEnabled) return;

    setSelectedStreamState((current) => {
      if (!current?.pageKey || current.pageKey === pageKey) return current;
      return null;
    });

    if (!iframeUrl?.type || !iframeUrl?.id) {
      setStatus("idle");
      setStreams([]);
      setSelectedStreamState(preservePlayableStream);
      setError("Choose movie or series first");
      return;
    }

    if (!DEFAULT_STREMIO_ADDON_URL.trim()) {
      setStatus("idle");
      setStreams([]);
      setSelectedStreamState(preservePlayableStream);
      setError("NEXT_PUBLIC_STREMIO_ADDON_URL missing");
      return;
    }

    const controller = new AbortController();

    async function fetchStreams() {
      setStatus("loading");
      setError("");

      try {
        const imdbId = await getTmdbExternalId(iframeUrl, controller.signal);

        if (!imdbId) {
          throw new Error("IMDb id missing for selected title");
        }

        const streamUrl = createStremioStreamUrl(
          DEFAULT_STREMIO_ADDON_URL,
          iframeUrl,
          imdbId,
        );

        if (!streamUrl) {
          throw new Error("Stream URL could not be created");
        }

        setSelectedStreamState((current) => {
          if (!current) return null;
          if (current.pageKey && current.pageKey !== pageKey) return null;

          return current;
        });

        const response = await fetch(streamUrl, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Stream request failed: ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error("Stream endpoint returned HTML, check addon URL");
        }

        const data = await response.json();
        const nextStreams = (data.streams || [])
          .map(normalizeTorrentStream)
          .filter(Boolean);

        setStreams(nextStreams);
        setStatus("success");
      } catch (err) {
        if (err.name === "AbortError") return;

        setStreams([]);
        setSelectedStreamState(preservePlayableStream);
        setStatus("error");
        setError(err.message || "Stream request failed");
      }
    }

    fetchStreams();

    return () => {
      controller.abort();
    };
  }, [
    iframeUrl,
    iframeUrl?.episode,
    iframeUrl?.id,
    iframeUrl?.season,
    iframeUrl?.type,
    isTorrentEnabled,
    pageKey,
    stremioType,
  ]);

  useEffect(() => {
    writeTorrentQueryParams(selectedStream);
  }, [selectedStream]);

  const value = useMemo(
    () => ({
      error,
      isTorrentEnabled,
      pageKey,
      playerStream,
      selectedStream,
      setIsTorrentEnabled,
      setSelectedStream,
      status,
      streams,
    }),
    [
      error,
      isTorrentEnabled,
      pageKey,
      playerStream,
      selectedStream,
      setSelectedStream,
      status,
      streams,
    ],
  );

  return <TorrentDataProvider value={value}>{children}</TorrentDataProvider>;
}

export { useTorrent };
