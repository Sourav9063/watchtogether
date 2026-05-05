export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
export const MAX_TMDB_PAGE = 500;
export const PREFETCH_TMDB_PAGE_COUNT = 3;
export const BROWSE_PAGE_PREFETCH_BATCH_SIZE = 3;
export const TMDB_REVALIDATE_SECONDS = 60 * 60 * 24;

export const mediaSections = [
  {
    key: "popular-movies",
    title: "Popular Movies",
    mediaType: "movie",
    endpoint: "/movie/popular",
  },
  {
    key: "top-rated-movies",
    title: "Top Rated Movies",
    mediaType: "movie",
    endpoint: "/movie/top_rated",
  },
  {
    key: "popular-tv",
    title: "Popular TV Shows",
    mediaType: "tv",
    endpoint: "/tv/popular",
  },
  {
    key: "top-rated-tv",
    title: "Top Rated TV Shows",
    mediaType: "tv",
    endpoint: "/tv/top_rated",
  },
];

export function normalizeTmdbItem(item, mediaType, genresById) {
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

export function createTmdbBrowseKey(
  endpoint,
  mediaType,
  genreId = "",
  page = 1,
) {
  return `${endpoint}:${mediaType}:${genreId || ""}:page-${page}`;
}
