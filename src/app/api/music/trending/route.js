import { NextResponse } from "next/server";

import { getTrendingTracks } from "@/lib/music/catalog.server";
import { integerParam } from "@/lib/music/validation";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const index = integerParam(params.get("index"), 0, 0, 10000);
  const limit = integerParam(params.get("limit"), 20, 1, 20);
  if (index === null || limit === null) {
    return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
  }
  try {
    const tracks = await getTrendingTracks(index, limit);
    return NextResponse.json({ tracks, index, limit });
  } catch {
    return NextResponse.json(
      { error: "Unable to load trending music" },
      { status: 502 },
    );
  }
}
