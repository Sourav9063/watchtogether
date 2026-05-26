import { NextResponse } from "next/server";

import { getLyrics } from "@/lib/music/lyrics.server";
import { cleanText, integerParam } from "@/lib/music/validation";

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
    return NextResponse.json({
      lyrics: await getLyrics({ trackName, artistName, albumName, duration }),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load lyrics", lyrics: [] },
      { status: 502 },
    );
  }
}
