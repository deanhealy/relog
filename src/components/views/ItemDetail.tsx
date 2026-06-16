"use client";

import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trash2, CheckCircle2, RotateCcw, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { itemsRepo } from "@/lib/db/repo";
import type { Item, ItemDetails } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export function ItemDetail({ id }: { id: string }) {
  const router = useRouter();
  const item = useLiveQuery(() => itemsRepo.get(id), [id], undefined);
  const { success, error } = useToast();

  if (item === undefined) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }
  if (item === null || !item) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-[var(--color-muted)]">
        Not found.{" "}
        <Link href="/" className="ml-1 text-[var(--color-gold-bright)] hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <DetailBody
      item={item}
      onClose={() => router.back()}
      onDelete={async () => {
        try {
          await itemsRepo.remove(item.id);
          success("Removed", item.title);
          router.back();
        } catch (e) {
          error("Could not remove", e instanceof Error ? e.message : "");
        }
      }}
    />
  );
}

function typeToPlural(t: Item["mediaType"]): "films" | "tv" | "games" | "books" {
  if (t === "tv") return "tv";
  if (t === "game") return "games";
  return t === "film" ? "films" : "books";
}

function DetailBody({ item, onClose, onDelete }: { item: Item; onClose: () => void; onDelete: () => void }) {
  const [review, setReview] = useState(item.review ?? "");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | undefined>(item.rating);
  const [status, setStatus] = useState(item.status);
  const { success } = useToast();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch details if not already cached
  const detailsKey = typeToPlural(item.mediaType);
  const hasDetails = item.details != null;
  const cached = hasDetails;
  const detailsQuery = useQuery<ItemDetails>({
    queryKey: ["details", detailsKey, item.sourceId],
    enabled: !cached,
    queryFn: async () => {
      const res = await fetch(`/api/details/${detailsKey}/${item.sourceId}`);
      if (!res.ok) throw new Error("Details failed");
      const data = (await res.json()) as ItemDetails;
      await itemsRepo.update(item.id, {
        details: data,
        detailsFetchedAt: Date.now(),
      });
      return data;
    },
  });
  const details = item.details ?? detailsQuery.data;

  useEffect(() => {
    if (review === (item.review ?? "")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await itemsRepo.update(item.id, { review });
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [review, item.id, item.review]);

  useEffect(() => {
    if (status !== item.status) {
      itemsRepo.update(item.id, {
        status,
        completedAt: status === "completed" ? Date.now() : undefined,
      });
    }
  }, [status, item.id, item.status]);

  useEffect(() => {
    if (rating !== item.rating) {
      itemsRepo.update(item.id, { rating });
    }
  }, [rating, item.id, item.rating]);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!item.coverBlob) return;
    const u = URL.createObjectURL(item.coverBlob);
    setCoverUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.coverBlob]);
  const cover = coverUrl ?? item.coverUrl;

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        <Dialog.Portal forceMount>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed left-1/2 top-1/2 z-50 w-[min(96vw,920px)] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
            >
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white/80 hover:bg-black/80 hover:text-white"
                aria-label="Close"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="grid gap-0 md:grid-cols-[300px_1fr]">
                <div className="relative aspect-[3/5] w-full overflow-hidden md:rounded-l-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <div className="flex flex-col gap-4 p-5 md:p-7">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      {item.year ?? "—"}
                      {details?.runtime ? ` · ${formatRuntime(details.runtime, item.mediaType)}` : ""}
                      {details?.pageCount ? ` · ${details.pageCount} pages` : ""}
                    </p>
                    <Dialog.Title asChild>
                      <h1 className="mt-1 font-serif text-2xl leading-tight tracking-tight md:text-3xl">
                        {item.title}
                      </h1>
                    </Dialog.Title>
                    {item.subtitle && (
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{item.subtitle}</p>
                    )}
                    {details && (details.director || (details.authors && details.authors.length > 0)) && (
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {details.director ? `Dir. ${details.director}` : ""}
                        {details.authors && details.authors.length > 0 ? `By ${details.authors.join(", ")}` : ""}
                        {details.publisher ? ` · ${details.publisher}` : ""}
                      </p>
                    )}
                  </div>

                  {details?.genres && details.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {details.genres.map((g) => (
                        <span
                          key={g}
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {detailsQuery.isLoading && !details && (
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading details…
                    </div>
                  )}

                  {details?.overview && (
                    <p className="text-sm leading-relaxed text-[var(--color-text)]/90">
                      {details.overview}
                    </p>
                  )}

                  {details?.cast && details.cast.length > 0 && (
                    <div>
                      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                        Cast
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {details.cast.map((c) => (
                          <span
                            key={c.name}
                            className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-text)]/80"
                            title={c.character}
                          >
                            {c.name}
                            {c.character && (
                              <span className="ml-1 text-[var(--color-muted)]">as {c.character}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">Rating</div>
                    <StarPicker value={rating} onChange={setRating} />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Review</span>
                      <span className="text-[10px] text-[var(--color-muted)] tabular-nums">
                        {review.length} chars
                      </span>
                    </div>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="What did you think?"
                      className="font-serif min-h-[140px] w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm leading-relaxed outline-none focus:border-[var(--color-gold)]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
                    {status === "backlog" ? (
                      <button
                        onClick={() => {
                          setStatus("completed");
                          success("Marked complete", item.title);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold-bright)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg)] transition-transform hover:scale-105 active:scale-95"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark as completed
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus("backlog")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Move back to backlog
                      </button>
                    )}
                    <a
                      href={externalUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] text-[var(--color-muted)] hover:text-[var(--color-gold-bright)]"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {item.source === "tmdb" ? "TMDB" : item.source === "rawg" ? "RAWG" : "Google Books"}
                    </a>
                    <button
                      onClick={onDelete}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-red-500/30 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              <Dialog.Description className="sr-only">Detail and review for {item.title}.</Dialog.Description>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </AnimatePresence>
    </Dialog.Root>
  );
}

function formatRuntime(minutes: number, type: Item["mediaType"]): string {
  if (type === "tv") return `${minutes} min/ep`;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function externalUrl(item: Item): string {
  if (item.source === "tmdb") {
    return item.mediaType === "tv"
      ? `https://www.themoviedb.org/tv/${item.sourceId}`
      : `https://www.themoviedb.org/movie/${item.sourceId}`;
  }
  if (item.source === "rawg") {
    return `https://rawg.io/games/${item.sourceId}`;
  }
  return `https://books.google.com/books?id=${item.sourceId}`;
}

function StarPicker({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: 1 | 2 | 3 | 4 | 5 | undefined) => void;
}) {
  const [hover, setHover] = useState<number | undefined>(undefined);
  const display = hover ?? value ?? 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(undefined)}
          onClick={() => onChange(i === value ? undefined : (i as 1 | 2 | 3 | 4 | 5))}
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
          className="rounded p-0.5 transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              i <= display
                ? "fill-[var(--color-gold-bright)] text-[var(--color-gold-bright)]"
                : "text-[var(--color-border)]"
            )}
          />
        </button>
      ))}
      {value != null && (
        <span className="ml-2 text-sm font-medium text-[var(--color-gold-bright)] tabular-nums">
          {value}/5
        </span>
      )}
    </div>
  );
}
