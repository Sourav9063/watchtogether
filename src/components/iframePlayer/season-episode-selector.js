import React, { useEffect, useState } from "react";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import styles from "./iframePlayer.module.css";

export default function SeasonEpisodeSelector({ id }) {
  const [iframeUrl, setIframeUrl] = useIframeUrl();
  const [season, setSeason] = useState(iframeUrl.season);
  const [episode, setEpisode] = useState(iframeUrl.episode);
  const [change, setChange] = useState({ value: 0 });
  useEffect(() => {
    if (change.value == 0) return;
    const timeOut = setTimeout(() => {
      setIframeUrl((state) => ({
        ...state,
        season: season,
        episode: episode,
      }));
    }, 1500);
    return () => {
      clearTimeout(timeOut);
    };
  }, [change]);

  return (
    <div className={`${styles["season-episode"]} ${styles[""]} `}>
      <h3>Season:</h3>
      <input
        type="number"
        value={season}
        onChange={(e) => {
          setSeason(e.target.value);
          setChange({ value: 1 });
        }}
      />
      <h3>Episode:</h3>
      <input
        type="number"
        value={episode}
        onChange={(e) => {
          setEpisode(e.target.value);
          setChange({ value: 1 });
        }}
      />
    </div>
  );
}
