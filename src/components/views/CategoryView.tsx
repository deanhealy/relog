"use client";

import { useState } from "react";
import type { MediaType, Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, ArrowUpDown, Check } from "lucide-react";
import { itemsRepo, sortItems, type SortKey } from "@/lib/db/repo";
import { EmptyAddCard } from "@/components/cards/EmptyAddCard";
import { ItemCard } from "@/components/cards/ItemCard";
import { CardGrid } from "@/components/cards/CardGrid";
import { SortableCardGrid } from "@/components/cards/SortableCardGrid";
import { getMediaMeta } from "@/lib/types";
import { AddItemDialog } from "@/components/forms/AddItemDialog";

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "backlog", label: "Backlog" },
  { key: "completed", label: "Completed" },
];

const SORTS: { key: SortKey | "custom"; label: string }[] = [
  { key: "recent", label: "Recently added" },
  { key: "oldest", label: "Oldest first" },
  { key: "rating", label: "Highest rated" },
  { key: "title", label: "Title (A–Z)" },
  { key: "completed", label: "Recently completed" },
  { key: "custom", label: "Custom order" },
];

export function CategoryView({ type }: { type: MediaType }) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [sort, setSort] = useState<SortKey | "custom">("recent");
  const [addOpen, setAddOpen] = useState(false);
  const [sortMenu, setSortMenu] = useState(false);
  const [genre, setGenre] = useState<string | null>(null);

  const items = useLiveQuery(() => itemsRepo.list(type), [type], []);

  const allGenres = Array.from(
    new Set(items.flatMap((i) => i.details?.genres ?? []))
  ).sort();

  // Apply genre filter on top of status filter
  const statusFiltered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const genreFiltered = genre
    ? statusFiltered.filter((i) => i.details?.genres?.includes(genre))
    : statusFiltered;

  const customOrder = sort === "custom"
    ? [...genreFiltered].sort((a, b) => (b.sortOrder ?? b.addedAt) - (a.sortOrder ?? a.addedAt))
    : null;

  const filtered =
    sort === "custom" ? null : sortItems(genreFiltered, sort as SortKey);

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
        <div className="flex flex-wrap items-center gap-2">
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

          <div className="relative">
            <button
              onClick={() => setSortMenu((s) => !s)}
              onBlur={() => setTimeout(() => setSortMenu(false), 150)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5 text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-muted)]" />
              {SORTS.find((s) => s.key === sort)?.label}
            </button>
            <AnimatePresence>
              {sortMenu && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl"
                >
                  {SORTS.map((s) => (
                    <li key={s.key}>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSort(s.key);
                          setSortMenu(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-1.5 text-xs",
                          s.key === sort
                            ? "text-[var(--color-gold-bright)]"
                            : "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                        )}
                      >
                        {s.label}
                        {s.key === sort && <Check className="h-3 w-3" />}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
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

      {allGenres.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Genre:</span>
          <button
            onClick={() => setGenre(null)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px]",
              genre === null
                ? "bg-[var(--color-gold-bright)] text-[var(--color-bg)]"
                : "border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
            )}
          >
            All
          </button>
          {allGenres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g === genre ? null : g)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px]",
                genre === g
                  ? "bg-[var(--color-gold-bright)] text-[var(--color-bg)]"
                  : "border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {sort === "custom" && customOrder ? (
        customOrder.length > 0 ? (
          <SortableCardGrid items={customOrder} />
        ) : (
          <p className="text-sm text-[var(--color-muted)]">No items in this filter.</p>
        )
      ) : (
        <CardGrid>
          {filtered?.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
          <EmptyAddCard onClick={() => setAddOpen(true)} label="Add" />
        </CardGrid>
      )}
      {sort === "custom" && customOrder && customOrder.length > 0 && (
        <p className="mt-4 text-center text-[10px] text-[var(--color-muted)]">
          Drag the grip handle on a card to reorder.
        </p>
      )}

      {items.length > 0 && (sort === "custom" ? customOrder?.length === 0 : filtered?.length === 0) && (
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          No items in this filter. Try switching tabs above.
        </p>
      )}

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mediaType={type}
      />
    </div>
  );
}
