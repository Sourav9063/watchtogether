import { NextResponse } from "next/server";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.cdn-live.tv/api/v1/channels/?user=cdnlivetv&plan=free",
      {
        headers: { "user-agent": USER_AGENT },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const body = await res.json();
    return NextResponse.json(Array.isArray(body?.channels) ? body.channels : []);
  } catch {
    return NextResponse.json([]);
  }
}
