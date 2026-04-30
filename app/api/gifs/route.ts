import { NextRequest, NextResponse } from "next/server";

// Tenor v1 public test key — works without registration for development
const TENOR_KEY = process.env.TENOR_API_KEY || "LIVIDSEARCH";
const TENOR_BASE = "https://api.tenor.com/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q    = searchParams.get("q")    ?? "";
  const type = searchParams.get("type") ?? "gif"; // gif | sticker
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "9"), 24);

  try {
    let url: string;
    if (type === "sticker") {
      // Tenor sticker searches — search for known sticker-style terms
      const query = q || "sticker";
      url = `${TENOR_BASE}/search?q=${encodeURIComponent(query + " sticker")}&key=${TENOR_KEY}&limit=${limit}&media_filter=minimal&contentfilter=low&ar_range=all`;
    } else if (q.trim()) {
      url = `${TENOR_BASE}/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=${limit}&media_filter=minimal&contentfilter=low`;
    } else {
      url = `${TENOR_BASE}/trending?key=${TENOR_KEY}&limit=${limit}&media_filter=minimal&contentfilter=low`;
    }

    const res  = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();

    const results = (data.results ?? []).map((item: any) => {
      const media = item.media?.[0] ?? {};
      return {
        id:      item.id,
        url:     media.gif?.url     ?? media.mediumgif?.url ?? "",
        preview: media.tinygif?.url ?? media.nanogif?.url   ?? media.gif?.url ?? "",
      };
    }).filter((r: any) => r.url);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/gifs]", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
