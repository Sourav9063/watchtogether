"use client";
import React, { useEffect, useRef } from "react";
import styles from "./iframePlayer.module.css";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import { getIframeUrl } from "@/helper/iframeFunc";
import SeasonEpisodeSelector from "./season-episode-selector";
import VideoSrc from "./video-src";

export default function IframePlayer() {
  const [iframeUrl] = useIframeUrl();
  return (
    <div id="wrapper">
      {iframeUrl && iframeUrl.type && (
        <>
          {iframeUrl.type == "tv" && (
            <SeasonEpisodeSelector id={iframeUrl.id} />
          )}
          <div className={`${styles["iframe-wrapper"]} ${styles[""]} `}>
            <iframe
              allowfullscreen="true"
              webkitallowfullscreen="true"
              mozallowfullscreen="true"
              className={`${styles["iframe"]} ${styles[""]} `}
              src={getIframeUrl({ iframeUrl: iframeUrl })}
            />
          </div>
          <VideoSrc />
        </>
      )}
    </div>
  );
}
