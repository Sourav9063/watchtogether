"use client";

import TmdbCard from "@/components/TmdbSearchResults/TmdbCard";
import config from "@/config";
import { Stores } from "@/helper/CONSTANTS";
import { useHorizontalScroll } from "@/helper/hooks/useHorizontalScroll";
import { useStore } from "@/helper/hooks/useStore";
import { useEffect, useMemo, useState } from "react";
import styles from "./TmdbBrowse.module.css";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const MAX_TMDB_PAGE = 500;

const mediaSections = [
  {
    title: "Popular Movies",
    mediaType: "movie",
    endpoint: "/movie/popular",
  },
  {
    title: "Top Rated Movies",
    mediaType: "movie",
    endpoint: "/movie/top_rated",
  },
  {
    title: "Popular TV Shows",
    mediaType: "tv",
    endpoint: "/tv/popular",
  },
  {
    title: "Top Rated TV Shows",
    mediaType: "tv",
    endpoint: "/tv/top_rated",
  },
];

function getTmdbUrl(endpoint, params = {}) {
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  url.searchParams.set("api_key", config.tmdbApiKey || "");
  url.searchParams.set("include_adult", "true");

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, value);
  });

  return url.toString();
}

function normalizeTmdbItem(item, mediaType, genresById) {
  const title =
    item.title || item.name || item.original_title || item.original_name;
  const poster_image_url = item.poster_path
    ? `${TMDB_IMAGE_BASE}${item.poster_path}`
    : null;
  const backdrop_image_url = item.backdrop_path
    ? `${TMDB_IMAGE_BASE}${item.backdrop_path}`
    : null;
  const genres = item.genre_ids
    ?.map((genreId) => genresById[genreId])
    .filter(Boolean)
    .map((name) => ({ name }));

  return {
    ...item,
    type: mediaType,
    title,
    poster_image_url,
    backdrop_image_url,
    genres,
  };
}

async function fetchTmdb(endpoint, params, signal) {
  const response = await fetch(getTmdbUrl(endpoint, params), { signal });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json();
}

function Pagination({ page, totalPages, onPageChange, disabled }) {
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const canGoPrevious = page > 1 && !disabled;
  const canGoNext = page < safeTotalPages && !disabled;

  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageButton}
        disabled={!canGoPrevious}
        onClick={() => onPageChange((currentPage) => currentPage - 1)}
        type="button"
      >
        Prev
      </button>
      <span className={styles.pageCount}>
        Page {page} / {safeTotalPages}
      </span>
      <button
        className={styles.pageButton}
        disabled={!canGoNext}
        onClick={() => onPageChange((currentPage) => currentPage + 1)}
        type="button"
      >
        Next
      </button>
    </div>
  );
}

function TmdbMediaSection({
  title,
  mediaType,
  endpoint,
  genresById,
  genreId,
  headerActions,
  isGenreSection = false,
}) {
  const [, setSearchResults] = useStore(Stores.searchResults);
  const [, setIframeUrl] = useStore(Stores.iframeUrl);
  const cardsRef = useHorizontalScroll();
  const [page, setPage] = useState(1);
  const [rawItems, setRawItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [endpoint, genreId, mediaType]);

  useEffect(() => {
    if (!config.tmdbApiKey) {
      setRawItems([]);
      setStatus("error");
      setError(new Error("TMDB API key missing"));
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      setStatus("loading");
      setError(null);

      try {
        const data = await fetchTmdb(
          endpoint,
          {
            page,
            with_genres: genreId,
          },
          controller.signal,
        );
        setRawItems(data.results || []);
        setTotalPages(Math.min(data.total_pages || 1, MAX_TMDB_PAGE));
        setStatus("success");
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
  }, [endpoint, genreId, mediaType, page]);

  const items = useMemo(
    () =>
      rawItems
        .map((item) => normalizeTmdbItem(item, mediaType, genresById))
        .filter((item) => item.id && (item.poster_image_url || item.backdrop_image_url)),
    [genresById, mediaType, rawItems],
  );

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
        <Pagination
          disabled={status === "loading"}
          onPageChange={setPage}
          page={page}
          totalPages={totalPages}
        />
      </div>

      {status === "error" && (
        <p className={styles.status}>{error?.message || "Failed to load"}</p>
      )}
      {status === "loading" && <p className={styles.status}>Loading...</p>}
      {status === "success" && items.length === 0 && (
        <p className={styles.status}>No result found</p>
      )}

      <div className={styles.cards} ref={cardsRef}>
        {items.map((item) => (
          <TmdbCard
            details={item}
            key={`${mediaType}-${item.id}`}
            setIframeUrl={setIframeUrl}
            setSearchResults={setSearchResults}
            showType={false}
          />
        ))}
      </div>
    </section>
  );
}

function GenreSection({ genres, genresByType }) {
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
          isGenreSection
          mediaType={mediaType}
          title={`${selectedGenre?.name || "Genre"}`}
        />
      )}
    </section>
  );
}

export default function TmdbBrowse() {
  const [genres, setGenres] = useState({ movie: [], tv: [] });
  const [genreStatus, setGenreStatus] = useState("idle");

  useEffect(() => {
    if (!config.tmdbApiKey) {
      setGenreStatus("error");
      return;
    }

    const controller = new AbortController();

    async function fetchGenres() {
      setGenreStatus("loading");

      try {
        const [movieGenres, tvGenres] = await Promise.all([
          fetchTmdb("/genre/movie/list", {}, controller.signal),
          fetchTmdb("/genre/tv/list", {}, controller.signal),
        ]);
        setGenres({
          movie: movieGenres.genres || [],
          tv: tvGenres.genres || [],
        });
        setGenreStatus("success");
      } catch (err) {
        if (err.name === "AbortError") return;

        console.log(err);
        setGenreStatus("error");
      }
    }

    fetchGenres();

    return () => {
      controller.abort();
    };
  }, []);

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
          key={section.title}
          mediaType={section.mediaType}
          title={section.title}
        />
      ))}

      {genreStatus === "error" && (
        <p className={styles.status}>Genre list failed to load</p>
      )}
      {genreStatus !== "error" && (
        <GenreSection genres={genres} genresByType={genresByType} />
      )}
    </div>
  );
}
