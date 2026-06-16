"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyAddCard({ onClick, label = "Add" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex aspect-[3/5] w-full flex-col items-center justify-center",
        "rounded-xl border-2 border-dashed border-[var(--color-border)]",
        "bg-[var(--color-surface)]/30 text-[var(--color-muted)]",
        "transition-all hover:border-[var(--color-gold)] hover:bg-[var(--color-surface)]/50 hover:text-[var(--color-gold-bright)]"
      )}
    >
      <Plus
        className="h-12 w-12 opacity-30 transition-all group-hover:scale-110 group-hover:opacity-60"
        strokeWidth={1.5}
      />
      <span className="mt-2 text-xs font-medium uppercase tracking-wider opacity-60 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
