import { NextResponse } from "next/server";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const SPORTS_KEYS = ["Soccer", "NFL", "NBA", "NHL"];

export async function GET() {
  try {
    const res = await fetch(
      "https://api.cdn-live.tv/api/v1/events/sports/?user=cdnlivetv&plan=free",
      {
        headers: { "user-agent": USER_AGENT },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const body = await res.json();
    const data = body?.["cdn-live-tv"] ?? {};
    const events = SPORTS_KEYS.flatMap((key) =>
      Array.isArray(data[key]) ? data[key] : [],
    );

    return NextResponse.json(events);
  } catch {
    return NextResponse.json([]);
  }
}
