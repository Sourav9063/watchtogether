import { fetchTmdbBrowse } from "@/components/tmdbBrowse/tmdbBrowseData";
import { MAX_TMDB_PAGE } from "@/components/tmdbBrowse/tmdbBrowseConstants";

export const revalidate = 86400;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "";
  const page = Math.min(
    Math.max(Number(searchParams.get("page") || 1), 1),
    MAX_TMDB_PAGE,
  );
  const genreId = searchParams.get("genreId") || "";
  const data = await fetchTmdbBrowse(endpoint, {
    page,
    with_genres: genreId,
  });

  return Response.json(data);
}
