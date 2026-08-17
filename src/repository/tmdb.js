import "server-only";

import { createApiRequest } from "@/lib/utils/api-request";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const SEARCH_REVALIDATE_SECONDS = 60 * 60;
const DETAILS_REVALIDATE_SECONDS = 60 * 60 * 24;
const BROWSE_REVALIDATE_SECONDS = 60 * 60 * 24;

const getApiKey = () => process.env.PERSONAL_tmdb_api_key || "";

const tmdbApiRequest = createApiRequest({
  baseUrl: TMDB_API_BASE,
  // Resolved per request so the key is never captured at module load.
  query: () => ({ api_key: getApiKey() }),
});

const requireApiKey = () => {
  if (!getApiKey()) {
    throw new Error("TMDB API key missing");
  }
};

export const searchMovies = (query) => {
  requireApiKey();
  return tmdbApiRequest.GET("search/movie", {
    query: { query, include_adult: "true" },
    next: { revalidate: SEARCH_REVALIDATE_SECONDS, tags: ["tmdb-search"] },
  });
};

export const searchTvShows = (query) => {
  requireApiKey();
  return tmdbApiRequest.GET("search/tv", {
    query: { query, include_adult: "true" },
    next: { revalidate: SEARCH_REVALIDATE_SECONDS, tags: ["tmdb-search"] },
  });
};

export const getMediaDetails = (type, id) => {
  requireApiKey();
  return tmdbApiRequest.GET(`${type}/${id}`, {
    next: { revalidate: DETAILS_REVALIDATE_SECONDS, tags: [`tmdb-${type}`] },
  });
};

export const getTvDetails = (id) => getMediaDetails("tv", id);

export const getTvSeason = (id, season) => {
  requireApiKey();
  return tmdbApiRequest.GET(`tv/${id}/season/${season}`, {
    next: { revalidate: DETAILS_REVALIDATE_SECONDS, tags: ["tmdb-tv"] },
  });
};

export const getExternalIds = (type, id) => {
  requireApiKey();
  return tmdbApiRequest.GET(`${type}/${id}/external_ids`, {
    next: { revalidate: DETAILS_REVALIDATE_SECONDS, tags: ["tmdb-external"] },
  });
};

/**
 * @param {string} endpoint TMDB path with leading slash, e.g. `/discover/movie`.
 */
export const getBrowse = (endpoint, params = {}) => {
  requireApiKey();
  return tmdbApiRequest.GET(endpoint.replace(/^\//, ""), {
    query: { include_adult: "true", ...params },
    next: { revalidate: BROWSE_REVALIDATE_SECONDS, tags: ["tmdb-browse"] },
  });
};
