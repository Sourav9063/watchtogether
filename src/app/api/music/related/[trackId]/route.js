import { NextResponse } from "next/server";

import { getRelatedTracks } from "@/lib/music/catalog.server";
import { numericId } from "@/lib/music/validation";

export async function GET(_request, { params }) {
  const { trackId } = await params;
  const id = numericId(trackId);
  if (!id) {
    return NextResponse.json({ error: "Invalid track id" }, { status: 400 });
  }
  try {
    return NextResponse.json({ tracks: await getRelatedTracks(id) });
  } catch {
    return NextResponse.json(
      { error: "Unable to load related music" },
      { status: 502 },
    );
  }
}
