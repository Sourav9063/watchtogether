import { NextResponse } from "next/server";

import { searchMusic } from "@/lib/music/catalog.server";
import { cleanText } from "@/lib/music/validation";

export async function GET(request) {
  const query = cleanText(new URL(request.url).searchParams.get("q"), { max: 120 });
  if (!query) {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await searchMusic(query));
  } catch {
    return NextResponse.json(
      { error: "Unable to search music" },
      { status: 502 },
    );
  }
}
