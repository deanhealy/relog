"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, Film, Tv, Gamepad2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { itemsRepo } from "@/lib/db/repo";
import { fetchCoverBlob } from "@/lib/db/cover";
import { useToast } from "@/components/ui/toast";
import type { Item, MediaType, SearchResult } from "@/lib/types";
import { getMediaMeta, MEDIA_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";

const ICONS: Record<MediaType, React.ComponentType<{ className?: string }>> = {
  film: Film,
  tv: Tv,
  game: Gamepad2,
  book: BookOpen,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"local" | "all">("local");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mediaType, setMediaType] = useState<MediaType | "all">("all");
  const [saving, setSaving] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { success, error } = useToast();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !inField && !open) {
        const p = window.location.pathname;
        const onCategory =
          p.startsWith("/films") || p.startsWith("/tv") || p.startsWith("/games") || p.startsWith("/books");
        if (!onCategory) {
          e.preventDefault();
          setOpen(true);
        }
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("relog:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("relog:open-palette", onOpen);
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQuery("");
      setDebounced("");
      setMediaType("all");
      setTab("local");
      setSaving(null);
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const allItems = useLiveQuery(() => itemsRepo.list(), [], []);
  const localResults = useMemo(() => {
    if (tab !== "local" || debounced.length < 1) return [];
    const q = debounced.toLowerCase();
    return allItems
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.subtitle ?? "").toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [allItems, debounced, tab]);

  const apiType: MediaType | null =
    mediaType === "all" ? null : mediaType;
  const apiQuery = useQuery<SearchResult[]>({
    queryKey: ["cmd-palette", apiType ?? "all", debounced],
    enabled: tab === "all" && debounced.length >= 2 && apiType != null,
    queryFn: async () => {
      const res = await fetch(`/api/search/${apiType}?q=${encodeURIComponent(debounced)}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Search failed (${res.status})`);
      }
      return res.json();
    },
  });

  async function pickRemote(r: SearchResult) {
    if (saving) return;
    setSaving(r.sourceId);
    try {
      const blob = (await fetchCoverBlob(r.coverUrl)) ?? undefined;
      await itemsRepo.create({
        mediaType: r.mediaType,
        source: r.source,
        sourceId: r.sourceId,
        title: r.title,
        year: r.year,
        subtitle: r.subtitle,
        coverUrl: r.coverUrl,
        coverBlob: blob,
      });
      success(`Added ${r.title}`);
      setOpen(false);
    } catch (e) {
      error("Could not add", e instanceof Error ? e.message : "");
    } finally {
      setSaving(null);
    }
  }

  function pickLocal(item: Item) {
    setOpen(false);
    const path =
      item.mediaType === "tv"
        ? `/tv/${item.id}`
        : item.mediaType === "game"
        ? `/games/${item.id}`
        : item.mediaType === "film"
        ? `/films/${item.id}`
        : `/books/${item.id}`;
    router.push(path);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
                className="fixed left-1/2 top-[10vh] z-50 w-[min(96vw,640px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
              >
                <Dialog.Title className="sr-only">Search</Dialog.Title>
                <Dialog.Description className="sr-only">Search your library or add a new item.</Dialog.Description>
                <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
                  <Search className="h-4 w-4 text-[var(--color-muted)]" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search your library or add something new…"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
                  />
                  <kbd className="hidden rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)] sm:inline">
                    Esc
                  </kbd>
                </div>
                <div className="flex items-center gap-1 border-b border-[var(--color-border)] bg-[var(--color-bg)]/30 px-3 py-2 text-xs">
                  <button
                    onClick={() => setTab("local")}
                    className={cn(
                      "rounded-full px-3 py-1",
                      tab === "local"
                        ? "bg-[var(--color-gold-bright)] text-[var(--color-bg)]"
                        : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                    )}
                  >
                    Your library
                  </button>
                  <button
                    onClick={() => setTab("all")}
                    className={cn(
                      "rounded-full px-3 py-1",
                      tab === "all"
                        ? "bg-[var(--color-gold-bright)] text-[var(--color-bg)]"
                        : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                    )}
                  >
                    Add new
                  </button>
                  {tab === "all" && (
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => setMediaType("all")}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px]",
                          mediaType === "all"
                            ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                            : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                        )}
                      >
                        All
                      </button>
                      {MEDIA_TYPES.map(({ type, label }) => (
                        <button
                          key={type}
                          onClick={() => setMediaType(type)}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px]",
                            mediaType === type
                              ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                              : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {tab === "local" ? (
                    debounced.length < 1 ? (
                      <Hint
                        text="Search your saved items by title."
                        hint="Press Esc to close"
                      />
                    ) : localResults.length === 0 ? (
                      <Hint text="No matches in your library." />
                    ) : (
                      <ul className="flex flex-col gap-0.5">
                        {localResults.map((i) => (
                          <LocalRow key={i.id} item={i} onClick={() => pickLocal(i)} />
                        ))}
                      </ul>
                    )
                  ) : mediaType === "all" ? (
                    <Hint text="Pick a category above (Films, TV, Games, Books) to search." />
                  ) : debounced.length < 2 ? (
                    <Hint text="Type at least 2 characters to search." />
                  ) : apiQuery.isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-xs text-[var(--color-muted)]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Searching {getMediaMeta(mediaType).plural.toLowerCase()}…
                    </div>
                  ) : apiQuery.isError ? (
                    <div className="px-3 py-6 text-center text-xs text-red-400">
                      <div className="font-medium">Search failed</div>
                      <div className="mt-1 text-[11px] text-red-400/80">
                        {apiQuery.error instanceof Error ? apiQuery.error.message : ""}
                      </div>
                    </div>
                  ) : !apiQuery.data || apiQuery.data.length === 0 ? (
                    <Hint text="No results." />
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {apiQuery.data.map((r) => (
                        <RemoteRow
                          key={`${r.source}:${r.sourceId}`}
                          r={r}
                          saving={saving === r.sourceId}
                          onClick={() => pickRemote(r)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Hint({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="px-3 py-8 text-center text-xs text-[var(--color-muted)]">
      {text}
      {hint && <div className="mt-1 text-[10px] opacity-70">{hint}</div>}
    </div>
  );
}

function LocalRow({ item, onClick }: { item: Item; onClick: () => void }) {
  const Icon = ICONS[item.mediaType];
  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <CoverThumb item={item} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.title}</div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted)]">
            <Icon className="h-3 w-3" />
            <span>{getMediaMeta(item.mediaType).label}</span>
            {item.year && <span>· {item.year}</span>}
            {item.status === "completed" && (
              <span className="rounded-full bg-[var(--color-gold)]/15 px-1.5 text-[var(--color-gold-bright)]">
                Done{item.rating ? ` · ${item.rating}/5` : ""}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function RemoteRow({
  r,
  saving,
  onClick,
}: {
  r: SearchResult;
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        disabled={saving}
        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r.coverUrl}
          alt=""
          className="h-12 w-9 shrink-0 rounded object-cover bg-[var(--color-surface-2)]"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{r.title}</div>
          <div className="truncate text-[10px] text-[var(--color-muted)]">
            {getMediaMeta(r.mediaType).label}
            {r.year ? ` · ${r.year}` : ""}
            {r.subtitle ? ` · ${r.subtitle}` : ""}
          </div>
        </div>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-gold-bright)]" />
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-gold-bright)]">
            Add
          </span>
        )}
      </button>
    </li>
  );
}

function CoverThumb({ item }: { item: Item }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!item.coverBlob) return;
    const u = URL.createObjectURL(item.coverBlob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.coverBlob]);
  const src = url ?? item.coverUrl;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-12 w-9 shrink-0 rounded object-cover bg-[var(--color-surface-2)]"
      loading="lazy"
    />
  ) : (
    <div className="h-12 w-9 shrink-0 rounded bg-[var(--color-surface-2)]" />
  );
}
