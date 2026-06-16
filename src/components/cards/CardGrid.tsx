"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5",
        "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
        className
      )}
    >
      {children}
    </div>
  );
}
