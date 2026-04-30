import { NextRequest, NextResponse } from "next/server";

// Priority: Giphy key → Tenor v2 (Google) key → no results with a hint
const GIPHY_KEY  = process.env.GIPHY_API_KEY;
const TENOR_KEY  = process.env.TENOR_API_KEY; // Google API key with Tenor API enabled

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q     = searchParams.get("q")    ?? "";
  const type  = searchParams.get("type") ?? "gif";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "9"), 24);

  // ── Giphy (recommended — free key at developers.giphy.com) ──────────────
  if (GIPHY_KEY) {
    try {
      let url: string;
      if (type === "sticker") {
        url = q.trim()
          ? `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=pg-13`
          : `https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=pg-13`;
      } else {
        url = q.trim()
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=pg-13`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=pg-13`;
      }
      const res  = await fetch(url, { next: { revalidate: 60 } });
      const data = await res.json();
      if (data.meta?.status === 200) {
        const results = (data.data ?? []).map((g: any) => ({
          id:      g.id,
          url:     g.images?.original?.url ?? "",
          preview: g.images?.fixed_height_small?.url ?? g.images?.original?.url ?? "",
        })).filter((r: any) => r.url);
        return NextResponse.json({ results, provider: "giphy" });
      }
    } catch (e) {
      console.error("[/api/gifs] Giphy error:", e);
    }
  }

  // ── Tenor v2 (enable at console.cloud.google.com → Tenor API) ───────────
  if (TENOR_KEY) {
    try {
      const base = "https://tenor.googleapis.com/v2";
      const stickerQ = type === "sticker" ? (q || "cute") : q;
      const url = stickerQ.trim()
        ? `${base}/search?q=${encodeURIComponent(stickerQ)}&key=${TENOR_KEY}&limit=${limit}&client_key=uniconnect&media_filter=gif,tinygif`
        : `${base}/featured?key=${TENOR_KEY}&limit=${limit}&client_key=uniconnect&media_filter=gif,tinygif`;
      const res  = await fetch(url, { next: { revalidate: 60 } });
      const data = await res.json();
      if (!data.error) {
        const results = (data.results ?? []).map((item: any) => {
          const fmt = item.media_formats ?? {};
          return {
            id:      item.id,
            url:     fmt.gif?.url     ?? "",
            preview: fmt.tinygif?.url ?? fmt.gif?.url ?? "",
          };
        }).filter((r: any) => r.url);
        return NextResponse.json({ results, provider: "tenor" });
      }
    } catch (e) {
      console.error("[/api/gifs] Tenor error:", e);
    }
  }

  // ── No key configured ────────────────────────────────────────────────────
  return NextResponse.json({
    results: [],
    setup_required: true,
    message: "Add GIPHY_API_KEY to .env.local (free at developers.giphy.com) or enable the Tenor API in your Google Cloud project and add TENOR_API_KEY.",
  });
}
