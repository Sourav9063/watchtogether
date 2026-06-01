import { NextResponse } from "next/server";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET() {
  try {
    const res = await fetch("https://old.ppv.to/api/streams", {
      headers: { "user-agent": USER_AGENT },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const body = await res.json();
    const categories = Array.isArray(body?.streams) ? body.streams : [];
    const streams = categories.flatMap((category) => {
      const categoryStreams = Array.isArray(category?.streams)
        ? category.streams
        : [];
      const categoryName =
        category?.category_name || category?.name || category?.title || "PPV";

      return categoryStreams.map((stream) => ({
        ...stream,
        _categoryName: categoryName,
      }));
    });

    return NextResponse.json(streams);
  } catch {
    return NextResponse.json([]);
  }
}
