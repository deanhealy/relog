import type { SearchResult } from "@/lib/types";

const GB_BASE = "https://www.googleapis.com/books/v1/volumes";

interface GbItem {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    description?: string;
  };
}

export async function searchGoogleBooks(
  query: string,
  apiKey: string | undefined
): Promise<SearchResult[]> {
  const url = new URL(GB_BASE);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("printType", "books");
  if (apiKey) url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: GbItem[] };
  const out: SearchResult[] = [];
  for (const b of json.items || []) {
    const v = b.volumeInfo;
    if (!v?.title) continue;
    let cover = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail;
    if (!cover) continue;
    cover = cover.replace(/^http:/, "https:").replace(/&edge=curl/g, "");
    out.push({
      source: "googlebooks",
      sourceId: b.id,
      mediaType: "book",
      title: v.title,
      year: v.publishedDate ? Number(v.publishedDate.slice(0, 4)) : undefined,
      subtitle: v.authors?.slice(0, 2).join(", "),
      coverUrl: cover,
    });
  }
  return out;
}

export async function fetchGoogleBooksDetails(
  volumeId: string,
  apiKey: string | undefined
): Promise<{
  overview?: string;
  authors?: string[];
  pageCount?: number;
  publisher?: string;
  genres?: string[];
} | null> {
  const url = new URL(`${GB_BASE}/${volumeId}`);
  if (apiKey) url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    volumeInfo?: {
      description?: string;
      authors?: string[];
      pageCount?: number;
      publisher?: string;
      categories?: string[];
    };
  };
  const v = json.volumeInfo;
  if (!v) return null;
  return {
    overview: v.description?.replace(/<[^>]+>/g, "").slice(0, 2000) || undefined,
    authors: v.authors,
    pageCount: v.pageCount,
    publisher: v.publisher,
    genres: v.categories?.slice(0, 6),
  };
}
