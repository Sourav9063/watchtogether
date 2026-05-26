import { NextResponse } from "next/server";

import { getAlbum } from "@/lib/music/catalog.server";
import { numericId } from "@/lib/music/validation";

export async function GET(_request, { params }) {
  const { albumId } = await params;
  const id = numericId(albumId);
  if (!id) {
    return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getAlbum(id));
  } catch {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }
}
