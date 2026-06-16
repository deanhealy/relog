"use client";

import { Home as HomeIcon, Film, Tv, Gamepad2, BookOpen, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/types";

const ITEMS: { type: MediaType; label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "film", label: "Films", href: "/films", icon: Film },
  { type: "tv", label: "TV", href: "/tv", icon: Tv },
  { type: "game", label: "Games", href: "/games", icon: Gamepad2 },
  { type: "book", label: "Books", href: "/books", icon: BookOpen },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-6 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur md:hidden">
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center gap-0.5 py-2 text-[10px]",
          pathname === "/" ? "text-[var(--color-gold-bright)]" : "text-[var(--color-muted)]"
        )}
      >
        <HomeIcon className="h-4 w-4" />
        <span>Home</span>
      </Link>
      {ITEMS.map(({ type, label, href, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={type}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px]",
              active ? "text-[var(--color-gold-bright)]" : "text-[var(--color-muted)]"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
      <Link
        href="/settings"
        className={cn(
          "flex flex-col items-center gap-0.5 py-2 text-[10px]",
          pathname?.startsWith("/settings") ? "text-[var(--color-gold-bright)]" : "text-[var(--color-muted)]"
        )}
      >
        <SettingsIcon className="h-4 w-4" />
        <span>Settings</span>
      </Link>
    </nav>
  );
}
