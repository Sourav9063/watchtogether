import React, { useState } from "react";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import styles from "./iframePlayer.module.css";

export default function SeasonEpisodeSelector({ id }) {
  const [url, setUrl] = useIframeUrl();
  const [season, setSeason] = useState(url.season);
  const [episode, setEpisode] = useState(url.episode);
  return (
    <div className={`${styles["season-episode"]} ${styles[""]} `}>
      <h3>Season:</h3>
      <input
        type="number"
        value={season}
        onChange={(e) => {
          setSeason(e.target.value);
          setUrl((state) => ({
            ...state,
            season: e.target.value,
            episode: 1,
          }));
        }}
      />
      <h3>Episode:</h3>
      <input
        type="number"
        value={episode}
        onChange={(e) => {
          setEpisode(e.target.value);
          setUrl((state) => ({
            ...state,
            season: season,
            episode: e.target.value,
          }));
        }}
      />
    </div>
  );
}
