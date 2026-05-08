"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const DynamicWebtorPlayer = dynamic(() => import("@/components/WebtorPlayer"), {
  ssr: false,
  loading: () => <p className={styles.playerStatus}>Loading Webtor player...</p>,
});

const DEMO_MAGNET =
  "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel";
const RECENT_MAGNETS_KEY = "torrentMagnetHistory";
const decoder = new TextDecoder();

function isMagnetUri(value) {
  return /^magnet:\?xt=urn:btih:[a-z0-9]{32,40}/i.test(value.trim());
}

function isInfoHash(value) {
  return /^([a-f0-9]{40}|[a-z2-7]{32})$/i.test(value.trim());
}

function normalizeTorrentSource(value) {
  const trimmedValue = value.trim();

  if (isInfoHash(trimmedValue)) {
    return `magnet:?xt=urn:btih:${trimmedValue.toUpperCase()}`;
  }

  return trimmedValue;
}

function readRecentMagnets() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_MAGNETS_KEY)) || [];
  } catch {
    return [];
  }
}

function writeRecentMagnets(nextMagnets) {
  localStorage.setItem(
    RECENT_MAGNETS_KEY,
    JSON.stringify(nextMagnets.slice(0, 8)),
  );
}

function decodeBytes(value) {
  if (value instanceof Uint8Array) {
    return decoder.decode(value);
  }

  return String(value || "");
}

function decodeBencode(bytes) {
  let offset = 0;

  function readByteString() {
    const start = offset;

    while (bytes[offset] !== 58) {
      offset += 1;
    }

    const length = Number(decoder.decode(bytes.slice(start, offset)));
    offset += 1;

    const value = bytes.slice(offset, offset + length);
    offset += length;
    return value;
  }

  function readInteger() {
    offset += 1;
    const start = offset;

    while (bytes[offset] !== 101) {
      offset += 1;
    }

    const value = Number(decoder.decode(bytes.slice(start, offset)));
    offset += 1;
    return value;
  }

  function readList() {
    offset += 1;
    const value = [];

    while (bytes[offset] !== 101) {
      value.push(readValue());
    }

    offset += 1;
    return value;
  }

  function readDictionary() {
    offset += 1;
    const value = {};

    while (bytes[offset] !== 101) {
      const key = decodeBytes(readByteString());
      value[key] = readValue();
    }

    offset += 1;
    return value;
  }

  function readValue() {
    const byte = bytes[offset];

    if (byte === 105) return readInteger();
    if (byte === 108) return readList();
    if (byte === 100) return readDictionary();
    if (byte >= 48 && byte <= 57) return readByteString();

    throw new Error("Invalid torrent file");
  }

  return readValue();
}

async function readTorrentMetadata(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const torrent = decodeBencode(bytes);
  const info = torrent?.info;

  if (!info) {
    throw new Error("Invalid torrent file");
  }

  const rootName = decodeBytes(info["name.utf-8"] || info.name || file.name);

  if (Array.isArray(info.files)) {
    return info.files.map((item, index) => {
      const rawPath = item["path.utf-8"] || item.path || [];
      const pathParts = rawPath.map(decodeBytes).filter(Boolean);
      const path = pathParts.join("/");
      const fullPath = [rootName, path].filter(Boolean).join("/");

      return {
        id: `${index}-${path || fullPath}`,
        name: pathParts.at(-1) || fullPath,
        path,
        fullPath,
        length: item.length || 0,
      };
    });
  }

  return [
    {
      id: rootName,
      name: rootName,
      path: rootName,
      fullPath: rootName,
      length: info.length || 0,
    },
  ];
}

