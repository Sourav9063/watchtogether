"use client";
import React, { useState } from "react";
import styles from "./iframePlayer.module.css";
import SeasonEpisodeSelector from "./season-episode-selector";

export default function HoverSeEp() {
  const [show, setShow] = useState(false);
  return (
    <div className={`${styles["hover-se-ep"]} ${styles[""]} `}>
      <div className={`${styles["wrapper"]} ${styles[""]} `}>
        <SeasonEpisodeSelector />
      </div>
    </div>
  );
}
