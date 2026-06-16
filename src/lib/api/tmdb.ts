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

export async function searchTmdb(
  mediaType: "film" | "tv",
  query: string,
  apiKey: string
): Promise<SearchResult[]> {
  if (!apiKey) return [];
  const endpoint = mediaType === "film" ? "search/movie" : "search/tv";
  const url = `${TMDB_BASE}/${endpoint}?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, next: { revalidate: 60 } });
  if (!res.ok) return [];
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
