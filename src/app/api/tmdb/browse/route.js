import { fetchTmdbBrowse } from "@/components/tmdbBrowse/tmdbBrowseData";
import {
  discoverySortOptions,
  getTmdbDiscoveryParams,
  MAX_TMDB_PAGE,
} from "@/components/tmdbBrowse/tmdbBrowseConstants";

export const revalidate = 86400;

function getBoundedNumberParam(searchParams, key, min, max) {
  const rawValue = searchParams.get(key);

  if (!rawValue) {
    return "";
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    return "";
  }

  return String(Math.min(Math.max(Math.trunc(value), min), max));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "";
  const page = Math.min(
    Math.max(Number(searchParams.get("page") || 1), 1),
    MAX_TMDB_PAGE,
  );
  const genreId = searchParams.get("genreId") || "";
  const mediaType = endpoint === "/discover/tv" ? "tv" : "movie";
  const sortBy = searchParams.get("sortBy") || "";
  const allowedSortBy = new Set(
    discoverySortOptions.flatMap((option) => [
      option.movieSortBy,
      option.tvSortBy,
    ]),
  );
  const discoverFilters = {
    genreId,
    sortBy: allowedSortBy.has(sortBy) ? sortBy : "",
    voteAverageGte: getBoundedNumberParam(
      searchParams,
      "voteAverageGte",
      0,
      10,
    ),
    voteCountGte: getBoundedNumberParam(searchParams, "voteCountGte", 0, 1000),
    year: getBoundedNumberParam(searchParams, "year", 1900, 2100),
  };
  const discoverParams =
    endpoint === "/discover/movie" || endpoint === "/discover/tv"
      ? getTmdbDiscoveryParams(mediaType, discoverFilters)
      : {};
  const data = await fetchTmdbBrowse(endpoint, {
    page,
    ...discoverParams,
  });

  return Response.json(data);
}
