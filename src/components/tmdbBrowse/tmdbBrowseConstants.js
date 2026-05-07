export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
export const MAX_TMDB_PAGE = 500;
export const PREFETCH_TMDB_PAGE_COUNT = 3;
export const BROWSE_PAGE_PREFETCH_BATCH_SIZE = 3;
export const TMDB_REVALIDATE_SECONDS = 60 * 60 * 24;
export const DEFAULT_DISCOVERY_SORT_KEY = "popular";
export const DEFAULT_DISCOVERY_VOTE_COUNT = "100";

export const discoverySortOptions = [
  {
    key: "popular",
    label: "Most liked",
    movieSortBy: "popularity.desc",
    tvSortBy: "popularity.desc",
  },
  {
    key: "least-popular",
    label: "Least liked",
    movieSortBy: "popularity.asc",
    tvSortBy: "popularity.asc",
  },
  {
    key: "latest",
    label: "Latest",
    movieSortBy: "primary_release_date.desc",
    tvSortBy: "first_air_date.desc",
  },
  {
    key: "oldest",
    label: "Oldest",
    movieSortBy: "primary_release_date.asc",
    tvSortBy: "first_air_date.asc",
  },
  {
    key: "rating",
    label: "Highest rating",
    movieSortBy: "vote_average.desc",
    tvSortBy: "vote_average.desc",
  },
  {
    key: "lowest-rating",
    label: "Lowest rating",
    movieSortBy: "vote_average.asc",
    tvSortBy: "vote_average.asc",
  },
  {
    key: "most-voted",
    label: "Most votes",
    movieSortBy: "vote_count.desc",
    tvSortBy: "vote_count.desc",
  },
  {
    key: "title",
    label: "Title A-Z",
    movieSortBy: "title.asc",
    tvSortBy: "name.asc",
  },
  {
    key: "title-desc",
    label: "Title Z-A",
    movieSortBy: "title.desc",
    tvSortBy: "name.desc",
  },
];

export const mediaSections = [
  // {
  //   key: "latest-movie-releases",
  //   title: "Latest Movie Releases",
  //   mediaType: "movie",
  //   endpoint: "/movie/now_playing",
  // },
  {
    key: "popular-movies",
    title: "Popular Movies",
    mediaType: "movie",
    endpoint: "/movie/popular",
  },
  // {
  //   key: "latest-tv-releases",
  //   title: "Latest TV Releases",
  //   mediaType: "tv",
  //   endpoint: "/tv/on_the_air",
  // },
  {
    key: "popular-tv",
    title: "Popular TV Shows",
    mediaType: "tv",
    endpoint: "/tv/popular",
  },
  {
    key: "top-rated-movies",
    title: "Top Rated Movies",
    mediaType: "movie",
    endpoint: "/movie/top_rated",
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

export function getDiscoverySortBy(mediaType, sortKey) {
  const sortOption =
    discoverySortOptions.find((option) => option.key === sortKey) ||
    discoverySortOptions.find(
      (option) => option.key === DEFAULT_DISCOVERY_SORT_KEY,
    );

  return mediaType === "tv" ? sortOption.tvSortBy : sortOption.movieSortBy;
}

export function getDefaultDiscoveryFilters(mediaType) {
  return {
    sortBy: getDiscoverySortBy(mediaType, DEFAULT_DISCOVERY_SORT_KEY),
    voteCountGte: DEFAULT_DISCOVERY_VOTE_COUNT,
  };
}

export function getTmdbBrowseFilterKey(filters = {}) {
  return Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([key, value]) => `${key}-${value}`)
    .join("_");
}

export function getTmdbDiscoveryParams(mediaType, filters = {}) {
  const params = {};

  if (filters.genreId) {
    params.with_genres = filters.genreId;
  }

  if (filters.sortBy) {
    params.sort_by = filters.sortBy;
  }

  if (filters.year) {
    params[mediaType === "tv" ? "first_air_date_year" : "primary_release_year"] =
      filters.year;
  }

  if (filters.voteAverageGte) {
    params["vote_average.gte"] = filters.voteAverageGte;
  }

  if (filters.voteCountGte) {
    params["vote_count.gte"] = filters.voteCountGte;
  }

  return params;
}

export function createTmdbBrowseKey(
  endpoint,
  mediaType,
  genreId = "",
  page = 1,
  filterKey = "",
) {
  const filterSegment = filterKey ? `:${filterKey}` : "";

  return `${endpoint}:${mediaType}:${genreId || ""}${filterSegment}:page-${page}`;
}
