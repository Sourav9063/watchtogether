import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { getTrendingTracks } from "@/lib/music/catalog.server";
import { integerParam } from "@/lib/music/validation";

const CACHE_CONTROL = "public, max-age=86400, s-maxage=86400";
const getCachedTrendingTracks = unstable_cache(
  async (index, limit) => getTrendingTracks(index, limit),
  ["music-trending"],
  { revalidate: 86400, tags: ["music-trending"] },
);

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const index = integerParam(params.get("index"), 0, 0, 10000);
  const limit = integerParam(params.get("limit"), 20, 1, 20);
  if (index === null || limit === null) {
    return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
  }
  try {
    const tracks = await getCachedTrendingTracks(index, limit);
    return NextResponse.json(
      { tracks, index, limit },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load trending music" },
      { status: 502 },
    );
  }
}
