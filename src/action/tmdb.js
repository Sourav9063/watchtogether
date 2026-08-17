"use server";

import { createAction } from "@/lib/create-action";
import {
  getTmdbImdbId,
  getTmdbMediaDetails,
  getTmdbMediaDetailsMap,
  getTmdbRecommendations,
  getTmdbSeasonEpisodes,
  getTmdbTvDetails,
  searchTmdbMedia,
} from "@/services/tmdb";

export const searchTmdb = createAction.public(async (rawQuery) => {
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  return searchTmdbMedia(query);
});

export const getTvDetailsAction = createAction.public(async (rawId) => {
  return getTmdbTvDetails(String(rawId ?? ""));
});

export const getSeasonEpisodesAction = createAction.public(
  async (rawId, rawSeason) => {
    return getTmdbSeasonEpisodes(String(rawId ?? ""), String(rawSeason ?? ""));
  },
);

export const getMediaDetailsAction = createAction.public(
  async (rawType, rawId) => {
    return getTmdbMediaDetails(String(rawType ?? ""), String(rawId ?? ""));
  },
);

export const getMediaDetailsMapAction = createAction.public(
  async (rawType, rawIds) => {
    const ids = Array.isArray(rawIds) ? rawIds : [];
    return getTmdbMediaDetailsMap(String(rawType ?? ""), ids);
  },
);

export const getRecommendationsAction = createAction.public(
  async (rawType, rawId) => {
    const type = String(rawType ?? "");
    const tmdbType = type === "movie" ? "movie" : "tv";
    const resultType = type === "anime" ? "anime" : tmdbType;

    return getTmdbRecommendations(tmdbType, String(rawId ?? ""), resultType);
  },
);

export const getImdbIdAction = createAction.public(async (rawType, rawId) => {
  return getTmdbImdbId(String(rawType ?? ""), String(rawId ?? ""));
});
