"use client";

import TmdbCard from "@/components/TmdbSearchResults/TmdbCard";
import { Stores } from "@/helper/CONSTANTS";
import { useDragScroll } from "@/helper/hooks/useDragScroll";
import { useStore } from "@/helper/hooks/useStore";
import { use, useEffect, useMemo, useState } from "react";
import {
  BROWSE_PAGE_PREFETCH_BATCH_SIZE,
  createTmdbBrowseKey,
  discoverySortOptions,
  getDefaultDiscoveryFilters,
  getDiscoverySortBy,
  getTmdbBrowseFilterKey,
  MAX_TMDB_PAGE,
  mediaSections,
  normalizeTmdbItem,
} from "./tmdbBrowseConstants";
import styles from "./TmdbBrowse.module.css";

const browseMediaCache = new Map();
const EMPTY_DISCOVERY_FILTERS = {};
const ratingOptions = ["8", "7", "6", "5", "4", "3", "2", "1", "0"];

async function fetchBrowseMedia(
  endpoint,
  page,
  genreId,
  discoveryFilters,
  signal,
) {
  const filterKey = getTmdbBrowseFilterKey(discoveryFilters);
  const cacheKey = createTmdbBrowseKey(
    endpoint,
    "request",
    genreId,
    page,
    filterKey,
  );
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

  Object.entries(discoveryFilters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, value);
  });

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
  discoveryFilters = EMPTY_DISCOVERY_FILTERS,
}) {
  const [, setSearchResults] = useStore(Stores.searchResults);
  const [, setIframeUrl] = useStore(Stores.iframeUrl);
  const cardsRef = useDragScroll();
  const [page, setPage] = useState(1);
  const filterKey = useMemo(
    () => getTmdbBrowseFilterKey(discoveryFilters),
    [discoveryFilters],
  );
  const currentMediaKey = createTmdbBrowseKey(
    endpoint,
    mediaType,
    genreId,
    page,
    filterKey,
  );
  const initialData = initialMediaByKey[currentMediaKey];
  const initialState = useMemo(() => getSectionState(initialData), [initialData]);
  const [rawItems, setRawItems] = useState(initialState.rawItems);
  const [totalPages, setTotalPages] = useState(initialState.totalPages);
  const [status, setStatus] = useState(initialState.status);
  const [error, setError] = useState(initialState.error);

  useEffect(() => {
    setPage(1);
    if (cardsRef.current) {
      cardsRef.current.scrollLeft = 0;
    }
  }, [cardsRef, endpoint, filterKey, genreId, mediaType]);

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
          discoveryFilters,
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
  }, [
    discoveryFilters,
    endpoint,
    genreId,
    initialData,
    initialState,
    isGenreSection,
    page,
  ]);

  useEffect(() => {
    const nextPages = Array.from(
      { length: BROWSE_PAGE_PREFETCH_BATCH_SIZE - 1 },
      (_, index) => page + index + 1,
    ).filter(
      (nextPage) =>
        nextPage <= totalPages &&
        !initialMediaByKey[
          createTmdbBrowseKey(
            endpoint,
            mediaType,
            genreId,
            nextPage,
            filterKey,
          )
        ],
    );

    if (nextPages.length === 0) {
      return;
    }

    const controller = new AbortController();

    nextPages.forEach((nextPage) => {
      fetchBrowseMedia(
        endpoint,
        nextPage,
        genreId,
        discoveryFilters,
        controller.signal,
      ).catch((err) => {
        if (err.name !== "AbortError") {
          console.log(err);
        }
      });
    });

    return () => {
      controller.abort();
    };
  }, [
    discoveryFilters,
    endpoint,
    filterKey,
    genreId,
    initialMediaByKey,
    mediaType,
    page,
    totalPages,
  ]);

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
      {isGenreSection && (
        <div className={styles.genreTitleHeader}>
          <h2>{title}</h2>
        </div>
      )}
      <div className={styles.sectionHeader}>
        {!isGenreSection && (
          <div className={styles.titleBlock}>
            <h2>{title}</h2>
          </div>
        )}
        {headerActions}
      </div>

      {status === "error" && (
        <p className={styles.status}>{error?.message || "Failed to load"}</p>
      )}
      {status === "success" && items.length === 0 && (
        <p className={styles.status}>No result found</p>
      )}

      <div
        aria-busy={isGenreSection && status === "loading"}
        className={`${styles.cards} ${
          isGenreSection && status === "loading"
            ? styles.discoveryCardsLoading
            : ""
        } hoverScrollbarX dragScrollX`}
        ref={cardsRef}
      >
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

