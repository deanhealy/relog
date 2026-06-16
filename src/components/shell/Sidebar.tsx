"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Tv, Gamepad2, BookOpen, Library, Settings as SettingsIcon, Home as HomeIcon } from "lucide-react";
import type { MediaType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ITEMS: { type: MediaType; label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "film", label: "Films", href: "/films", icon: Film },
  { type: "tv", label: "TV", href: "/tv", icon: Tv },
  { type: "game", label: "Games", href: "/games", icon: Gamepad2 },
  { type: "book", label: "Books", href: "/books", icon: BookOpen },
];

interface SidebarProps {
  counts?: Partial<Record<MediaType, number>>;
}

export function Sidebar({ counts }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[220px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--color-border)] px-4">
        <Library className="h-5 w-5 text-[var(--color-gold-bright)]" />
        <span className="font-serif text-lg tracking-tight">Relog</span>
      </div>
      <nav className="flex-1 px-2 py-3">
        <ul className="flex flex-col gap-1">
          <li>
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === "/"
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]/60 hover:text-[var(--color-text)]"
              )}
            >
              <HomeIcon
                className={cn(
                  "h-4 w-4 shrink-0",
                  pathname === "/" && "text-[var(--color-gold-bright)]"
                )}
              />
              <span>Home</span>
            </Link>
          </li>
          {ITEMS.map(({ type, label, href, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            const count = counts?.[type];
            return (
              <li key={type}>
                <Link
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]/60 hover:text-[var(--color-text)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active && "text-[var(--color-gold-bright)]"
                    )}
                  />
                  <span className="flex-1">{label}</span>
                  {count != null && count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[10px] font-medium tabular-nums",
                        active
                          ? "bg-[var(--color-gold)]/15 text-[var(--color-gold-bright)]"
                          : "bg-[var(--color-surface-2)] text-[var(--color-muted)] group-hover:text-[var(--color-text)]"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 border-t border-[var(--color-border)] pt-3">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname?.startsWith("/settings")
                ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]/60 hover:text-[var(--color-text)]"
            )}
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>
      <div className="border-t border-[var(--color-border)] px-4 py-3 text-[10px] text-[var(--color-muted)]">
        Data stored locally in your browser.
      </div>
    </aside>
  );
}
