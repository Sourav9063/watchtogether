import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { getAlbum } from "@/lib/music/catalog.server";
import { numericId } from "@/lib/music/validation";

const CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, immutable";
const getCachedAlbum = unstable_cache(
  async (albumId) => getAlbum(albumId),
  ["music-album"],
  { revalidate: false, tags: ["music-album"] },
);

export async function GET(_request, { params }) {
  const { albumId } = await params;
  const id = numericId(albumId);
  if (!id) {
    return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getCachedAlbum(id), {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }
}
