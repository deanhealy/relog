import type { SearchResult, MediaType } from "@/lib/types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w342";

interface TmdbMovie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
}
interface TmdbTv {
  id: number;
  name: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string;
}

/**
 * TMDB accepts two auth forms:
 *   - v4 read access token (long JWT, starts with "eyJ…")  → use as Bearer
 *   - v3 API key (32-char hex)                              → pass as ?api_key=
 * We detect which one we have and use it correctly. We also throw on non-OK
 * responses with the actual status + body so callers can surface a real error
 * (e.g. 401 "Invalid API key") instead of silently returning [].
 */
export class TmdbError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`TMDB ${status}: ${body.slice(0, 200)}`);
    this.status = status;
    this.body = body;
  }
}

function authHeader(key: string): { header?: Record<string, string>; query?: string } {
  const trimmed = key.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("eyJ") || trimmed.includes(".")) {
    return { header: { Authorization: `Bearer ${trimmed}` } };
  }
  return { query: `&api_key=${encodeURIComponent(trimmed)}` };
}

export async function searchTmdb(
  mediaType: "film" | "tv",
  query: string,
  apiKey: string
): Promise<SearchResult[]> {
  if (!apiKey || !apiKey.trim()) return [];
  const endpoint = mediaType === "film" ? "search/movie" : "search/tv";
  const auth = authHeader(apiKey);
  const url =
    `${TMDB_BASE}/${endpoint}?query=${encodeURIComponent(query)}` +
    `&include_adult=false&language=en-US&page=1` +
    (auth.query ?? "");

  const res = await fetch(url, {
    headers: { accept: "application/json", ...(auth.header ?? {}) },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TmdbError(res.status, body);
  }
  const json = (await res.json()) as { results: (TmdbMovie | TmdbTv)[] };
  const mt: MediaType = mediaType;
  return (json.results || [])
    .filter((r) => "poster_path" in r && r.poster_path)
    .slice(0, 12)
    .map((r) => {
      const isTv = mediaType === "tv";
      const title = isTv ? (r as TmdbTv).name : (r as TmdbMovie).title;
      const date = isTv ? (r as TmdbTv).first_air_date : (r as TmdbMovie).release_date;
      const year = date ? Number(date.slice(0, 4)) : undefined;
      return {
        source: "tmdb" as const,
        sourceId: String((r as TmdbMovie | TmdbTv).id),
        mediaType: mt,
        title,
        year,
        subtitle: (r as TmdbMovie | TmdbTv).overview?.slice(0, 80),
        coverUrl: `${IMG}${(r as TmdbMovie | TmdbTv).poster_path}`,
      };
    });
}
