"use client";

import { useState } from "react";
import type { MediaType, Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus } from "lucide-react";
import { itemsRepo } from "@/lib/db/repo";
import { EmptyAddCard } from "@/components/cards/EmptyAddCard";
import { ItemCard } from "@/components/cards/ItemCard";
import { CardGrid } from "@/components/cards/CardGrid";
import { getMediaMeta } from "@/lib/types";
import { AddItemDialog } from "@/components/forms/AddItemDialog";

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "backlog", label: "Backlog" },
  { key: "completed", label: "Completed" },
];

export function CategoryView({ type }: { type: MediaType }) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [addOpen, setAddOpen] = useState(false);

  const items = useLiveQuery(() => itemsRepo.list(type), [type], []);

  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  const meta = getMediaMeta(type);
  const counts = {
    all: items.length,
    backlog: items.filter((i) => i.status === "backlog").length,
    completed: items.filter((i) => i.status === "completed").length,
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {meta.plural}
          </p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight">
            {counts.all} {counts.all === 1 ? "item" : "items"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-1 text-xs">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "relative rounded-full px-3 py-1.5 transition-colors",
                  filter === f.key
                    ? "text-[var(--color-bg)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                )}
              >
                {filter === f.key && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-full bg-[var(--color-gold-bright)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {f.label}
                  <span className="ml-1.5 opacity-60">{counts[f.key]}</span>
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold-bright)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg)] transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            Add
          </button>
        </div>
      </div>

      <CardGrid>
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
        <EmptyAddCard onClick={() => setAddOpen(true)} label="Add" />
      </CardGrid>

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mediaType={type}
      />
    </div>
  );
}
