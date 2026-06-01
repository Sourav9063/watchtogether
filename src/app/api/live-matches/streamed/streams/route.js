import { NextResponse } from "next/server";

const BASE = "https://streamed.pk";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET(req) {
  const source = req.nextUrl.searchParams.get("source");
  const id = req.nextUrl.searchParams.get("id");

  if (!source || !id) {
    return NextResponse.json({ error: "Missing source or id" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BASE}/api/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
      {
        headers: { "user-agent": USER_AGENT },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
