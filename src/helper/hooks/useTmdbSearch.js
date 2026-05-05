import config from "@/config";
import { useEffect, useState } from "react";
import { useDebounce } from "./useDebounce";
import {
  getLocalStorage,
  getLocalStorageCache,
  setLocalStorageCache,
} from "../functions/localStorageFn";
import { Constants, Stores } from "../CONSTANTS";
import { useStore } from "./useStore";
import { searchAnime } from "@/components/tmdbSearch/WatchAnime";

export const useTmdbSearch = () => {
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [, setSearchResults] = useStore(Stores.searchResults);
  const [query] = useStore(Stores.query);
  const [isAnime] = useStore(Stores.isAnime);
  const debounce = useDebounce(query, 2000);
  useEffect(() => {
    setStatus("loading");
    if (!query) {
      setStatus("idle");
      setSearchResults({
        type: "HISTORY",
        value: getLocalStorage({
          key: Constants.LocalStorageKey.WATCH_HISTORY,
          emptyReturn: [],
        }),
      });
    }
  }, [query]);
  useEffect(() => {
    if (isAnime && debounce) {
      async function fetchData() {
        if (!debounce || debounce === "") {
          return;
        }

        const { data, error } = await searchAnime(debounce);
        if (error) {
          console.log(error);
          setStatus("error");
        }

        setSearchResults({
          type: "SEARCH",
          value: data || [],
        });
        setStatus("success");
      }

      fetchData();
    }
    if (debounce && !isAnime) {
      const fn = async () => {
        try {
          const [movieRes, tvRes] = await Promise.all([
            fetch(
              `https://api.themoviedb.org/3/search/movie?api_key=${config.tmdbApiKey}&query=${debounce}&include_adult=true`,
            ),
            fetch(
              `https://api.themoviedb.org/3/search/tv?api_key=${config.tmdbApiKey}&query=${debounce}&include_adult=true`,
            ),
          ]);
          const [movieData, tvData] = await Promise.all([
            movieRes.json(),
            tvRes.json(),
          ]);
          for (const result of movieData.results) {
            result.type = "movie";
            result.title =
              result.title ||
              result.name ||
              result.original_title ||
              result.original_name;
            result.poster_image_url = result.poster_path
              ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
              : null;
            result.backdrop_image_url = result.backdrop_path
              ? `https://image.tmdb.org/t/p/w500${result.backdrop_path}`
              : null;
          }
          for (const result of tvData.results) {
            result.type = "tv";
            result.title =
              result.title ||
              result.name ||
              result.original_title ||
              result.original_name;
            result.poster_image_url = `https://image.tmdb.org/t/p/w500${result.poster_path}`;
            result.backdrop_image_url = `https://image.tmdb.org/t/p/w500${result.backdrop_path}`;
          }
          const combinedResults = [];
          for (
            let i = 0;
            i <
            Math.max(
              movieData.results?.length || 0,
              tvData.results?.length || 0,
            );
            i++
          ) {
            if (tvData.results[i]) {
              combinedResults.push(tvData.results[i]);
            }
            if (movieData.results[i]) {
              combinedResults.push(movieData.results[i]);
            }
          }
          setSearchResults({ type: "SEARCH", value: combinedResults });
          setStatus("success");
        } catch (err) {
          console.log(err);
          setStatus("error");
        }
      };
      fn();
    }
  }, [debounce, isAnime]);
  return status;
};

const getTmdbUrl = (path) => {
  return `https://api.themoviedb.org/3${path}?api_key=${config.tmdbApiKey}`;
};

const fetchTmdbJson = async ({ path, signal }) => {
  const response = await fetch(getTmdbUrl(path), { signal });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json();
};

export const useTmdbTvDetails = ({ id, enabled = true } = {}) => {
  const [details, setDetails] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !id || !config.tmdbApiKey) {
      setDetails(null);
      setStatus("idle");
      setError(null);
      return;
    }

    const controller = new AbortController();
    const cacheKey = String(id);
    const cachedDetails = getLocalStorageCache({
      key: Constants.LocalStorageKey.TMDB_TV_DETAILS_CACHE,
      cacheKey,
    });

    if (cachedDetails) {
      setDetails(cachedDetails);
      setStatus("success");
      setError(null);
      return;
    }

    async function fetchData() {
      setStatus("loading");
      setError(null);

      try {
        const data = await fetchTmdbJson({
          path: `/tv/${id}`,
          signal: controller.signal,
        });
        setDetails(data);
        setLocalStorageCache({
          key: Constants.LocalStorageKey.TMDB_TV_DETAILS_CACHE,
          cacheKey,
          value: data,
        });
        setStatus("success");
      } catch (err) {
        if (err.name === "AbortError") return;

        console.log(err);
        setDetails(null);
        setError(err);
        setStatus("error");
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [id, enabled]);

  return { details, status, error };
};

export const useTmdbSeasonEpisodes = ({
  id,
  season,
  enabled = true,
} = {}) => {
  const [seasonEpisodes, setSeasonEpisodes] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !id || !season || !config.tmdbApiKey) {
      setSeasonEpisodes(null);
      setStatus("idle");
      setError(null);
      return;
    }

    const controller = new AbortController();
    const cacheKey = `${id}:${season}`;
    const cachedSeasonEpisodes = getLocalStorageCache({
      key: Constants.LocalStorageKey.TMDB_SEASON_EPISODES_CACHE,
      cacheKey,
    });

    if (cachedSeasonEpisodes) {
      setSeasonEpisodes(cachedSeasonEpisodes);
      setStatus("success");
      setError(null);
      return;
    }

    async function fetchData() {
      setStatus("loading");
      setError(null);

      try {
        const data = await fetchTmdbJson({
          path: `/tv/${id}/season/${season}`,
          signal: controller.signal,
        });
        setSeasonEpisodes(data);
        setLocalStorageCache({
          key: Constants.LocalStorageKey.TMDB_SEASON_EPISODES_CACHE,
          cacheKey,
          value: data,
        });
        setStatus("success");
      } catch (err) {
        if (err.name === "AbortError") return;

        console.log(err);
        setSeasonEpisodes(null);
        setError(err);
        setStatus("error");
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [id, season, enabled]);

  return { seasonEpisodes, status, error };
};
