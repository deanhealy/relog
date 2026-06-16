import { NextRequest, NextResponse } from "next/server";
import { fetchTmdbDetails } from "@/lib/api/tmdb";
import { fetchRawgDetails } from "@/lib/api/rawg";
import { fetchGoogleBooksDetails } from "@/lib/api/googlebooks";
import type { ItemDetails } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await ctx.params;
  const tmdbKey = process.env.TMDB_API_KEY;
  const rawgKey = process.env.RAWG_API_KEY;
  const gbKey = process.env.GOOGLE_BOOKS_API_KEY;

  try {
    let details: ItemDetails | null = null;
    if (type === "films" || type === "tv") {
      if (!tmdbKey) {
        return NextResponse.json({ error: "TMDB key missing" }, { status: 503 });
      }
      details = await fetchTmdbDetails(
        type === "films" ? "film" : "tv",
        id,
        tmdbKey
      );
    } else if (type === "games") {
      if (!rawgKey) {
        return NextResponse.json({ error: "RAWG key missing" }, { status: 503 });
      }
      details = await fetchRawgDetails(id, rawgKey);
    } else if (type === "books") {
      details = await fetchGoogleBooksDetails(id, gbKey);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!details) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(details, {
      headers: { "Cache-Control": "public, s-maxage=3600" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
