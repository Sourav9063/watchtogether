import { NextResponse } from "next/server";

import { resolveAudioTrack } from "@/lib/music/youtube-extractor.server";
import { cleanText } from "@/lib/music/validation";

export const runtime = "nodejs";

const windows = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 8;

function safeFilenamePart(value) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "track";
}

function audioExtension(contentType) {
  const type = contentType.toLowerCase();
  if (type.includes("webm")) return "webm";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  return "m4a";
}

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
      { error: "Too many download requests" },
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
    const source = await resolveAudioTrack({ id, title, artist });
    if (!source) {
      return NextResponse.json(
        { error: "No downloadable audio source found" },
        { status: 404 },
      );
    }
    const media = await fetch(source.audioUrl, {
      cache: "no-store",
      headers: { Accept: "audio/*,*/*;q=0.8" },
    });
    if (!media.ok || !media.body) {
      return NextResponse.json(
        { error: "Unable to retrieve downloadable audio" },
        { status: 502 },
      );
    }
    const contentType = media.headers.get("content-type") || "audio/mp4";
    const filename = `${safeFilenamePart(title)}-${safeFilenamePart(artist)}.${audioExtension(contentType)}`;
    const asciiFilename = filename.replace(/[^\x20-\x7e]/g, "_");
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type": contentType,
      "X-Music-Filename": encodeURIComponent(filename),
    });
    const length = media.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    return new Response(media.body, { headers });
  } catch {
    return NextResponse.json(
      { error: "Unable to download audio" },
      { status: 502 },
    );
  }
}
