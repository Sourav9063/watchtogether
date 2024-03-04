"use client";
import React from "react";
import styles from "./iframePlayer.module.css";
import SeasonEpisodeSelector from "./season-episode-selector";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import { useStore } from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";

export default function HoverSeEp() {
  const [iframeUrl] = useStore(Stores.iframeUrl);
  if (!iframeUrl || iframeUrl.type != "tv") return null;
  return (
    <div className={`${styles["hover-se-ep"]} ${styles[""]} `}>
      <div className={`${styles["wrapper"]} ${styles[""]} `}>
        <SeasonEpisodeSelector />
      </div>
    </div>
  );
}
