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
import {
  getSeasonEpisodesAction,
  getTvDetailsAction,
  searchTmdb,
} from "@/action/tmdb";

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
        const result = await searchTmdb(debounce);

        if (!result.success) {
          setStatus("error");
          return;
        }

        setSearchResults({ type: "SEARCH", value: result.data || [] });
        setStatus("success");
      };
      fn();
    }
  }, [debounce, isAnime]);
  return status;
};

export const useTmdbTvDetails = ({ id, enabled = true } = {}) => {
  const [details, setDetails] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !id) {
      setDetails(null);
      setStatus("idle");
      setError(null);
      return;
    }

    let cancelled = false;
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

      const result = await getTvDetailsAction(id);

      if (cancelled) return;

      if (!result.success) {
        setDetails(null);
        setError(result.error);
        setStatus("error");
        return;
      }

      setDetails(result.data);
      setLocalStorageCache({
        key: Constants.LocalStorageKey.TMDB_TV_DETAILS_CACHE,
        cacheKey,
        value: result.data,
      });
      setStatus("success");
    }

    fetchData();

    return () => {
      cancelled = true;
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
    if (!enabled || !id || !season) {
      setSeasonEpisodes(null);
      setStatus("idle");
      setError(null);
      return;
    }

    let cancelled = false;
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

      const result = await getSeasonEpisodesAction(id, season);

      if (cancelled) return;

      if (!result.success) {
        setSeasonEpisodes(null);
        setError(result.error);
        setStatus("error");
        return;
      }

      setSeasonEpisodes(result.data);
      setLocalStorageCache({
        key: Constants.LocalStorageKey.TMDB_SEASON_EPISODES_CACHE,
        cacheKey,
        value: result.data,
      });
      setStatus("success");
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, season, enabled]);

  return { seasonEpisodes, status, error };
};
