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

  useEffect(() => {
    setSeason(iframeUrl.season);
    setEpisode(iframeUrl.episode);
  }, [iframeUrl]);

  return (
    <div className={`${styles["season-episode"]} ${styles[""]} `}>
      <div className={`${styles["season"]} ${styles["buttons"]} `}>
        <div className={`${styles["buttons"]} ${styles[""]} `}>
          <h3 className={styles["name"]}>Season</h3>
          <h3>:</h3>
          <input
            type="number"
            value={season}
            onChange={(e) => {
              setSeason(e.target.value);
              setEpisode(1);
              setChange({ value: 1 });
            }}
          />
        </div>
        <div className={`${styles["buttons"]} ${styles[""]} `}>
          <button
            onClick={() => {
              setSeason((state) => Math.max(1, state - 1));
              setEpisode(1);
              setChange({ value: 1 });
            }}
          >
            Prev
          </button>
          <button
            onClick={() => {
              setSeason((state) => Number(state) + 1);
              setEpisode(1);
              setChange({ value: 1 });
            }}
          >
            Next
          </button>
        </div>
      </div>
      <div className={`${styles["episode"]} ${styles["buttons"]} `}>
        <div className={`${styles["buttons"]} ${styles[""]} `}>
          <h3 className={styles["name"]}>Episode</h3>
          <h3>:</h3>
          <input
            type="number"
            value={episode}
            onChange={(e) => {
              setEpisode(e.target.value);
              setChange({ value: 1 });
            }}
          />
        </div>
        <div className={styles["buttons"]}>
          <button
            onClick={() => {
              setEpisode((state) => Math.max(1, state - 1));
              setChange({ value: 1 });
            }}
          >
            Prev
          </button>
          <button
            onClick={() => {
              setEpisode((state) => Number(state) + 1);
              setChange({ value: 1 });
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
