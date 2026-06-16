import type { SearchResult } from "@/lib/types";

const RAWG_BASE = "https://api.rawg.io/api";

interface RawgGame {
  id: number;
  name: string;
  released?: string;
  background_image?: string;
}

export async function searchRawg(query: string, apiKey: string): Promise<SearchResult[]> {
  if (!apiKey) return [];
  const url = `${RAWG_BASE}/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=12`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { results: RawgGame[] };
  return (json.results || [])
    .filter((g) => g.background_image)
    .map((g) => ({
      source: "rawg" as const,
      sourceId: String(g.id),
      mediaType: "game" as const,
      title: g.name,
      year: g.released ? Number(g.released.slice(0, 4)) : undefined,
      coverUrl: g.background_image!,
    }));
}

interface RawgDetail {
  id: number;
  name: string;
  released?: string;
  description?: string;
  genres?: { name: string }[];
  developers?: { name: string }[];
  publishers?: { name: string }[];
}

export async function fetchRawgDetails(
  rawgId: string,
  apiKey: string
): Promise<{
  overview?: string;
  genres?: string[];
  released?: string;
  director?: string;
} | null> {
  if (!apiKey) return null;
  const res = await fetch(`${RAWG_BASE}/games/${rawgId}?key=${apiKey}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as RawgDetail;
  return {
    overview: json.description?.replace(/<[^>]+>/g, "").slice(0, 2000) || undefined,
    genres: json.genres?.map((g) => g.name).slice(0, 6),
    released: json.released,
    director: json.developers?.[0]?.name,
  };
}
