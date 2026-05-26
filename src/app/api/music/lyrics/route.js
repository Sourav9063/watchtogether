import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { getLyrics } from "@/lib/music/lyrics.server";
import { cleanText, integerParam } from "@/lib/music/validation";

const CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, immutable";
const getCachedLyrics = unstable_cache(
  async (trackName, artistName, albumName, duration) =>
    getLyrics({ trackName, artistName, albumName, duration }),
  ["music-lyrics"],
  { revalidate: false, tags: ["music-lyrics"] },
);

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const trackName = cleanText(params.get("trackName"), { max: 180 });
  const artistName = cleanText(params.get("artistName"), { max: 180 });
  const albumName = cleanText(params.get("albumName"), {
    max: 180,
    required: false,
  });
  const duration = integerParam(params.get("duration"), 0, 0, 86400);
  if (!trackName || !artistName || albumName === null || duration === null) {
    return NextResponse.json({ error: "Invalid lyrics query" }, { status: 400 });
  }
  try {
    const lyrics = await getCachedLyrics(
      trackName,
      artistName,
      albumName,
      duration,
    );
    return NextResponse.json(
      { lyrics },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load lyrics", lyrics: [] },
      { status: 502 },
    );
  }
}
