"use client";

import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { itemsRepo } from "@/lib/db/repo";
import { fetchCoverBlob } from "@/lib/db/cover";
import { useToast } from "@/components/ui/toast";
import { getMediaMeta, type MediaType, type SearchResult, type Item } from "@/lib/types";

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mediaType: MediaType;
}

export function AddItemDialog({ open, onOpenChange, mediaType }: AddItemDialogProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();
  const meta = getMediaMeta(mediaType);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open) return;
    setQuery("");
    setDebounced("");
    setSaving(null);
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const search = useQuery<SearchResult[]>({
    queryKey: ["search", mediaType, debounced],
    enabled: debounced.length >= 2,
    queryFn: async () => {
      const url = `/api/search/${mediaType}?q=${encodeURIComponent(debounced)}`;
      console.debug("[relog] search", url);
      const res = await fetch(url);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; tmdbStatus?: number };
        const msg =
          res.status === 401
            ? "Invalid TMDB key — check Vercel env var."
            : res.status === 404
            ? "Search route not found — the deployment may be outdated. Redeploy on Vercel."
            : res.status === 503
            ? (body.error || "API key not configured on the server.")
            : body.error || `Search failed (${res.status})`;
        throw new Error(msg);
      }
      return res.json();
    },
  });

  async function pick(r: SearchResult) {
    if (saving) return;
    setSaving(r.sourceId);
    try {
      const blob = (await fetchCoverBlob(r.coverUrl)) ?? undefined;
      const item: Omit<Item, "id" | "addedAt" | "status"> = {
        mediaType: r.mediaType,
        source: r.source,
        sourceId: r.sourceId,
        title: r.title,
        year: r.year,
        subtitle: r.subtitle,
        coverUrl: r.coverUrl,
        coverBlob: blob,
      };
      await itemsRepo.create(item);
      success(`Added ${meta.label.toLowerCase()}`, r.title);
      onOpenChange(false);
    } catch (e) {
      error("Could not add item", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="fixed left-1/2 top-1/2 z-50 w-[min(96vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
              >
                <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
                  <Search className="h-4 w-4 text-[var(--color-muted)]" />
                  <Dialog.Title asChild>
                    <h3 className="font-serif text-base">Add a {meta.label.toLowerCase()}</h3>
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      className="ml-auto rounded-full p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="px-4 pt-3">
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${meta.plural.toLowerCase()}…`}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {debounced.length < 2 ? (
                    <div className="px-3 py-8 text-center text-xs text-[var(--color-muted)]">
                      Type at least 2 characters to search.
                    </div>
                  ) : search.isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-xs text-[var(--color-muted)]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Searching…
                    </div>
                  ) : search.isError ? (
                    <div className="px-3 py-6 text-center text-xs text-red-400">
                      <div className="font-medium">Search failed</div>
                      <div className="mt-1 text-[11px] text-red-400/80">
                        {search.error instanceof Error ? search.error.message : "Unknown error"}
                      </div>
                    </div>
                  ) : !search.data || search.data.length === 0 ? (
                    <div className="px-3 py-8 text-center text-xs text-[var(--color-muted)]">
                      No results.
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {search.data.map((r) => (
                        <li key={`${r.source}:${r.sourceId}`}>
                          <button
                            onClick={() => pick(r)}
                            disabled={saving === r.sourceId}
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-50"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.coverUrl}
                              alt=""
                              className="h-14 w-10 shrink-0 rounded object-cover bg-[var(--color-surface-2)]"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{r.title}</div>
                              <div className="truncate text-xs text-[var(--color-muted)]">
                                {r.year ?? ""}
                                {r.subtitle ? ` · ${r.subtitle}` : ""}
                              </div>
                            </div>
                            {saving === r.sourceId && (
                              <Loader2 className="h-4 w-4 animate-spin text-[var(--color-gold-bright)]" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Dialog.Description className="sr-only">
                  Search and add a {meta.label.toLowerCase()} to your backlog.
                </Dialog.Description>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
