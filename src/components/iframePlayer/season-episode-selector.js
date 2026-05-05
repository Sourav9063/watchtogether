import React, { useMemo } from "react";
import styles from "./iframePlayer.module.css";
import { Stores } from "@/helper/CONSTANTS";
import { useStore } from "@/helper/hooks/useStore";
import {
  useTmdbSeasonEpisodes,
  useTmdbTvDetails,
} from "@/helper/hooks/useTmdbSearch";

const formatTwoDigitNumber = (value) => String(value).padStart(2, "0");

const buildNumberOptions = ({ count, selectedValue, label, formatLabel }) => {
  const total = Math.max(Number(count) || 0, Number(selectedValue) || 1);

  return Array.from({ length: total }, (_, index) => {
    const value = index + 1;

    return {
      value,
      label: formatLabel ? formatLabel(value) : `${label} ${value}`,
    };
  });
};

const mergeSelectedOption = ({
  options,
  selectedValue,
  label,
  formatLabel,
}) => {
  const selected = Number(selectedValue) || 1;

  if (options.some((option) => option.value === selected)) {
    return options;
  }

  return [
    ...options,
    {
      value: selected,
      label: formatLabel ? formatLabel(selected) : `${label} ${selected}`,
    },
  ].sort((first, second) => first.value - second.value);
};

export default function SeasonEpisodeSelector({ id }) {
  const [iframeUrl, setIframeUrl] = useStore(Stores.iframeUrl);
  const [isAnime] = useStore(Stores.isAnime);
  const selectedSeason = Number(iframeUrl?.season) || 1;
  const selectedEpisode = Number(iframeUrl?.episode) || 1;
  const activeId = id || iframeUrl?.id;
  const isAnimePlayer = isAnime || iframeUrl?.type === "anime";
  const shouldFetchTvData = iframeUrl?.type === "tv" && !isAnimePlayer;
  const { details: tvDetails } = useTmdbTvDetails({
    id: activeId,
    enabled: shouldFetchTvData,
  });
  const { seasonEpisodes } = useTmdbSeasonEpisodes({
    id: activeId,
    season: selectedSeason,
    enabled: shouldFetchTvData,
  });

  const seasonOptions = useMemo(() => {
    if (!shouldFetchTvData) return [];

    const tmdbSeasons =
      tvDetails?.seasons
        ?.filter((season) => season.season_number > 0)
        .sort((first, second) => first.season_number - second.season_number)
        .map((season) => ({
          value: season.season_number,
          label: formatTwoDigitNumber(season.season_number),
        })) || [];

    const fallbackSeasons = buildNumberOptions({
      count: tvDetails?.number_of_seasons || selectedSeason + 4,
      selectedValue: selectedSeason,
      label: "Season",
      formatLabel: formatTwoDigitNumber,
    });

    return mergeSelectedOption({
      options: tmdbSeasons.length ? tmdbSeasons : fallbackSeasons,
      selectedValue: selectedSeason,
      label: "Season",
      formatLabel: formatTwoDigitNumber,
    });
  }, [selectedSeason, shouldFetchTvData, tvDetails]);

  const episodeOptions = useMemo(() => {
    const label = "Episode";

    if (isAnimePlayer) {
      return buildNumberOptions({
        count: 200,
        selectedValue: selectedEpisode,
        label,
      });
    }

    const tmdbEpisodes =
      seasonEpisodes?.episodes
        ?.filter((episode) => episode.episode_number > 0)
        .sort((first, second) => first.episode_number - second.episode_number)
        .map((episode) => ({
          value: episode.episode_number,
          label: episode.name
            ? `${episode.episode_number}. ${episode.name}`
            : `${label} ${episode.episode_number}`,
        })) || [];

    const fallbackEpisodes = buildNumberOptions({
      count: selectedEpisode + 12,
      selectedValue: selectedEpisode,
      label,
    });

    return mergeSelectedOption({
      options: tmdbEpisodes.length ? tmdbEpisodes : fallbackEpisodes,
      selectedValue: selectedEpisode,
      label,
    });
  }, [isAnimePlayer, seasonEpisodes, selectedEpisode]);

  if (!iframeUrl || (iframeUrl.type != "tv" && iframeUrl.type !== "anime")) {
    return null;
  }

  const setSeason = (season) => {
    setIframeUrl((state) => ({
      ...state,
      season,
      episode: 1,
    }));
  };

  const setEpisode = (episode) => {
    setIframeUrl((state) => ({
      ...state,
      episode,
    }));
  };

  const setDub = (dub) => {
    setIframeUrl((state) => ({
      ...state,
      dub,
    }));
  };

  const stepSeason = (direction) => {
    const seasonValues = seasonOptions.map((option) => option.value);
    const currentIndex = seasonValues.indexOf(selectedSeason);
    const nextIndex =
      currentIndex === -1 ? 0 : currentIndex + Number(direction || 0);
    const nextSeason = seasonValues[nextIndex];

    if (!nextSeason) return;

    setSeason(nextSeason);
  };

  const stepEpisode = (direction) => {
    const episodeValues = episodeOptions.map((option) => option.value);
    const currentIndex = episodeValues.indexOf(selectedEpisode);
    const nextIndex =
      currentIndex === -1 ? 0 : currentIndex + Number(direction || 0);
    const nextEpisode = episodeValues[nextIndex];

    if (!nextEpisode) return;

    setEpisode(nextEpisode);
  };

  const seasonValues = seasonOptions.map((option) => option.value);
  const episodeValues = episodeOptions.map((option) => option.value);
  const firstSeason = seasonValues[0];
  const lastSeason = seasonValues[seasonValues.length - 1];
  const firstEpisode = episodeValues[0];
  const lastEpisode = episodeValues[episodeValues.length - 1];

  return (
    <div className={`${styles["season-episode"]} ${styles[""]} `}>
      {isAnimePlayer ? (
        <div className={`${styles["season"]} ${styles["select-wrapper"]} `}>
          <select
            className={styles["select"]}
            name="Dub"
            value={Number(iframeUrl.dub) || 0}
            onChange={(event) => setDub(Number(event.target.value))}
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
            <select
              aria-label="Season"
              className={styles["select"]}
              value={selectedSeason}
              onChange={(event) => setSeason(Number(event.target.value))}
            >
              {seasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles["buttons"]} ${styles[""]} `}>
            <button
              disabled={selectedSeason <= firstSeason}
              onClick={() => stepSeason(-1)}
            >
              Prev
            </button>
            <button
              disabled={selectedSeason >= lastSeason}
              onClick={() => stepSeason(1)}
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
          <select
            aria-label="Episode"
            className={styles["select"]}
            value={selectedEpisode}
            onChange={(event) => setEpisode(Number(event.target.value))}
          >
            {episodeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles["buttons"]}>
          <button
            disabled={selectedEpisode <= firstEpisode}
            onClick={() => stepEpisode(-1)}
          >
            Prev
          </button>
          <button
            disabled={selectedEpisode >= lastEpisode}
            onClick={() => stepEpisode(1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
