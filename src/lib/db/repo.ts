"use client";

import { getDB } from "./db";
import type { Item, MediaType, Status } from "@/lib/types";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const itemsRepo = {
  async list(type?: MediaType): Promise<Item[]> {
    const coll = await getDB().items.orderBy("addedAt").reverse().toArray();
    return type ? coll.filter((i) => i.mediaType === type) : coll;
  },

  async listByTypeAndStatus(type: MediaType, status: Status): Promise<Item[]> {
    return getDB()
      .items.where("[mediaType+status]")
      .equals([type, status])
      .reverse()
      .sortBy("addedAt");
  },

  async get(id: string): Promise<Item | undefined> {
    return getDB().items.get(id);
  },

  async create(
    input: Omit<Item, "id" | "addedAt" | "status"> & { status?: Status }
  ): Promise<Item> {
    const item: Item = {
      ...input,
      id: uuid(),
      status: input.status ?? "backlog",
      addedAt: Date.now(),
    };
    await getDB().items.add(item);
    return item;
  },

  async update(id: string, patch: Partial<Item>): Promise<void> {
    await getDB().items.update(id, patch);
  },

  async markCompleted(id: string, rating?: 1 | 2 | 3 | 4 | 5, review?: string) {
    await getDB().items.update(id, {
      status: "completed",
      completedAt: Date.now(),
      ...(rating !== undefined ? { rating } : {}),
      ...(review !== undefined ? { review } : {}),
    });
  },

  async markBacklog(id: string) {
    await getDB().items.update(id, {
      status: "backlog",
      completedAt: undefined,
    });
  },

  async remove(id: string): Promise<void> {
    await getDB().items.delete(id);
  },

  async clearAll(): Promise<void> {
    await getDB().items.clear();
  },

  async countByType(): Promise<Record<MediaType, number>> {
    const all = await getDB().items.toArray();
    const out: Record<MediaType, number> = { film: 0, tv: 0, game: 0, book: 0 };
    for (const i of all) out[i.mediaType] = (out[i.mediaType] ?? 0) + 1;
    return out;
  },

  async exportJson(): Promise<string> {
    const items = await getDB().items.toArray();
    const serializable = items.map((item) => {
      const { coverBlob, ...rest } = item;
      void coverBlob;
      return rest;
    });
    return JSON.stringify({ version: 1, exportedAt: Date.now(), items: serializable }, null, 2);
  },
};
