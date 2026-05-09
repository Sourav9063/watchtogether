"use client";
import dynamic from "next/dynamic";
import React from "react";
import styles from "./iframePlayer.module.css";
import { getIframeUrl } from "@/helper/iframeFunc";
import config from "@/config";
import SeasonEpisodeSelector from "./season-episode-selector";
import VideoSrc from "./video-src";
import { useStore } from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";
import { TorrentProvider, useTorrent } from "./TorrentContext";

const DynamicWebtorPlayer = dynamic(() => import("@/components/WebtorPlayer"), {
  ssr: false,
  loading: () => <p className={styles.streamStatus}>Loading Webtor player...</p>,
});

export default function IframePlayer() {
  const [iframeUrl] = useStore(Stores.iframeUrl);

  return (
    <div id="wrapper">
      {iframeUrl && iframeUrl.type && (
        <TorrentProvider iframeUrl={iframeUrl}>
          <IframePlayerContent iframeUrl={iframeUrl} />
        </TorrentProvider>
      )}
    </div>
  );
}

function IframePlayerContent({ iframeUrl }) {
  const { isTorrentEnabled, playerStream } = useTorrent();
  const playerUrl = getIframeUrl({ iframeUrl });
  const isTabSource = config.tabs
    .filter(Boolean)
    .includes(iframeUrl.baseUrl);

  return (
    <>
      <div id="iframe-player" className={`${styles["iframe-wrapper"]} `}>
        {isTorrentEnabled ? (
          playerStream ? (
            <div className={styles.webtorMain}>
              <DynamicWebtorPlayer
                file={playerStream.file}
                height="100%"
                key={`${playerStream.magnetURI || playerStream.torrentUrl}-${
                  playerStream.file
                }`}
                magnetURI={playerStream.magnetURI}
                title={playerStream.title}
                torrentUrl={playerStream.torrentUrl}
              />
            </div>
          ) : (
            <div className={styles.webtorMain}>
              <p className={styles.streamPlaceholder}>Choose stream source</p>
            </div>
          )
        ) : isTabSource ? (
          <div className={styles.tabPlayerMain}>
            <a
              className={styles.tabPlayerLink}
              href={playerUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open in new tab
            </a>
          </div>
        ) : (
          <iframe
            allowFullScreen={true}
            // sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
            className={`${styles["iframe"]} back-light `}
            src={playerUrl}
          />
        )}
      </div>
      {(iframeUrl.type == "tv" || iframeUrl.type == "anime") && (
        <SeasonEpisodeSelector id={iframeUrl.id} />
      )}
      <VideoSrc />
    </>
  );
}
