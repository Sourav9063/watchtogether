"use client";
import React, { useEffect, useRef } from "react";
import styles from "./iframePlayer.module.css";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import { getIframeUrl } from "@/helper/iframeFunc";
import SeasonEpisodeSelector from "./season-episode-selector";
import VideoSrc from "./video-src";
import { useStore } from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";

export default function IframePlayer() {
  const [iframeUrl] = useStore(Stores.iframeUrl);
  return (
    <div id="wrapper">
      {iframeUrl && iframeUrl.type && (
        <>
          <div
            id="iframe-player"
            className={`${styles["iframe-wrapper"]} ${styles[""]} `}
          >
            <iframe
              allowFullScreen={true}
              className={`${styles["iframe"]} ${styles[""]} `}
              src={getIframeUrl({ iframeUrl: iframeUrl })}
            />
          </div>
          {iframeUrl.type == "tv" && (
            <SeasonEpisodeSelector id={iframeUrl.id} />
          )}
          <VideoSrc />
        </>
      )}
    </div>
  );
}
