import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { getRelatedTracks } from "@/lib/music/catalog.server";
import { numericId } from "@/lib/music/validation";

const CACHE_CONTROL = "public, max-age=600, s-maxage=600";
const getCachedRelatedTracks = unstable_cache(
  async (trackId) => getRelatedTracks(trackId),
  ["music-related"],
  { revalidate: 600, tags: ["music-related"] },
);

export async function GET(_request, { params }) {
  const { trackId } = await params;
  const id = numericId(trackId);
  if (!id) {
    return NextResponse.json({ error: "Invalid track id" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      { tracks: await getCachedRelatedTracks(id) },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load related music" },
      { status: 502 },
    );
  }
}
