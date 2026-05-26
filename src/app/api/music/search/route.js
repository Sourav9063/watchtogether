import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { searchMusic } from "@/lib/music/catalog.server";
import { cleanText } from "@/lib/music/validation";

const CACHE_CONTROL = "public, max-age=600, s-maxage=600";
const getCachedSearchResults = unstable_cache(
  async (query) => searchMusic(query),
  ["music-search"],
  { revalidate: 600, tags: ["music-search"] },
);

export async function GET(request) {
  const query = cleanText(new URL(request.url).searchParams.get("q"), { max: 120 });
  if (!query) {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getCachedSearchResults(query), {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to search music" },
      { status: 502 },
    );
  }
}
