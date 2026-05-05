import config from "@/config";
import {
  createTmdbBrowseKey,
  mediaSections,
  TMDB_REVALIDATE_SECONDS,
} from "./tmdbBrowseConstants";

export const TMDB_API_BASE = "https://api.themoviedb.org/3";

const allowedEndpoints = new Set([
  ...mediaSections.map((section) => section.endpoint),
  "/genre/movie/list",
  "/genre/tv/list",
  "/discover/movie",
  "/discover/tv",
]);

export function isAllowedTmdbBrowseEndpoint(endpoint) {
  return allowedEndpoints.has(endpoint);
}

export function getTmdbUrl(endpoint, params = {}) {
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  url.searchParams.set("api_key", config.tmdbApiKey || "");
  url.searchParams.set("include_adult", "true");

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, value);
  });

  return url.toString();
}

export async function fetchTmdbBrowse(endpoint, params = {}) {
  if (!config.tmdbApiKey) {
    return {
      error: "TMDB API key missing",
      results: [],
      total_pages: 1,
    };
  }

  if (!isAllowedTmdbBrowseEndpoint(endpoint)) {
    return {
      error: "TMDB endpoint not allowed",
      results: [],
      total_pages: 1,
    };
  }

  try {
    const response = await fetch(getTmdbUrl(endpoint, params), {
      next: { revalidate: TMDB_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return {
        error: `TMDB request failed: ${response.status}`,
        results: [],
        total_pages: 1,
      };
    }

    return response.json();
  } catch (error) {
    return {
      error: error?.message || "TMDB request failed",
      results: [],
      total_pages: 1,
    };
  }
}

export async function getTmdbBrowseInitialData() {
  const [movieGenres, tvGenres] = await Promise.all([
    fetchTmdbBrowse("/genre/movie/list"),
    fetchTmdbBrowse("/genre/tv/list"),
  ]);
  const genres = {
    movie: movieGenres.genres || [],
    tv: tvGenres.genres || [],
  };
  const firstMovieGenreId = genres.movie[0]?.id ? String(genres.movie[0].id) : "";
  const mediaRequests = mediaSections.map(async (section) => {
    const data = await fetchTmdbBrowse(section.endpoint, { page: 1 });
    return [
      createTmdbBrowseKey(section.endpoint, section.mediaType),
      data,
    ];
  });
  const genreRequest = firstMovieGenreId
    ? fetchTmdbBrowse("/discover/movie", {
        page: 1,
        with_genres: firstMovieGenreId,
      }).then((data) => [
        createTmdbBrowseKey("/discover/movie", "movie", firstMovieGenreId),
        data,
      ])
    : Promise.resolve(null);
  const initialMediaEntries = await Promise.all([
    ...mediaRequests,
    genreRequest,
  ]);

  return {
    genres,
    initialMediaByKey: Object.fromEntries(initialMediaEntries.filter(Boolean)),
  };
}
