"use client";

import TmdbCard from "@/components/TmdbSearchResults/TmdbCard";
import { Stores } from "@/helper/CONSTANTS";
import { useHorizontalScroll } from "@/helper/hooks/useHorizontalScroll";
import { useStore } from "@/helper/hooks/useStore";
import { use, useEffect, useMemo, useState } from "react";
import {
  BROWSE_PAGE_PREFETCH_BATCH_SIZE,
  createTmdbBrowseKey,
  MAX_TMDB_PAGE,
  mediaSections,
  normalizeTmdbItem,
} from "./tmdbBrowseConstants";
import styles from "./TmdbBrowse.module.css";

const browseMediaCache = new Map();

async function fetchBrowseMedia(endpoint, page, genreId, signal) {
  const cacheKey = createTmdbBrowseKey(endpoint, "request", genreId, page);
  const cachedData = browseMediaCache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const searchParams = new URLSearchParams({
    endpoint,
    page: String(page),
  });

  if (genreId) {
    searchParams.set("genreId", genreId);
  }

  const response = await fetch(`/api/tmdb/browse?${searchParams}`, { signal });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  const data = await response.json();
  browseMediaCache.set(cacheKey, data);

  return data;
}

function getSectionState(data) {
  return {
    error: data?.error ? new Error(data.error) : null,
    rawItems: data?.results || [],
    status: data?.error ? "error" : "success",
    totalPages: Math.min(data?.total_pages || 1, MAX_TMDB_PAGE),
  };
}

function PageButtonIcon({ direction }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={styles.loadMoreIcon}
    >
      <path
        d={
          direction === "previous"
            ? "M15 18L9 12L15 6"
            : "M9 6L15 12L9 18"
        }
      />
    </svg>
  );
}

