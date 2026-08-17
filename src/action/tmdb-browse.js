"use server";

import { createAction } from "@/lib/create-action";
import {
  fetchTmdbBrowse,
  getTmdbBrowseInitialData,
} from "@/services/tmdb-browse";

export const browseTmdb = createAction.public(async (endpoint, params = {}) => {
  return fetchTmdbBrowse(String(endpoint ?? ""), params);
});

export const getBrowseInitialDataAction = createAction.public(async () => {
  return getTmdbBrowseInitialData();
});