function formatBytes(bytes) {
  if (!bytes) return "";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function TorrentWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const magnetInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const torrentUrlRef = useRef("");
  const [magnetURI, setMagnetURI] = useState("");
  const [playerMagnetURI, setPlayerMagnetURI] = useState("");
  const [playerTorrentUrl, setPlayerTorrentUrl] = useState("");
  const [playerPath, setPlayerPath] = useState("");
  const [playerTitle, setPlayerTitle] = useState("");
  const [torrentUrl, setTorrentUrl] = useState("");
  const [torrentFileName, setTorrentFileName] = useState("");
  const [torrentFiles, setTorrentFiles] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [recentMagnets, setRecentMagnets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setRecentMagnets(readRecentMagnets());
  }, []);

  useEffect(() => {
    return () => {
      if (torrentUrlRef.current) {
        URL.revokeObjectURL(torrentUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const magnet = searchParams.get("magnet");
    const title = searchParams.get("title");

    if (!magnet) return;

    setMagnetURI(magnet);
    setPlayerMagnetURI(magnet);
    setPlayerTorrentUrl("");
    setPlayerPath("");
    setPlayerTitle(title || "Torrent stream");
  }, [searchParams]);

  function setTorrentObjectUrl(file) {
    if (torrentUrlRef.current) {
      URL.revokeObjectURL(torrentUrlRef.current);
    }

    const nextTorrentUrl = URL.createObjectURL(file);
    torrentUrlRef.current = nextTorrentUrl;
    setTorrentUrl(nextTorrentUrl);
    return nextTorrentUrl;
  }

  async function handleTorrentFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".torrent")) {
      setError("Choose .torrent file");
      return;
    }

    try {
      const files = await readTorrentMetadata(file);
      const nextTorrentUrl = setTorrentObjectUrl(file);
      const nextPath = files[0]?.path || "";
      const nextTitle =
        playerTitle || file.name.replace(/\.torrent$/i, "") || "Torrent stream";

      setTorrentFileName(file.name);
      setTorrentFiles(files);
      setSelectedPath(nextPath);
      setPlayerTitle(nextTitle);
      setPlayerMagnetURI("");
      setPlayerTorrentUrl(nextTorrentUrl);
      setPlayerPath(nextPath);
      setError("");
      router.replace("/torrent", { scroll: false });
    } catch (err) {
      setError(err.message || "Torrent file could not be read");
    }
  }

  function playMagnet(nextMagnet = magnetURI, nextTitle = "Torrent stream") {
    const trimmedMagnet = normalizeTorrentSource(nextMagnet);

    if (!isMagnetUri(trimmedMagnet)) {
      setError("Valid magnet link or info hash needed");
      return;
    }

    const title = nextTitle || "Torrent stream";
    const nextRecentMagnets = [
      { magnet: trimmedMagnet, title },
      ...recentMagnets.filter((item) => item.magnet !== trimmedMagnet),
    ].slice(0, 8);

    setError("");
    setMagnetURI(trimmedMagnet);
    setPlayerMagnetURI(trimmedMagnet);
    setPlayerTorrentUrl("");
    setPlayerPath("");
    setPlayerTitle(title);
    setRecentMagnets(nextRecentMagnets);
    writeRecentMagnets(nextRecentMagnets);

    const params = new URLSearchParams();
    params.set("magnet", trimmedMagnet);
    params.set("title", title);
    router.replace(`/torrent?${params.toString()}`, { scroll: false });
  }

  function playTorrentFile() {
    if (!torrentUrl) {
      setError("Choose .torrent file first");
      return;
    }

    setError("");
    setPlayerMagnetURI("");
    setPlayerTorrentUrl(torrentUrl);
    setPlayerPath(selectedPath);
    setPlayerTitle(playerTitle || torrentFileName || "Torrent stream");
    router.replace("/torrent", { scroll: false });
  }

  function handleSubmit(event) {
    event.preventDefault();
    playMagnet(magnetURI, playerTitle || "Torrent stream");
  }

  function handleDemo() {
    playMagnet(DEMO_MAGNET, "Sintel");
  }

  function handleClear() {
    setMagnetURI("");
    setPlayerMagnetURI("");
    setPlayerTorrentUrl("");
    setPlayerPath("");
    setPlayerTitle("");
    setTorrentUrl("");
    setTorrentFileName("");
    setTorrentFiles([]);
    setSelectedPath("");
    setError("");

    if (torrentUrlRef.current) {
      URL.revokeObjectURL(torrentUrlRef.current);
      torrentUrlRef.current = "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    router.replace("/torrent", { scroll: false });
  }

  return (
    <>
      <section className={styles.hero} aria-labelledby="torrent-title">
        <div className={styles.heroText}>
          <p className={styles.kicker}>Webtor</p>
          <h1 id="torrent-title">Torrent Stream</h1>
          <p>
            Paste magnet source or drop .torrent file, then choose which file
            should play.
          </p>
        </div>

        <div className={styles.activeMedia}>
          <div className={styles.panelHeader}>
            <span>Source</span>
            <strong>{playerTitle || "Manual magnet"}</strong>
          </div>

          <form className={styles.sourceForm} onSubmit={handleSubmit}>
            <label htmlFor="torrent-title-input">Title</label>
            <input
              id="torrent-title-input"
              value={playerTitle}
              onChange={(event) => setPlayerTitle(event.target.value)}
              placeholder="Torrent stream"
            />

            <label htmlFor="torrent-magnet">Magnet URI or info hash</label>
            <textarea
              id="torrent-magnet"
              ref={magnetInputRef}
              value={magnetURI}
              onChange={(event) => {
                setMagnetURI(event.target.value.trim());
                setError("");
              }}
              placeholder="magnet:?xt=urn:btih... or 5C41CDD5BA7FA0EBDF5D948A173CEB6312020ED2"
              rows={4}
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <button type="submit">Load Stream</button>
              <button type="button" onClick={handleDemo}>
                Demo: Sintel
              </button>
              <button type="button" onClick={handleClear}>
                Clear
              </button>
            </div>
          </form>

          <div
            className={`${styles.dropZone} ${
              isDragging ? styles.dropZoneActive : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleTorrentFile(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={fileInputRef}
              id="torrent-file"
              type="file"
              accept=".torrent,application/x-bittorrent"
              onChange={(event) => handleTorrentFile(event.target.files?.[0])}
            />
            <label htmlFor="torrent-file">
              <strong>{torrentFileName || "Choose or drop .torrent file"}</strong>
              <span>
                {torrentFiles.length
                  ? `${torrentFiles.length} file${torrentFiles.length === 1 ? "" : "s"} found`
                  : "Pick file to show playable paths"}
              </span>
            </label>
          </div>

          {torrentFiles.length > 0 && (
            <div className={styles.filePicker}>
              <div className={styles.panelHeader}>
                <span>File</span>
                <strong>{selectedPath || "First file"}</strong>
              </div>
              <div className={styles.fileList}>
                {torrentFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    className={
                      file.path === selectedPath ? styles.selectedFile : ""
                    }
                    onClick={() => {
                      setSelectedPath(file.path);
                      setPlayerPath(file.path);
                    }}
                  >
                    <span>{file.fullPath || file.path}</span>
                    <small>{formatBytes(file.length)}</small>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.playFileButton}
                onClick={playTorrentFile}
              >
                Play Selected File
              </button>
            </div>
          )}

          <p className={styles.notice}>Use content you have rights to stream.</p>
        </div>
      </section>

      {(playerMagnetURI || playerTorrentUrl) && (
        <section className={styles.playerSection} aria-label="Torrent player">
          <div className={styles.sectionHeader}>
            <span>Now playing</span>
            <h2>{playerTitle || "Torrent stream"}</h2>
          </div>
          <DynamicWebtorPlayer
            height="640px"
            magnetURI={playerMagnetURI}
            path={playerPath}
            title={playerTitle}
            torrentUrl={playerTorrentUrl}
          />
        </section>
      )}

      {recentMagnets.length > 0 && (
        <section className={styles.recentSection} aria-label="Recent magnets">
          <div className={styles.sectionHeader}>
            <span>Recent</span>
            <h2>Magnet History</h2>
          </div>
          <div className={styles.recentGrid}>
            {recentMagnets.map((item) => (
              <button
                key={item.magnet}
                type="button"
                onClick={() => playMagnet(item.magnet, item.title)}
              >
                {item.title || "Torrent stream"}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function TorrentWorkspace() {
  return (
    <Suspense fallback={<p className={styles.playerStatus}>Loading...</p>}>
      <TorrentWorkspaceContent />
    </Suspense>
  );
}
