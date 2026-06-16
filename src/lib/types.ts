export type MediaType = "film" | "tv" | "game" | "book";
export type Status = "backlog" | "completed";
export type Source = "tmdb" | "rawg" | "googlebooks";

export interface Item {
  id: string;
  mediaType: MediaType;
  source: Source;
  sourceId: string;
  title: string;
  year?: number;
  subtitle?: string;
  coverUrl: string;
  coverBlob?: Blob;
  rating?: 1 | 2 | 3 | 4 | 5;
  review?: string;
  status: Status;
  addedAt: number;
  completedAt?: number;
}

export interface SearchResult {
  source: Source;
  sourceId: string;
  mediaType: MediaType;
  title: string;
  year?: number;
  subtitle?: string;
  coverUrl: string;
}

export const MEDIA_TYPES: { type: MediaType; label: string; plural: string }[] = [
  { type: "film", label: "Film", plural: "Films" },
  { type: "tv", label: "TV Show", plural: "TV" },
  { type: "game", label: "Game", plural: "Games" },
  { type: "book", label: "Book", plural: "Books" },
];

export function getMediaMeta(type: MediaType) {
  return MEDIA_TYPES.find((m) => m.type === type)!;
}
