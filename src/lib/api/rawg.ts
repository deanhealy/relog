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
