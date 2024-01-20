"use client";
import React, { useEffect, useRef } from "react";
import styles from "./iframePlayer.module.css";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import { getIframeUrl } from "@/helper/iframeFunc";
import SeasonEpisodeSelector from "./season-episode-selector";

export default function IframePlayer() {
  const [url] = useIframeUrl();
  return (
    <div id="wrapper">
      {url && (
        <>
          {url.type == "tv" && <SeasonEpisodeSelector id={url.id} />}
          <div className={`${styles["iframe-wrapper"]} ${styles[""]} `}>
            <iframe
              className={`${styles["iframe"]} ${styles[""]} `}
              src={getIframeUrl({ iframeUrl: url })}
            />
          </div>
        </>
      )}
    </div>
  );
}
