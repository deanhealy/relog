import { NextRequest, NextResponse } from "next/server";
import { searchTmdb, TmdbError } from "@/lib/api/tmdb";
import { searchRawg } from "@/lib/api/rawg";
import { searchGoogleBooks } from "@/lib/api/googlebooks";
import type { MediaType, SearchResult } from "@/lib/types";

const VALID = new Set<MediaType>(["film", "tv", "game", "book"]);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ type: string }> }
) {
  const { type } = await ctx.params;
  if (!VALID.has(type as MediaType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([] as SearchResult[]);
  }

  const tmdbKey = process.env.TMDB_API_KEY;
  const rawgKey = process.env.RAWG_API_KEY;
  const gbKey = process.env.GOOGLE_BOOKS_API_KEY;

  try {
    let results: SearchResult[] = [];
    if (type === "film" || type === "tv") {
      if (!tmdbKey) {
        return NextResponse.json(
          { error: "TMDB_API_KEY not configured" },
          { status: 503 }
        );
      }
      results = await searchTmdb(type, q, tmdbKey);
    } else if (type === "game") {
      if (!rawgKey) {
        return NextResponse.json(
          { error: "RAWG_API_KEY not configured" },
          { status: 503 }
        );
      }
      results = await searchRawg(q, rawgKey);
    } else if (type === "book") {
      results = await searchGoogleBooks(q, gbKey);
    }
    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  } catch (e) {
    if (e instanceof TmdbError) {
      // Pass through the real status so the client can distinguish 401/404/etc.
      return NextResponse.json(
        { error: e.message, tmdbStatus: e.status },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 }
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
