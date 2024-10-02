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
              className={`${styles["iframe"]} ${styles["filter-blur"]} `}
              src={getIframeUrl({ iframeUrl: iframeUrl })}
            />
            <svg width="0" height="0">
              <filter
                id="blur-and-scale"
                y="-50%"
                x="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="50"
                  result="blurred"
                />
                <feColorMatrix type="saturate" in="blurred" values="3" />
                <feComposite in="SourceGraphic" operator="over" />
              </filter>
            </svg>
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
