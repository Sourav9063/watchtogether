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
          <div id="iframe-player" className={`${styles["iframe-wrapper"]} `}>
            <iframe
              allowFullScreen={true}
              sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
              className={`${styles["iframe"]} back-light `}
              src={getIframeUrl({ iframeUrl: iframeUrl })}
            />
          </div>
          {(iframeUrl.type == "tv" || iframeUrl.type == "anime") && (
            <SeasonEpisodeSelector id={iframeUrl.id} />
          )}
          <VideoSrc />
        </>
      )}
    </div>
  );
}
