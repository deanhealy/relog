"use client";

import Dexie, { type EntityTable } from "dexie";
import type { Item } from "@/lib/types";

class RelogDB extends Dexie {
  items!: EntityTable<Item, "id">;

  constructor() {
    super("relog");
    this.version(1).stores({
      items:
        "id, mediaType, status, rating, addedAt, completedAt, [mediaType+status]",
    });
  }
}

let _db: RelogDB | null = null;

export function getDB(): RelogDB {
  if (typeof window === "undefined") {
    throw new Error("Dexie can only be used in the browser");
  }
  if (!_db) _db = new RelogDB();
  return _db;
}
