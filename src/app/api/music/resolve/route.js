import { NextResponse } from "next/server";

import { resolveAudioTrack } from "@/lib/music/youtube-extractor.server";
import { cleanText } from "@/lib/music/validation";

const windows = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 20;

function acceptRequest(request) {
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const now = Date.now();
  const current = windows.get(address);
  if (!current || current.resetAt <= now) {
    windows.set(address, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT;
}

export async function POST(request) {
  if (!acceptRequest(request)) {
    return NextResponse.json(
      { error: "Too many playback resolution requests" },
      { status: 429 },
    );
  }
  let input;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const id = cleanText(input?.id, { max: 40 });
  const title = cleanText(input?.title, { max: 180 });
  const artist = cleanText(input?.artist, { max: 180 });
  if (!id || !title || !artist) {
    return NextResponse.json({ error: "Invalid track metadata" }, { status: 400 });
  }
  try {
    const source = await resolveAudioTrack(
      { id, title, artist },
      input?.refresh === true,
    );
    if (!source) {
      return NextResponse.json(
        { error: "No playable audio source found" },
        { status: 404 },
      );
    }
    return NextResponse.json(source);
  } catch {
    return NextResponse.json(
      { error: "Unable to resolve audio source" },
      { status: 502 },
    );
  }
}
