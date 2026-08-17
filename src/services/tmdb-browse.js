import {
  createTmdbBrowseKey,
  getDefaultDiscoveryFilters,
  getTmdbBrowseFilterKey,
  getTmdbDiscoveryParams,
  mediaSections,
  PREFETCH_TMDB_PAGE_COUNT,
} from "@/components/tmdbBrowse/tmdbBrowseConstants";
import { getBrowse } from "@/repository/tmdb";

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

const emptyBrowseResult = (error) => ({
  error,
  results: [],
  total_pages: 1,
});

export async function fetchTmdbBrowse(endpoint, params = {}) {
  if (!isAllowedTmdbBrowseEndpoint(endpoint)) {
    return emptyBrowseResult("TMDB endpoint not allowed");
  }

  try {
    return await getBrowse(endpoint, params);
  } catch (error) {
    return emptyBrowseResult(error?.message || "TMDB request failed");
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
  const firstDiscoverGenreIds = {
    movie: genres.movie[0]?.id ? String(genres.movie[0].id) : "",
    tv: genres.tv[0]?.id ? String(genres.tv[0].id) : "",
  };
  const prefetchPages = Array.from(
    { length: PREFETCH_TMDB_PAGE_COUNT },
    (_, index) => index + 1,
  );
  const mediaRequests = mediaSections.flatMap((section) =>
    prefetchPages.map(async (page) => {
      const data = await fetchTmdbBrowse(section.endpoint, { page });
      return [
        createTmdbBrowseKey(section.endpoint, section.mediaType, "", page),
        data,
      ];
    }),
  );
  const genreRequest = Object.entries(firstDiscoverGenreIds).flatMap(
    ([mediaType, genreId]) =>
      genreId
        ? prefetchPages.map(async (page) => {
            const discoveryFilters = {
              ...getDefaultDiscoveryFilters(mediaType),
              genreId,
            };
            const endpoint = `/discover/${mediaType}`;
            const data = await fetchTmdbBrowse(endpoint, {
              page,
              ...getTmdbDiscoveryParams(mediaType, discoveryFilters),
            });

            return [
              createTmdbBrowseKey(
                endpoint,
                mediaType,
                genreId,
                page,
                getTmdbBrowseFilterKey(discoveryFilters),
              ),
              data,
            ];
          })
        : [],
  );
  const initialMediaEntries = await Promise.all([
    ...mediaRequests,
    ...genreRequest,
  ]);

  return {
    genres,
    initialMediaByKey: Object.fromEntries(initialMediaEntries.filter(Boolean)),
  };
}
