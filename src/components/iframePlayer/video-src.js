"use client";
import { useLayoutEffect, useMemo } from "react";
import styles from "./iframePlayer.module.css";
import config from "@/config";
import { useStore } from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";
import TorrentStreamList from "./TorrentStreamList";
import { useTorrent } from "./TorrentContext";

export default function VideoSrc() {
  const [iframeUrl, setIframeUrl] = useStore(Stores.iframeUrl);
  const [isAnime] = useStore(Stores.isAnime);
  const {
    error,
    isTorrentEnabled,
    setIsTorrentEnabled,
    status,
    streams,
  } = useTorrent();
  const getSourceText = (url, index) => {
    let prefix = `Source ${index + 1}`;
    let suffix = "";
    switch (url) {
      case config.iframe.url1:
        suffix = " (All)";
        break;
      case config.iframe.url20:
        suffix = " (All-Alt)";
        break;
      case config.iframe.url2:
        suffix = " (Fast)";
        break;
      case config.iframe.url3:
        suffix = " (Variety)";
        break;
      case config.iframe.url25:
        prefix = "Anime";
        suffix = "";
        break;
      case config.iframe.url30:
        prefix = "Multi";
        suffix = "";
        break;
      case config.iframe.url9:
        suffix = " (Alt)";
        break;
      case config.iframe.url8:
        suffix = " (Best)";
        break;
      case config.iframe.url13:
        suffix = " (Torrent)";
        break;
      case config.iframe.url15:
        suffix = " (Multi)";
        break;
      case config.iframe.url16:
        suffix = " (New)";
        break;
      case config.iframe.url17:
        suffix = " (X)";
        break;
      case config.iframe.url21:
        suffix = " (King)";
        break;
      case config.iframe.url23:
        suffix = " (P)";
        break;
      case config.iframe.url32:
        prefix = "Rock";
        suffix = "";
        break;
      case config.iframe.url35:
        prefix = "Core";
        suffix = "";
        break;
      case config.iframe.url38:
        prefix = "VidSrc";
        suffix = "";
        break;
      case config.iframe.url39:
        prefix = "AMRI";
        suffix = "";
        break;
      case config.iframe.url40:
        prefix = "Megaplay";
        suffix = "";
        break;
      case config.iframe.url41:
        prefix = "Vidwish";
        suffix = "";
        break;
      case config.iframe.url42:
        prefix = "DropFile";
        suffix = "";
        break;
      case config.iframe.url43:
        prefix = "Ninja";
        suffix = "";
        break;
      case config.iframe.url44:
        prefix = "Cinezo";
        suffix = "";
        break;
      default:
        break;
    }
    return prefix + suffix;
  };

  const nonAnimeSources = useMemo(
    () =>
      config.iframe.urls.filter(
        (url) =>
          ![config.iframe.url40, config.iframe.url41, config.iframe.url43].includes(
            url,
          ),
      ),
    [],
  );
  const sourceUrls = useMemo(
    () =>
      isAnime || iframeUrl?.type === "anime"
        ? config.iframe.animeUrls
        : nonAnimeSources,
    [iframeUrl?.type, isAnime, nonAnimeSources],
  );
  const selectedSource = sourceUrls.includes(iframeUrl?.baseUrl)
    ? iframeUrl.baseUrl
    : sourceUrls[0];

  useLayoutEffect(() => {
    if (!iframeUrl?.type || !iframeUrl?.id) return;

    const scrollTargetId = isTorrentEnabled ? "source-panel" : "iframe-player";

    document
      .getElementById(scrollTargetId)
      ?.scrollIntoView({ behavior: "smooth" });
  }, [
    iframeUrl?.episode,
    iframeUrl?.id,
    iframeUrl?.season,
    iframeUrl?.type,
    isTorrentEnabled,
  ]);

  useLayoutEffect(() => {
    if (!sourceUrls.length || sourceUrls.includes(iframeUrl?.baseUrl)) return;

    setIframeUrl((state) => ({
      ...state,
      baseUrl: sourceUrls[0],
    }));
  }, [iframeUrl?.baseUrl, setIframeUrl, sourceUrls]);

  return (
    <div
      className={styles["src"]}
      id="source-panel"
      style={{ scrollMarginTop: "4rem" }}
    >
      <div className={`${styles.controlPanel} ${styles.sourcePanel}`}>
        <div className={styles.sourceActions}>
          <div className={`${styles["buttons"]} ${styles.selectControls}`}>
            <h3 className={styles["name"]}>Source</h3>
            <span className={styles.controlDivider}>:</span>
            <select
              aria-label="Source"
              className={`${styles["select"]} ${styles.sourceSelect}`}
              disabled={isTorrentEnabled}
              value={selectedSource}
              onChange={(event) => {
                setIframeUrl((state) => {
                  return { ...state, baseUrl: event.target.value };
                });
              }}
            >
              {sourceUrls.map((url, index) => (
                <option key={url} value={url}>
                  {getSourceText(url, index)}
                </option>
              ))}
            </select>
          </div>
          <label className={styles.addonToggle}>
            <input
              checked={isTorrentEnabled}
              onChange={(event) => setIsTorrentEnabled(event.target.checked)}
              type="checkbox"
            />
            <span className={styles.toggleSwitch} aria-hidden="true" />
            <strong>Torrent</strong>
          </label>
          <button
            className={styles["focus"]}
            onClick={(e) => {
              e.preventDefault();
              document
                .querySelector("#iframe-player")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Focus
          </button>
        </div>
      </div>

      {isTorrentEnabled && (
        <div className={styles.addonPanel}>
          {status === "loading" && (
            <p className={styles.streamStatus}>Loading streams...</p>
          )}
          {error && <p className={styles.streamStatus}>{error}</p>}
          {status === "success" && streams.length === 0 && (
            <p className={styles.streamStatus}>No Webtor-compatible stream</p>
          )}

          {streams.length > 0 && <TorrentStreamList />}

        </div>
      )}
      <p>
        {
          "*If current server doesn't work please try other servers. Use content you have rights to stream."
        }
      </p>
    </div>
  );
}
