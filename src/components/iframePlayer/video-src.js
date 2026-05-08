"use client";
import styles from "./iframePlayer.module.css";
import config from "@/config";
import { useStore } from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";
import TorrentStreamList from "./TorrentStreamList";
import { useTorrent } from "./TorrentContext";

export default function VideoSrc() {
  const [iframeUrl, setIframeUrl] = useStore(Stores.iframeUrl);
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
      default:
        break;
    }
    return prefix + suffix;
  };

  const selectedSource = iframeUrl?.baseUrl || config.iframe.urls[0];

  return (
    <div className={styles["src"]}>
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
              {config.iframe.urls.map((url, index) => (
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
