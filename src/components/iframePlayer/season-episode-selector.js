import React, { useEffect, useState } from "react";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import styles from "./iframePlayer.module.css";
import { Stores } from "@/helper/CONSTANTS";
import { useStore } from "@/helper/hooks/useStore";

export default function SeasonEpisodeSelector({ id }) {
  const [iframeUrl, setIframeUrl] = useStore(Stores.iframeUrl);
  const [isAnime] = useStore(Stores.isAnime);
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
    }, 2000);
    return () => {
      clearTimeout(timeOut);
    };
  }, [change]);

  useEffect(() => {
    setSeason(iframeUrl.season);
    setEpisode(iframeUrl.episode);
  }, [iframeUrl]);
  if (!iframeUrl || (iframeUrl.type != "tv" && iframeUrl.type !== "anime"))
    return null;
  return (
    <div className={`${styles["season-episode"]} ${styles[""]} `}>
      {isAnime || iframeUrl.type == "anime" ? (
        <div className={`${styles["season"]} ${styles["select-wrapper"]} `}>
          <select
            className={styles["select"]}
            name="Dub"
            value={iframeUrl.dub || "0"}
            onChange={(e) => {
              setIframeUrl((state) => ({
                ...state,
                dub: Number(e.target.value),
              }));
            }}
          >
            <option value={1}>Dub</option>
            <option value={0}>Sub</option>
          </select>
        </div>
      ) : (
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
      )}
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
