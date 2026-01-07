"use client";
import styles from "./iframePlayer.module.css";
import config from "@/config";
import { useStore } from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";
import { useState } from "react";

export default function VideoSrc() {
  const [iframeUrl, setIframeUrl] = useStore(Stores.iframeUrl);
  const [showAll, setShowAll] = useState(false);
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
  return (
    <div className={styles["src"]}>
      <div className={`${styles["src-list"]} ${styles[""]} `}>
        {(showAll ? config.iframe.urls : config.iframe.urls.slice(0, 16)).map(
          (url, index) => {
            return (
              <button
                key={index}
                style={{
                  backgroundColor:
                    iframeUrl.baseUrl === url
                      ? " var(--hover-color)"
                      : "var(--primary-color)",
                }}
                onClick={() => {
                  setIframeUrl((state) => {
                    return { ...state, baseUrl: url };
                  });
                }}
              >
                {getSourceText(url, index)}
              </button>
            );
          },
        )}
        {config.iframe.urls.length > 5 && (
          <button onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show Less" : "Show More"}
          </button>
        )}
      </div>
      <p>
        {
          "*If current server doesn't work please try other servers. You can download from some server."
        }
      </p>
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
  );
}
