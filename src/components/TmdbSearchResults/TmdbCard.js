import styles from "./TmdbSearchResults.module.css";
import { getSeasonAndEpisode } from "@/helper/iframeFunc";
import {
  addValueLocalStorageArray,
  removeValueLocalStorageArray,
} from "@/helper/functions/localStorageFn";
import { Constants, Stores } from "@/helper/CONSTANTS";
import { useStore } from "@/helper/hooks/useStore";

export default function TmdbCard({
  details,
  cardType,
  showType = true,
  setSearchResults = () => {},
  setIframeUrl = () => {},
}) {
  const {
    type,
    id,
    vote_average,
    title,
    poster_image_url,
    backdrop_image_url,
    release_date,
    first_air_date,
  } = details;
  return (
    <>
      <button
        className={`${styles["card"]} ${styles[""]} `}
        onClick={(e) => {
          e.stopPropagation();
          addValueLocalStorageArray({
            key: Constants.LocalStorageKey.WATCH_HISTORY,
            value: {
              type,
              id,
              vote_average,
              title,
              poster_image_url,
              release_date,
              first_air_date,
            },
          });
          if (type == "movie") {
            setIframeUrl((state) => {
              return { ...state, type: "movie", id: id };
            });
          } else {
            setIframeUrl((state) => {
              return {
                ...state,
                type: "tv",
                id: id,
                ...getSeasonAndEpisode({ id: id }),
              };
            });
          }

          setSearchResults((state) => {
            if (state.type == "HISTORY") {
              return {
                ...state,
                value: [
                  details,
                  ...state.value.filter((item) => item.id != id),
                ],
              };
            }
            return state;
          });
        }}
      >
        {/* cross svg */}
        {cardType == "HISTORY" && (
          <div
            role="button"
            tabIndex={0}
            className={`${styles["cross"]} ${styles[""]} `}
            onClick={(e) => {
              e.stopPropagation();
              removeValueLocalStorageArray({
                key: Constants.LocalStorageKey.WATCH_HISTORY,
                value: {
                  type,
                  id,
                  vote_average,
                  title,
                  poster_image_url,
                  release_date,
                  first_air_date,
                },
              });
              setSearchResults((state) => {
                return {
                  ...state,
                  value: state.value.filter((item) => item.id != id),
                };
              });
            }}
          >
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M13.414 12l4.293-4.293a1 1 0 10-1.414-1.414L12 10.586 7.707 6.293a1 1 0 00-1.414 1.414L10.586 12l-4.293 4.293a1 1 0 001.414 1.414L12 13.414l4.293 4.293a1 1 0 001.414-1.414L13.414 12z"
              ></path>
            </svg>
          </div>
        )}
        <div className={`${styles["img-title"]} ${styles[""]} `}>
          <img src={poster_image_url || backdrop_image_url} alt={title} />
          <div className={`${styles["title"]} ${styles[""]} `}>
            <h2>{title}</h2>
            {
              <p>
                {release_date?.substring(0, 4) ||
                  first_air_date?.substring(0, 4)}
              </p>
            }
            {!!vote_average && vote_average > 0 && (
              <p>
                <span>Rating: </span>
                <span>{vote_average?.toFixed(1)}</span>
              </p>
            )}
          </div>
        </div>
        {showType && <h4>{type == "tv" ? "Series" : "Movie"}</h4>}
      </button>
    </>
  );
}
