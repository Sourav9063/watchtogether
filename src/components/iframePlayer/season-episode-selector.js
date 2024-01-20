import React, { useEffect, useState } from "react";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import styles from "./iframePlayer.module.css";

export default function SeasonEpisodeSelector({ id }) {
  const [url, setUrl] = useIframeUrl();
  const [season, setSeason] = useState(url.season);
  const [episode, setEpisode] = useState(url.episode);
  useEffect(() => {
    const timeOut = setTimeout(() => {
      setUrl((state) => ({
        ...state,
        season: season,
        episode: episode,
      }));
    }, 2000);
    return () => {
      clearTimeout(timeOut);
    };
  }, [season, episode]);

  return (
    <div className={`${styles["season-episode"]} ${styles[""]} `}>
      <h3>Season:</h3>
      <input
        type="number"
        value={season}
        onChange={(e) => {
          setSeason(e.target.value);
        }}
      />
      <h3>Episode:</h3>
      <input
        type="number"
        value={episode}
        onChange={(e) => {
          setEpisode(e.target.value);
        }}
      />
    </div>
  );
}
