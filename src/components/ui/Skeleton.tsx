"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--color-surface-2)]",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="aspect-[3/5] w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
