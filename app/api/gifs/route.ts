import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

// Priority: Giphy key → Tenor v2 (Google) key → no results with a hint
const GIPHY_KEY  = process.env.GIPHY_API_KEY;
const TENOR_KEY  = process.env.TENOR_API_KEY; // Google API key with Tenor API enabled

export async function GET(req: NextRequest) {
  // This proxy spends our Giphy/Tenor quota, so gate it behind auth and a
  // generous per-user rate limit rather than leaving it open to the world.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ results: [] }, { status: 401 });

  const rl = rateLimit(rateLimitKey("gifs", user.id, req), {
    windowMs: 60 * 1000,
    max: 40,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { results: [], error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const { searchParams } = new URL(req.url);
  const q     = (searchParams.get("q") ?? "").slice(0, 100);
  const type  = searchParams.get("type") === "sticker" ? "sticker" : "gif";
  const parsedLimit = parseInt(searchParams.get("limit") ?? "9", 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 24)
    : 9;

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
        type GiphyItem = {
          id?: string;
          images?: {
            original?: { url?: string };
            fixed_height_small?: { url?: string };
          };
        };
        const results = ((data.data ?? []) as GiphyItem[]).map((g) => ({
          id:      g.id,
          url:     g.images?.original?.url ?? "",
          preview: g.images?.fixed_height_small?.url ?? g.images?.original?.url ?? "",
        })).filter((r) => r.url);
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
        type TenorItem = {
          id?: string;
          media_formats?: {
            gif?: { url?: string };
            tinygif?: { url?: string };
          };
        };
        const results = ((data.results ?? []) as TenorItem[]).map((item) => {
          const fmt = item.media_formats ?? {};
          return {
            id:      item.id,
            url:     fmt.gif?.url     ?? "",
            preview: fmt.tinygif?.url ?? fmt.gif?.url ?? "",
          };
        }).filter((r) => r.url);
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
