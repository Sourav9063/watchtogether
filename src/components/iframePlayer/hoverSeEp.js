"use client";
import React from "react";
import styles from "./iframePlayer.module.css";
import SeasonEpisodeSelector from "./season-episode-selector";
import { useIframeUrl } from "../Provider/IframeDataProvider";

export default function HoverSeEp() {
  const [iframeUrl] = useIframeUrl();
  if (!iframeUrl || iframeUrl.type != "tv") return null;
  return (
    <div className={`${styles["hover-se-ep"]} ${styles[""]} `}>
      <div className={`${styles["wrapper"]} ${styles[""]} `}>
        <SeasonEpisodeSelector />
      </div>
    </div>
  );
}