function DiscoverySection({ genres, genresById, initialMediaByKey, mediaType }) {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 31 }, (_, index) => String(currentYear - index)),
    [currentYear],
  );
  const [genreId, setGenreId] = useState("");
  const [sortKey, setSortKey] = useState("popular");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const endpoint = `/discover/${mediaType}`;
  const discoveryFilters = useMemo(
    () => ({
      ...getDefaultDiscoveryFilters(mediaType),
      sortBy: getDiscoverySortBy(mediaType, sortKey),
      voteAverageGte: rating,
      year,
    }),
    [mediaType, rating, sortKey, year],
  );

  useEffect(() => {
    setGenreId((currentGenreId) => {
      if (genres.some((genre) => String(genre.id) === currentGenreId)) {
        return currentGenreId;
      }

      return genres[0]?.id ? String(genres[0].id) : "";
    });
  }, [genres]);

  return (
    <section className={styles.genreBlock}>
      {genreId && (
        <TmdbMediaSection
          endpoint={endpoint}
          genreId={genreId}
          discoveryFilters={discoveryFilters}
          genresById={genresById}
          headerActions={
            <div className={styles.genreControls}>
              <label className={styles.genreSelect}>
                <span className={styles.discoveryControlName}>Genre</span>
                <span className={styles.discoveryControlDivider}>:</span>
                <select
                  disabled={genres.length === 0}
                  onChange={(event) => setGenreId(event.target.value)}
                  value={genreId}
                >
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.discoverySelect}>
                <span className={styles.discoveryControlName}>Order By</span>
                <span className={styles.discoveryControlDivider}>:</span>
                <select
                  onChange={(event) => setSortKey(event.target.value)}
                  value={sortKey}
                  aria-label="Order By"
                >
                  {discoverySortOptions.map((sortOption) => (
                    <option key={sortOption.key} value={sortOption.key}>
                      {sortOption.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.discoverySelect}>
                <span className={styles.discoveryControlName}>Year</span>
                <span className={styles.discoveryControlDivider}>:</span>
                <select
                  onChange={(event) => setYear(event.target.value)}
                  value={year}
                >
                  <option value="">Any year</option>
                  {yearOptions.map((yearOption) => (
                    <option key={yearOption} value={yearOption}>
                      {yearOption}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.discoverySelect}>
                <span className={styles.discoveryControlName}>Rating</span>
                <span className={styles.discoveryControlDivider}>:</span>
                <select
                  onChange={(event) => setRating(event.target.value)}
                  value={rating}
                >
                  <option value="">Any rating</option>
                  {ratingOptions.map((ratingOption) => (
                    <option key={ratingOption} value={ratingOption}>
                      {ratingOption}+ rating
                    </option>
                  ))}
                </select>
              </label>
            </div>
          }
          initialMediaByKey={initialMediaByKey}
          isGenreSection
          mediaType={mediaType}
          title={`Discover ${mediaType === "movie" ? "Movies" : "TV Shows"}`}
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
      {genres.movie.length > 0 && (
        <DiscoverySection
          genres={genres.movie}
          genresById={genresByType.movie}
          initialMediaByKey={initialMediaByKey}
          mediaType="movie"
        />
      )}
      {genres.tv.length > 0 && (
        <DiscoverySection
          genres={genres.tv}
          genresById={genresByType.tv}
          initialMediaByKey={initialMediaByKey}
          mediaType="tv"
        />
      )}
      {genres.movie.length === 0 && genres.tv.length === 0 && (
        <p className={styles.status}>Genre list failed to load</p>
      )}

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
    </div>
  );
}
