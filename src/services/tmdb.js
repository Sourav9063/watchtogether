import {
  getExternalIds,
  getMediaDetails,
  getTvDetails,
  getTvSeason,
  searchMovies,
  searchTvShows,
} from "@/repository/tmdb";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const MEDIA_TYPES = new Set(["movie", "tv"]);

const requireMediaType = (type) => {
  if (!MEDIA_TYPES.has(type)) {
    throw new Error(`Unsupported TMDB media type: ${type}`);
  }

  return type;
};

const toImageUrl = (path) => (path ? `${TMDB_IMAGE_BASE}${path}` : null);

const mapSearchResult = (result, type) => ({
  ...result,
  type,
  title:
    result.title ||
    result.name ||
    result.original_title ||
    result.original_name,
  poster_image_url: toImageUrl(result.poster_path),
  backdrop_image_url: toImageUrl(result.backdrop_path),
});

/**
 * Interleaves tv and movie hits so both media types stay visible in the list.
 */
const interleave = (tvResults, movieResults) => {
  const combined = [];

  for (let i = 0; i < Math.max(tvResults.length, movieResults.length); i++) {
    if (tvResults[i]) combined.push(tvResults[i]);
    if (movieResults[i]) combined.push(movieResults[i]);
  }

  return combined;
};

export const searchTmdbMedia = async (query) => {
  const search = typeof query === "string" ? query.trim() : "";

  if (!search) return [];

  const [movieData, tvData] = await Promise.all([
    searchMovies(search),
    searchTvShows(search),
  ]);

  const movieResults = (movieData?.results ?? []).map((result) =>
    mapSearchResult(result, "movie"),
  );
  const tvResults = (tvData?.results ?? []).map((result) =>
    mapSearchResult(result, "tv"),
  );

  return interleave(tvResults, movieResults);
};

export const getTmdbTvDetails = async (id) => {
  if (!id) {
    throw new Error("TMDB tv id is required");
  }

  return getTvDetails(id);
};

export const getTmdbMediaDetails = async (type, id) => {
  if (!id) {
    throw new Error("TMDB id is required");
  }

  return getMediaDetails(requireMediaType(type), id);
};

/**
 * Resolves details for many ids at once, keyed by TMDB id. Individual failures
 * are dropped so one bad id cannot empty the whole list.
 */
export const getTmdbMediaDetailsMap = async (type, ids = []) => {
  // Listings mix media types, so an unsupported one yields no details instead
  // of failing the whole list.
  if (!MEDIA_TYPES.has(type)) return {};

  const mediaType = type;
  const uniqueIds = [...new Set(ids.filter(Boolean).map(String))];

  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        return await getMediaDetails(mediaType, id);
      } catch {
        return null;
      }
    }),
  );

  return results.reduce((acc, details) => {
    if (!details?.id) return acc;
    acc[details.id] = details;
    return acc;
  }, {});
};

export const getTmdbImdbId = async (type, id) => {
  if (!id) {
    throw new Error("TMDB id is required");
  }

  const data = await getExternalIds(requireMediaType(type), id);

  return data?.imdb_id || "";
};

export const getTmdbSeasonEpisodes = async (id, season) => {
  if (!id) {
    throw new Error("TMDB tv id is required");
  }

  if (season === undefined || season === null || season === "") {
    throw new Error("TMDB season number is required");
  }

  return getTvSeason(id, season);
};
