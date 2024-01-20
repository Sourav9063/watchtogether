import React from "react";
import styles from "./TmdbSearchResults.module.css";
import { useIframeUrl } from "../Provider/IframeDataProvider";

export default function TmdbCard({ details }) {
  const [, setIframeUrl] = useIframeUrl();
  return (
    <>
      <div
        className={`${styles["card"]} ${styles[""]} `}
        onClick={() => {
          if (details.type == "movie") {
            setIframeUrl({ type: "movie", id: details.id });
          } else {
            setIframeUrl({ type: "tv", id: details.id, season: 1, episode: 1 });
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <div className={`${styles["img-title"]} ${styles[""]} `}>
          <img src={details.poster_image_url} />
          <div className={`${styles["title"]} ${styles[""]} `}>
            <h2>{details.title}</h2>
            {
              <p>
                {details?.release_date?.substring(0, 4) ||
                  details?.first_air_date?.substring(0, 4)}
              </p>
            }
            {details?.vote_average && (
              <p>
                <span>Rating: </span>
                {details.vote_average?.toFixed(1)}
              </p>
            )}
          </div>
        </div>
        <h4>{details.type == "tv" ? "Series" : "Movie"}</h4>
      </div>
    </>
  );
}
