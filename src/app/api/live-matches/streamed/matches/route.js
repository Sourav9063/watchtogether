import { NextResponse } from "next/server";

const BASE = "https://streamed.pk";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MODE_TO_ENDPOINT = {
  live: "/api/matches/live",
  today: "/api/matches/all-today",
  all: "/api/matches/all",
};

export async function GET(req) {
  const mode = req.nextUrl.searchParams.get("mode") ?? "live";
  const endpoint = MODE_TO_ENDPOINT[mode] ?? MODE_TO_ENDPOINT.live;

  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      headers: { "user-agent": USER_AGENT },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
