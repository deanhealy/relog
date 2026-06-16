"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { itemsRepo } from "@/lib/db/repo";
import { Film, Tv, Gamepad2, BookOpen, CheckCircle2, Star, Clock, TrendingUp } from "lucide-react";
import { MEDIA_TYPES, type MediaType } from "@/lib/types";
import Link from "next/link";
import { motion } from "framer-motion";

const ICONS: Record<MediaType, React.ComponentType<{ className?: string }>> = {
  film: Film,
  tv: Tv,
  game: Gamepad2,
  book: BookOpen,
};

export function StatsView() {
  const items = useLiveQuery(() => itemsRepo.list(), [], []);

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === "completed");
    const backlog = items.filter((i) => i.status === "backlog");
    const rated = items.filter((i) => i.rating != null);
    const avg =
      rated.length === 0
        ? 0
        : rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length;
    const byType: Record<MediaType, { total: number; done: number; avg: number }> = {
      film: { total: 0, done: 0, avg: 0 },
      tv: { total: 0, done: 0, avg: 0 },
      game: { total: 0, done: 0, avg: 0 },
      book: { total: 0, done: 0, avg: 0 },
    };
    for (const i of items) {
      byType[i.mediaType].total++;
      if (i.status === "completed") byType[i.mediaType].done++;
    }
    for (const t of Object.keys(byType) as MediaType[]) {
      const ratedInType = items.filter((i) => i.mediaType === t && i.rating != null);
      byType[t].avg =
        ratedInType.length === 0
          ? 0
          : ratedInType.reduce((s, i) => s + (i.rating ?? 0), 0) / ratedInType.length;
    }
    return { total, completed, backlog, rated, avg, byType };
  }, [items]);

  const recent = useMemo(
    () =>
      [...items]
        .filter((i) => i.completedAt)
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
        .slice(0, 5),
    [items]
  );

  const topRated = useMemo(
    () =>
      [...items]
        .filter((i) => i.rating != null)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 5),
    [items]
  );

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Overview</p>
      <h2 className="mt-1 font-serif text-2xl tracking-tight">Your backlog at a glance</h2>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Backlog"
          value={stats.backlog.length}
          color="text-[var(--color-gold-bright)]"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed.length}
          color="text-emerald-400"
        />
        <StatCard
          icon={Star}
          label="Avg rating"
          value={stats.rated.length === 0 ? "—" : stats.avg.toFixed(1)}
          sub={stats.rated.length === 0 ? "no ratings" : `${stats.rated.length} rated`}
          color="text-[var(--color-gold-bright)]"
        />
        <StatCard
          icon={TrendingUp}
          label="Total"
          value={stats.total}
          sub={stats.total === 0 ? "start adding" : undefined}
          color="text-[var(--color-text)]"
        />
      </div>

      <h3 className="mt-10 text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">By category</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MEDIA_TYPES.map(({ type, plural }) => {
          const Icon = ICONS[type];
          const s = stats.byType[type];
          const pct = s.total === 0 ? 0 : (s.done / s.total) * 100;
          const href = type === "tv" ? "/tv" : type === "game" ? "/games" : `/${type}s`;
          return (
            <Link
              key={type}
              href={href}
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 transition-colors hover:border-[var(--color-gold)]"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--color-gold-bright)]" />
                <div className="text-sm font-medium">{plural}</div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="font-serif text-2xl">{s.total}</div>
                <div className="text-[10px] text-[var(--color-muted)]">
                  {s.done} done
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="h-full bg-[var(--color-gold-bright)]"
                />
              </div>
              {s.avg > 0 && (
                <div className="mt-2 text-[10px] text-[var(--color-muted)]">
                  Avg {s.avg.toFixed(1)}/5
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {recent.length > 0 && (
        <section className="mt-10">
          <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Recently completed
          </h3>
          <ul className="mt-3 flex flex-col divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50">
            {recent.map((i) => {
              const Icon = ICONS[i.mediaType];
              const href =
                i.mediaType === "tv"
                  ? `/tv/${i.id}`
                  : i.mediaType === "game"
                  ? `/games/${i.id}`
                  : `/${i.mediaType === "film" ? "films" : "books"}/${i.id}`;
              return (
                <li key={i.id}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-surface-2)]"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[var(--color-gold-bright)]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{i.title}</div>
                      <div className="text-[10px] text-[var(--color-muted)]">
                        {new Date(i.completedAt ?? 0).toLocaleDateString()}
                      </div>
                    </div>
                    {i.rating != null && (
                      <div className="flex items-center gap-0.5 text-[10px] text-[var(--color-gold-bright)]">
                        <Star className="h-3 w-3 fill-current" />
                        {i.rating}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {topRated.length > 0 && (
        <section className="mt-10">
          <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Top rated
          </h3>
          <ul className="mt-3 flex flex-col divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50">
            {topRated.map((i) => {
              const Icon = ICONS[i.mediaType];
              const href =
                i.mediaType === "tv"
                  ? `/tv/${i.id}`
                  : i.mediaType === "game"
                  ? `/games/${i.id}`
                  : `/${i.mediaType === "film" ? "films" : "books"}/${i.id}`;
              return (
                <li key={i.id}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-surface-2)]"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[var(--color-gold-bright)]" />
                    <div className="min-w-0 flex-1 truncate text-sm">{i.title}</div>
                    <div className="flex items-center gap-0.5 text-xs text-[var(--color-gold-bright)]">
                      <Star className="h-3 w-3 fill-current" />
                      {i.rating}/5
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {items.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/30 p-8 text-center text-sm text-[var(--color-muted)]">
          <p>Nothing here yet.</p>
          <p className="mt-1 text-xs">
            Hit <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5">⌘K</kbd> or
            click <span className="text-[var(--color-gold-bright)]">Add</span> on a category page to get started.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        <Icon className={`h-3.5 w-3.5 ${color ?? ""}`} />
        {label}
      </div>
      <div className="mt-2 font-serif text-2xl">{value}</div>
      {sub && <div className="text-[10px] text-[var(--color-muted)]">{sub}</div>}
    </div>
  );
}