function TmdbMediaSection({
  title,
  mediaType,
  endpoint,
  genresById,
  genreId,
  headerActions,
  initialMediaByKey,
  isGenreSection = false,
}) {
  const [, setSearchResults] = useStore(Stores.searchResults);
  const [, setIframeUrl] = useStore(Stores.iframeUrl);
  const cardsRef = useHorizontalScroll();
  const [page, setPage] = useState(1);
  const initialData =
    initialMediaByKey[
      createTmdbBrowseKey(endpoint, mediaType, genreId, page)
    ];
  const initialState = useMemo(() => getSectionState(initialData), [initialData]);
  const [rawItems, setRawItems] = useState(initialState.rawItems);
  const [totalPages, setTotalPages] = useState(initialState.totalPages);
  const [status, setStatus] = useState(initialState.status);
  const [error, setError] = useState(initialState.error);

  useEffect(() => {
    setPage(1);
  }, [endpoint, genreId, mediaType]);

  useEffect(() => {
    if (initialData) {
      setRawItems(initialState.rawItems);
      setTotalPages(initialState.totalPages);
      setStatus(initialState.status);
      setError(initialState.error);
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      setStatus("loading");
      setError(null);

      try {
        const data = await fetchBrowseMedia(
          endpoint,
          page,
          genreId,
          controller.signal,
        );
        const nextState = getSectionState(data);
        setRawItems(nextState.rawItems);
        setTotalPages(nextState.totalPages);
        setStatus(nextState.status);
        setError(nextState.error);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.log(err);
        setRawItems([]);
        setError(err);
        setStatus("error");
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [endpoint, genreId, initialData, initialState, page]);

  useEffect(() => {
    if (page % BROWSE_PAGE_PREFETCH_BATCH_SIZE !== 0) {
      return;
    }

    const nextPages = Array.from(
      { length: BROWSE_PAGE_PREFETCH_BATCH_SIZE },
      (_, index) => page + index + 1,
    ).filter((nextPage) => nextPage <= totalPages);
    const controller = new AbortController();

    nextPages.forEach((nextPage) => {
      fetchBrowseMedia(endpoint, nextPage, genreId, controller.signal).catch(
        (err) => {
          if (err.name !== "AbortError") {
            console.log(err);
          }
        },
      );
    });

    return () => {
      controller.abort();
    };
  }, [endpoint, genreId, page, totalPages]);

  const items = useMemo(
    () =>
      rawItems
        .map((item) => normalizeTmdbItem(item, mediaType, genresById))
        .filter(
          (item) => item.id && (item.poster_image_url || item.backdrop_image_url),
        ),
    [genresById, mediaType, rawItems],
  );
  const canLoadPreviousPage = page > 1;
  const canLoadNextPage = page < Math.max(totalPages || 1, 1);
  const isLoading = status === "loading";

  function handleLoadPreviousPage() {
    if (!canLoadPreviousPage || isLoading) return;

    setPage((currentPage) => currentPage - 1);
    cardsRef.current?.scrollTo({
      left: 0,
      behavior: "smooth",
    });
  }

  function handleLoadNextPage() {
    if (!canLoadNextPage || isLoading) return;

    setPage((currentPage) => currentPage + 1);
    cardsRef.current?.scrollTo({
      left: 0,
      behavior: "smooth",
    });
  }

  return (
    <section
      className={`${styles.section} ${
        isGenreSection ? styles.genreSection : ""
      }`}
    >
      <div className={styles.sectionHeader}>
        <div className={styles.titleBlock}>
          <h2>{title}</h2>
        </div>
        {headerActions}
      </div>

      {status === "error" && (
        <p className={styles.status}>{error?.message || "Failed to load"}</p>
      )}
      {status === "success" && items.length === 0 && (
        <p className={styles.status}>No result found</p>
      )}

      <div className={styles.cards} ref={cardsRef}>
        {canLoadPreviousPage && (
          <button
            aria-label={`Load page ${page - 1} of ${title}`}
            className={styles.loadMoreCard}
            disabled={isLoading}
            onClick={handleLoadPreviousPage}
            type="button"
          >
            <span>Previous</span>
            <PageButtonIcon direction="previous" />
            <small>
              Page {page - 1} of {totalPages}
            </small>
          </button>
        )}
        {items.map((item) => (
          <TmdbCard
            details={item}
            key={`${mediaType}-${item.id}`}
            setIframeUrl={setIframeUrl}
            setSearchResults={setSearchResults}
            showType={false}
          />
        ))}
        {canLoadNextPage && (
          <button
            aria-label={`Load page ${page + 1} of ${title}`}
            className={styles.loadMoreCard}
            disabled={isLoading}
            onClick={handleLoadNextPage}
            type="button"
          >
            <span>Next</span>
            <PageButtonIcon direction="next" />
            <small>
              Page {page + 1} of {totalPages}
            </small>
          </button>
        )}
      </div>
    </section>
  );
}

function GenreSection({ genres, genresByType, initialMediaByKey }) {
  const [mediaType, setMediaType] = useState("movie");
  const activeGenres = useMemo(
    () => genres[mediaType] || [],
    [genres, mediaType],
  );
  const [genreId, setGenreId] = useState("");
  const selectedGenre = activeGenres.find(
    (genre) => String(genre.id) === genreId,
  );
  const endpoint = `/discover/${mediaType}`;
  useEffect(() => {
    setGenreId((currentGenreId) => {
      if (activeGenres.some((genre) => String(genre.id) === currentGenreId)) {
        return currentGenreId;
      }

      return activeGenres[0]?.id ? String(activeGenres[0].id) : "";
    });
  }, [activeGenres]);

  return (
    <section className={styles.genreBlock}>
      {genreId && (
        <TmdbMediaSection
          endpoint={endpoint}
          genreId={genreId}
          genresById={genresByType[mediaType]}
          headerActions={
            <div className={styles.genreControls}>
              <div className={styles.mediaToggle} aria-label="Genre media type">
                <button
                  className={mediaType === "movie" ? styles.activeToggle : ""}
                  onClick={() => setMediaType("movie")}
                  type="button"
                >
                  Movies
                </button>
                <button
                  className={mediaType === "tv" ? styles.activeToggle : ""}
                  onClick={() => setMediaType("tv")}
                  type="button"
                >
                  TV Shows
                </button>
              </div>

              <label className={styles.genreSelect}>
                <span>Genre</span>
                <select
                  disabled={activeGenres.length === 0}
                  onChange={(event) => setGenreId(event.target.value)}
                  value={genreId}
                >
                  {activeGenres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          }
          initialMediaByKey={initialMediaByKey}
          isGenreSection
          mediaType={mediaType}
          title={`${selectedGenre?.name || "Genre"}`}
        />
      )}
    </section>
  );
}

export default function TmdbBrowseClient({ initialDataPromise }) {
  const { genres, initialMediaByKey } = use(initialDataPromise);
  const genresByType = useMemo(
    () => ({
      movie: Object.fromEntries(
        genres.movie.map((genre) => [genre.id, genre.name]),
      ),
      tv: Object.fromEntries(genres.tv.map((genre) => [genre.id, genre.name])),
    }),
    [genres],
  );

  return (
    <div className={styles.browse}>
      {mediaSections.map((section) => (
        <TmdbMediaSection
          endpoint={section.endpoint}
          genresById={genresByType[section.mediaType]}
          initialMediaByKey={initialMediaByKey}
          key={section.key}
          mediaType={section.mediaType}
          title={section.title}
        />
      ))}

      {(genres.movie.length > 0 || genres.tv.length > 0) && (
        <GenreSection
          genres={genres}
          genresByType={genresByType}
          initialMediaByKey={initialMediaByKey}
        />
      )}
      {genres.movie.length === 0 && genres.tv.length === 0 && (
        <p className={styles.status}>Genre list failed to load</p>
      )}
    </div>
  );
}
